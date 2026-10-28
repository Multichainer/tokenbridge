require('../env')
const logger = require('./services/logger')
const { redis } = require('./services/redisClient')
const store = require('./services/approvalStore')
const telegramClient = require('./services/telegramClient')
const { connectApprovalToQueue, publishJobs } = require('./services/amqpClient')
const { getChainId } = require('./tx/web3')
const { web3Home, web3Foreign } = require('./services/web3')
const { EXIT_CODES } = require('./utils/constants')
const {
  APPROVAL_QUEUE,
  isTxApprovalEnabled,
  readApprovalConfig,
  validateEnvelope,
  requestId,
  classifyExisting,
  notifyDeadlineReached,
  noteNotifyFailure,
  deferNotify,
  stampRecord,
  recordMacValid,
  signatureAlreadyApproved,
  decodeJob,
  signJobs,
  decisionFromCallback,
  parseCallbackData,
  jobsForSender,
  formatApprovalMessage,
  parseMessageContent
} = require('./services/txApproval')

delete process.env.ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

let telegram
let chainIds = null

function messageText(record, decisionLine) {
  const base = formatApprovalMessage(record, chainIds)
  if (!decisionLine) return base
  return `${base}\n\n<b>${decisionLine}</b>`
}

async function editDecision(config, record, decisionLine) {
  if (!record || !record.telegramMessageId) return
  const chatId = record.telegramChatId || config.chatId
  try {
    await telegram.editDecision(chatId, record.telegramMessageId, messageText(record, decisionLine))
  } catch (e) {
    logger.error({ id: record.id, err: e.message }, 'Failed to update the Telegram approval message')
  }
}

async function saveRecord(config, record) {
  await store.save(stampRecord(record, config.stateSecret))
}

async function loadRecord(config, id) {
  const record = await store.get(id)
  if (!record) return null
  if (!recordMacValid(record, config.stateSecret)) {
    logger.error({ id }, 'Dropping approval record with an invalid signature')
    return null
  }
  return record
}

async function deferForTelegramTimeout(config, record, errorMessage) {
  const deferred = deferNotify(record, Date.now(), errorMessage || record.lastNotifyError)
  await saveRecord(config, deferred)
  logger.error(
    {
      id: deferred.id,
      attempts: deferred.notifyAttempts,
      err: deferred.lastNotifyError,
      nextRetryAt: deferred.nextRetryAt
    },
    'Telegram delivery failed for one minute. The card will be retried later.'
  )
}

async function notify(config, record) {
  const sent = await telegram.sendApproval(config.chatId, formatApprovalMessage(record, chainIds), record.id)
  record.status = 'pending'
  record.telegramMessageId = sent.message_id
  record.telegramChatId = sent.chat && sent.chat.id
  await saveRecord(config, record)
  logger.info({ id: record.id, telegramMessageId: record.telegramMessageId }, 'Approval request sent to Telegram')
}

async function forwardApproved(config, id) {
  const locked = await store.acquire(id)
  if (!locked) return false

  try {
    const fresh = await loadRecord(config, id)
    if (!fresh || fresh.status !== 'approved') return false
    await publishJobs(fresh.targetQueue, signJobs(jobsForSender(fresh.jobs), config.stateSecret))
    fresh.status = 'forwarded'
    fresh.forwardedAt = Date.now()
    await saveRecord(config, fresh)
    logger.info(
      { id, targetQueue: fresh.targetQueue, jobs: fresh.jobs.length },
      'Approved jobs forwarded to the sender'
    )
    return true
  } finally {
    await store.release(id)
  }
}

async function recoverApproved(config) {
  const records = await store.list()
  const approved = records.filter(
    record => record.status === 'approved' && recordMacValid(record, config.stateSecret)
  )
  for (let i = 0; i < approved.length; i++) {
    try {
      await forwardApproved(config, approved[i].id)
    } catch (e) {
      logger.error({ id: approved[i].id, err: e.message }, 'Failed to forward an approved request')
    }
  }
}

async function retryDeferred(config) {
  const now = Date.now()
  const records = await store.list()
  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    if (record.status !== 'deferred' || !recordMacValid(record, config.stateSecret)) continue
    if (record.nextRetryAt && record.nextRetryAt > now) continue
    try {
      await notify(config, Object.assign({}, record, { status: 'pending' }))
    } catch (e) {
      await deferForTelegramTimeout(config, record, e.message)
    }
  }
}

async function acceptEnvelope(config, envelope) {
  const invalid = validateEnvelope(envelope)
  if (invalid) {
    logger.error({ reason: invalid }, 'Dropping invalid approval message')
    return 'ack'
  }

  const id = requestId(envelope)
  let record = await loadRecord(config, id)
  let action = classifyExisting(record)

  if (!record && (await store.get(id))) {
    logger.error({ id }, 'Refusing an approval record whose signature does not match')
    return 'ack'
  }

  if (action === 'create') {
    record = stampRecord(
      {
        id,
        status: 'pending',
        targetQueue: envelope.targetQueue,
        event: envelope.event,
        sender: envelope.sender,
        watcherId: envelope.watcherId || '',
        jobs: envelope.jobs,
        createdAt: Date.now()
      },
      config.stateSecret
    )
    const created = await store.createIfAbsent(record)
    if (!created) {
      record = await loadRecord(config, id)
      action = classifyExisting(record)
    } else {
      action = 'notify'
    }
  }

  if (action === 'drop') {
    logger.info({ id, status: record && record.status }, 'Approval already decided')
    return 'ack'
  }
  if (action === 'forward') {
    await forwardApproved(config, id)
    return 'ack'
  }
  if (action === 'defer') {
    logger.info({ id, nextRetryAt: record.nextRetryAt }, 'Approval delivery is waiting for a later Telegram retry')
    return 'ack'
  }
  if (action === 'wait') {
    logger.info({ id }, 'Approval is already waiting for Telegram')
    return 'ack'
  }
  if (action === 'notify' && envelope.event === 'CollectedSignatures') {
    const decoded = decodeJob(record.jobs[0])
    const originTxHash = decoded && decoded.originTxHash
    const alreadyApproved = signatureAlreadyApproved(await store.list(), originTxHash, config.stateSecret)
    if (alreadyApproved) {
      record.status = 'approved'
      record.decidedAt = Date.now()
      record.decidedBy = 'prior-signature-approval'
      await saveRecord(config, record)
      await forwardApproved(config, id)
      logger.info({ id, originTxHash }, 'Release continues after the signature approval')
      return 'ack'
    }
  }
  if (action === 'notify') {
    if (notifyDeadlineReached(record.firstNotifyAt, Date.now())) {
      await deferForTelegramTimeout(config, record)
      return 'ack'
    }
    try {
      await notify(config, record)
    } catch (e) {
      const now = Date.now()
      const failed = noteNotifyFailure(record, now, e.message)
      if (notifyDeadlineReached(failed.firstNotifyAt, now)) {
        await deferForTelegramTimeout(config, record, e.message)
        return 'ack'
      }
      await saveRecord(config, failed)
      throw e
    }
    return 'ack'
  }

  logger.error({ id, action }, 'Unexpected approval state')
  return 'ack'
}

function onMessage(config) {
  return async function handleMessage({ msg, ackMsg, nackMsg }) {
    try {
      if (redis.status !== 'ready') {
        logger.error('Redis is not ready. Approval message will be retried.')
        nackMsg(msg)
        return
      }

      let envelope
      try {
        envelope = parseMessageContent(msg.content)
      } catch (e) {
        logger.error('Dropping unreadable approval message')
        ackMsg(msg)
        return
      }

      const result = await acceptEnvelope(config, envelope)
      if (result === 'ack') ackMsg(msg)
      else nackMsg(msg)
    } catch (e) {
      logger.error({ err: e.message }, 'Failed to handle approval message')
      await sleep(3000)
      nackMsg(msg)
    }
  }
}

async function answer(callbackQueryId, text) {
  try {
    await telegram.answerCallback(callbackQueryId, text)
  } catch (e) {
    logger.error({ err: e.message }, 'Failed to answer a Telegram callback')
  }
}

async function rejectRequest(config, query, id, userId) {
  const locked = await store.acquire(id)
  if (!locked) {
    await answer(query.id, 'Already processing')
    return
  }

  try {
    const fresh = await loadRecord(config, id)
    if (!fresh || fresh.status !== 'pending') {
      await answer(query.id, fresh ? `Already ${fresh.status}` : 'Request not found')
      return
    }
    fresh.status = 'rejected'
    fresh.decidedAt = Date.now()
    fresh.decidedBy = String(userId)
    await saveRecord(config, fresh)
    await editDecision(config, fresh, 'Rejected. The sender will not receive this transaction.')
    await answer(query.id, 'Rejected')
    logger.info({ id, userId }, 'Approval rejected')
  } finally {
    await store.release(id)
  }
}

async function approveRequest(config, query, id, userId) {
  const locked = await store.acquire(id)
  if (!locked) {
    await answer(query.id, 'Already processing')
    return
  }

  let fresh
  try {
    fresh = await loadRecord(config, id)
    if (!fresh || fresh.status !== 'pending') {
      await answer(query.id, fresh ? `Already ${fresh.status}` : 'Request not found')
      return
    }
    fresh.status = 'approved'
    fresh.decidedAt = Date.now()
    fresh.decidedBy = String(userId)
    await saveRecord(config, fresh)
  } finally {
    await store.release(id)
  }

  if (!fresh || fresh.status !== 'approved') return

  try {
    await forwardApproved(config, id)
    const forwarded = await loadRecord(config, id)
    await editDecision(config, forwarded, 'Approved. Sent to the sender.')
    await answer(query.id, 'Approved')
  } catch (e) {
    logger.error({ id, err: e.message }, 'Approved request was not delivered to the sender queue')
    await editDecision(config, fresh, 'Approved. Delivery to the sender failed and will be retried.')
    await answer(query.id, 'Approved, delivery will be retried')
  }
}

async function applyCallback(config, query) {
  const parsed = parseCallbackData(query.data)
  if (!parsed) {
    await answer(query.id, 'Unknown action')
    return
  }

  const userId = query.from && query.from.id
  const callbackChatId = query.message && query.message.chat && query.message.chat.id
  const record = await loadRecord(config, parsed.id)
  const decision = decisionFromCallback({
    record,
    action: parsed.action,
    userId,
    adminIds: config.adminIds,
    chatId: config.chatId,
    callbackChatId
  })

  if (decision.type === 'forbidden') {
    await answer(query.id, 'Not allowed')
    return
  }
  if (decision.type === 'missing') {
    await answer(query.id, 'Request not found')
    return
  }
  if (decision.type === 'already') {
    await answer(query.id, `Already ${decision.status}`)
    return
  }
  if (decision.type === 'reject') {
    await rejectRequest(config, query, parsed.id, userId)
    return
  }
  if (decision.type === 'approve') {
    await approveRequest(config, query, parsed.id, userId)
  }
}

async function pollOnce(config) {
  if (redis.status === 'ready') {
    await recoverApproved(config)
    await retryDeferred(config)
  }
  const offset = await store.getOffset()
  const updates = await telegram.getUpdates(offset)
  for (let i = 0; i < updates.length; i++) {
    const update = updates[i]
    try {
      if (update.callback_query) await applyCallback(config, update.callback_query)
    } catch (e) {
      logger.error({ err: e.message, updateId: update.update_id }, 'Failed to process a Telegram update')
      break
    }
    await store.setOffset(update.update_id + 1)
  }
}

function schedulePoll(config, delay) {
  setTimeout(() => {
    pollOnce(config).then(
      () => schedulePoll(config, 0),
      err => {
        logger.error({ err: err.message }, 'Telegram polling failed')
        schedulePoll(config, 3000)
      }
    )
  }, delay)
}

function postedDecision(status) {
  if (status === 'rejected') return 'Rejected. The sender will not receive this transaction.'
  if (status === 'forwarded') return 'Approved. Sent to the sender.'
  if (status === 'approved') return 'Approved. Delivery to the sender failed and will be retried.'
  return ''
}

async function refreshPostedCards(config) {
  const records = await store.list()
  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    if (!record || !record.telegramMessageId || !recordMacValid(record, config.stateSecret)) continue
    const chatId = record.telegramChatId || config.chatId
    try {
      if (record.status === 'pending') {
        await telegram.editApproval(
          chatId,
          record.telegramMessageId,
          formatApprovalMessage(record, chainIds),
          record.id
        )
      } else {
        const decision = postedDecision(record.status)
        if (!decision) continue
        await telegram.editDecision(chatId, record.telegramMessageId, messageText(record, decision))
      }
      logger.info({ id: record.id, telegramMessageId: record.telegramMessageId }, 'Refreshed approval card')
    } catch (e) {
      if (String(e.message).indexOf('message is not modified') !== -1) continue
      logger.error({ id: record.id, err: e.message }, 'Failed to refresh an approval card')
    }
  }
}

async function initialize() {
  const config = readApprovalConfig()

  if (!isTxApprovalEnabled()) {
    logger.info('ORACLE_TX_APPROVAL_ENABLED is not true. Approval worker is idle.')
    return new Promise(() => {})
  }

  if (config.problems.length) {
    config.problems.forEach(problem => logger.error(problem))
    process.exit(EXIT_CODES.GENERAL_ERROR)
  }

  telegram = telegramClient(config.botToken)
  try {
    chainIds = {
      home: {
        id: String(await getChainId(web3Home)),
        explorer: String(process.env.ORACLE_HOME_EXPLORER_URL || '').replace(/\/$/, '')
      },
      foreign: {
        id: String(await getChainId(web3Foreign)),
        explorer: String(process.env.ORACLE_FOREIGN_EXPLORER_URL || '').replace(/\/$/, '')
      }
    }
  } catch (e) {
    logger.error({ err: e.message }, 'Chain ids are unavailable. Cards will name home and foreign without numbers.')
  }
  logger.info({ chatId: config.chatId, admins: config.adminIds.length, chainIds }, 'Transaction approval worker started')
  await refreshPostedCards(config)

  connectApprovalToQueue({
    queueName: APPROVAL_QUEUE,
    cb: onMessage(config)
  })
  schedulePoll(config, 0)
  return new Promise(() => {})
}

initialize()
