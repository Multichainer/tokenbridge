const crypto = require('crypto')

const BigNumber = require('bignumber.js')
const Web3 = require('web3')

const { APPROVAL_QUEUE, HOME_SENDER_QUEUE, FOREIGN_SENDER_QUEUE } = require('../utils/constants')

const web3 = new Web3()
const SENDER_QUEUES = [HOME_SENDER_QUEUE, FOREIGN_SENDER_QUEUE]
const TELEGRAM_NOTIFY_DEADLINE_MS = 60 * 1000
const TELEGRAM_NOTIFY_RETRY_MS = 5 * 60 * 1000
const KNOWN_METHODS = [
  {
    signature: 'executeAffirmation(address,uint256,bytes32)',
    types: ['address', 'uint256', 'bytes32'],
    name: 'executeAffirmation'
  },
  { signature: 'executeAffirmation(bytes)', types: ['bytes'], name: 'executeAffirmation' },
  { signature: 'submitSignature(bytes,bytes)', types: ['bytes', 'bytes'], name: 'submitSignature' },
  { signature: 'executeSignatures(bytes,bytes)', types: ['bytes', 'bytes'], name: 'executeSignatures' },
  { signature: 'confirmInformation(bytes32,bool,bytes)', types: ['bytes32', 'bool', 'bytes'], name: 'confirmInformation' }
].map(method =>
  Object.assign({}, method, {
    selector: web3.eth.abi.encodeFunctionSignature(method.signature).toLowerCase()
  })
)
const SUMMARY_FIELDS = [
  ['recipient', 'Recipient'],
  ['sender', 'Sender'],
  ['from', 'From'],
  ['to', 'To'],
  ['executor', 'Executor'],
  ['value', 'Value'],
  ['originTxHash', 'Origin tx'],
  ['messageId', 'Message id'],
  ['method', 'Method']
]

function isTxApprovalEnabled() {
  return process.env.ORACLE_TX_APPROVAL_ENABLED === 'true'
}

function readApprovalConfig() {
  const botToken = process.env.ORACLE_TX_APPROVAL_BOT_TOKEN || ''
  const chatId = process.env.ORACLE_TX_APPROVAL_CHAT_ID || ''
  const adminIds = (process.env.ORACLE_TX_APPROVAL_ADMIN_IDS || '')
    .split(/[,\s]+/)
    .map(item => item.trim())
    .filter(Boolean)
  const problems = []

  const stateSecret = process.env.ORACLE_TX_APPROVAL_STATE_SECRET || ''

  if (isTxApprovalEnabled()) {
    if (!botToken) problems.push('ORACLE_TX_APPROVAL_BOT_TOKEN is required when approval is enabled')
    if (!chatId) problems.push('ORACLE_TX_APPROVAL_CHAT_ID is required when approval is enabled')
    if (!adminIds.length) problems.push('ORACLE_TX_APPROVAL_ADMIN_IDS is required when approval is enabled')
    if (!stateSecret) problems.push('ORACLE_TX_APPROVAL_STATE_SECRET is required when approval is enabled')
  }

  return {
    enabled: isTxApprovalEnabled(),
    botToken,
    chatId,
    adminIds,
    stateSecret,
    problems
  }
}

function buildApprovalEnvelope({ targetQueue, event, sender, jobs, watcherId }) {
  const envelope = {
    targetQueue,
    event,
    sender,
    jobs
  }
  if (watcherId) envelope.watcherId = watcherId
  return envelope
}

function queueNameForWatcher(config) {
  return isTxApprovalEnabled() ? APPROVAL_QUEUE : config.queue
}

function payloadForWatcher(config, jobs) {
  if (!isTxApprovalEnabled()) return jobs
  return buildApprovalEnvelope({
    targetQueue: config.queue,
    event: config.event,
    sender: config.sender,
    jobs,
    watcherId: config.id
  })
}

function payloadsForWatcher(config, jobs) {
  if (!isTxApprovalEnabled()) return [jobs]
  return jobs.map(job => payloadForWatcher(config, [job]))
}

function validateEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) return 'message is not an object'
  if (!SENDER_QUEUES.includes(envelope.targetQueue)) return 'unexpected target queue'
  if (typeof envelope.event !== 'string' || !envelope.event) return 'missing event'
  if (envelope.sender !== 'home' && envelope.sender !== 'foreign') return 'unexpected sender'
  if (envelope.watcherId != null && !/^[a-z0-9-]+$/.test(envelope.watcherId)) return 'unexpected watcher id'
  if (!Array.isArray(envelope.jobs) || envelope.jobs.length === 0) return 'missing jobs'

  for (let i = 0; i < envelope.jobs.length; i++) {
    const job = envelope.jobs[i]
    if (!job || typeof job !== 'object') return 'job is not an object'
    if (typeof job.transactionReference !== 'string' || !job.transactionReference) {
      return 'job missing transaction reference'
    }
    if (typeof job.data !== 'string' || !job.data) return 'job missing data'
    if (typeof job.to !== 'string' || !job.to) return 'job missing destination'
    if (sourceBlock(job) == null) return 'job missing source block'
    const conflict = calldataConflict(job)
    if (conflict) return conflict
    const bridge = expectedBridge(envelope.targetQueue)
    if (!bridge) return 'bridge address is not configured'
    if (job.to.toLowerCase() !== bridge.toLowerCase()) return 'job destination is not the bridge'
  }

  return null
}

function requestId(envelope) {
  const parts = envelope.jobs
    .map(job => [job.transactionReference, job.to, job.data].join(':'))
    .sort()
  return crypto
    .createHash('sha256')
    .update(`${envelope.targetQueue}|${parts.join('|')}`)
    .digest('hex')
    .slice(0, 32)
}

function macEqual(left, right) {
  const a = Buffer.from(String(left))
  const b = Buffer.from(String(right))
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

function jobMacBody(job) {
  return {
    data: job.data,
    extraGas: job.extraGas == null ? '' : job.extraGas,
    gasEstimate: job.gasEstimate == null ? '' : job.gasEstimate,
    gasPrice: job.gasPrice == null ? '' : String(job.gasPrice),
    to: String(job.to).toLowerCase(),
    transactionReference: String(job.transactionReference).toLowerCase(),
    txHash: job.txHash || ''
  }
}

function signJobs(jobs, secret) {
  const approvalMac = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(jobs.map(jobMacBody)))
    .digest('hex')
  return { approvalMac, jobs }
}

function unsealJobs(payload, secret) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  if (!Array.isArray(payload.jobs) || typeof payload.approvalMac !== 'string') return null
  const approvalMac = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload.jobs.map(jobMacBody)))
    .digest('hex')
  if (!macEqual(payload.approvalMac, approvalMac)) return null
  return payload.jobs
}

function recordMacBody(record) {
  return {
    decidedBy: record.decidedBy || '',
    event: record.event,
    id: record.id,
    watcherId: record.watcherId || '',
    jobs: (record.jobs || []).map(job => ({
      data: job.data || '',
      gasEstimate: job.gasEstimate == null ? '' : job.gasEstimate,
      summary: job.summary || null,
      to: String(job.to || '').toLowerCase(),
      transactionReference: String(job.transactionReference || '').toLowerCase()
    })),
    rejectReason: record.rejectReason || '',
    sender: record.sender,
    status: record.status,
    targetQueue: record.targetQueue
  }
}

function stampRecord(record, secret) {
  const copy = Object.assign({}, record)
  delete copy.mac
  copy.mac = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(recordMacBody(copy)))
    .digest('hex')
  return copy
}

function recordMacValid(record, secret) {
  if (!record || typeof record.mac !== 'string') return false
  const copy = Object.assign({}, record)
  delete copy.mac
  const mac = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(recordMacBody(copy)))
    .digest('hex')
  return macEqual(record.mac, mac)
}

function sentJobKey(job) {
  const dataHash = crypto
    .createHash('sha256')
    .update(String(job.data))
    .digest('hex')
    .slice(0, 16)
  return `approval:sent:${String(job.transactionReference).toLowerCase()}:${dataHash}`
}

function decodeJob(job) {
  if (!job || typeof job.data !== 'string' || job.data.length < 10) return null
  const selector = job.data.slice(0, 10).toLowerCase()
  const method = KNOWN_METHODS.filter(item => item.selector === selector)[0]
  if (!method) return null
  try {
    const decoded = web3.eth.abi.decodeParameters(method.types, `0x${job.data.slice(10)}`)
    if (method.signature === 'executeAffirmation(address,uint256,bytes32)') {
      return {
        method: method.name,
        recipient: decoded[0],
        value: decoded[1].toString(),
        txHash: decoded[2]
      }
    }
    return { method: method.name }
  } catch (e) {
    return null
  }
}

function calldataConflict(job) {
  const decoded = decodeJob(job)
  if (!decoded) return 'unknown transaction method'
  if (decoded.txHash && job.transactionReference.toLowerCase() !== decoded.txHash.toLowerCase()) {
    return 'transaction reference does not match calldata'
  }
  const summary = job.summary || {}
  if (decoded.recipient && summary.recipient && summary.recipient.toLowerCase() !== decoded.recipient.toLowerCase()) {
    return 'summary recipient does not match calldata'
  }
  if (decoded.value != null && summary.value != null && summary.value !== '') {
    const shown = new BigNumber(summary.value)
    const actual = new BigNumber(decoded.value)
    if (shown.isNaN() || actual.isNaN() || !shown.eq(actual)) return 'summary value does not match calldata'
  }
  return null
}

function expectedBridge(targetQueue) {
  if (targetQueue === HOME_SENDER_QUEUE) return process.env.COMMON_HOME_BRIDGE_ADDRESS || ''
  if (targetQueue === FOREIGN_SENDER_QUEUE) return process.env.COMMON_FOREIGN_BRIDGE_ADDRESS || ''
  return ''
}

function classifyExisting(record) {
  if (!record) return 'create'
  if (record.status === 'rejected' || record.status === 'forwarded') return 'drop'
  if (record.status === 'approved') return 'forward'
  if (record.status === 'deferred') return 'defer'
  if (record.status === 'pending' && !record.telegramMessageId) return 'notify'
  if (record.status === 'pending') return 'wait'
  return 'drop'
}

function notifyDeadlineReached(firstNotifyAt, now) {
  if (!firstNotifyAt) return false
  return now - firstNotifyAt >= TELEGRAM_NOTIFY_DEADLINE_MS
}

function noteNotifyFailure(record, now, errorMessage) {
  return Object.assign({}, record, {
    firstNotifyAt: record.firstNotifyAt || now,
    notifyAttempts: (record.notifyAttempts || 0) + 1,
    lastNotifyError: errorMessage
  })
}

function deferNotify(record, now, errorMessage) {
  return Object.assign({}, record, {
    status: 'deferred',
    firstNotifyAt: record.firstNotifyAt || now,
    notifyAttempts: (record.notifyAttempts || 0) + 1,
    lastNotifyError: errorMessage,
    nextRetryAt: now + TELEGRAM_NOTIFY_RETRY_MS
  })
}

function decisionFromCallback({ record, action, userId, adminIds, chatId, callbackChatId }) {
  const allowed = (adminIds || []).map(String)
  if (!allowed.includes(String(userId))) return { type: 'forbidden' }
  if (String(callbackChatId) !== String(chatId)) return { type: 'forbidden' }
  if (!record) return { type: 'missing' }
  if (record.status !== 'pending') return { type: 'already', status: record.status }
  if (action === 'approve') return { type: 'approve' }
  if (action === 'reject') return { type: 'reject' }
  return { type: 'unknown' }
}

function parseCallbackData(data) {
  if (typeof data !== 'string') return null
  const match = /^(a|r):([0-9a-f]{32})$/.exec(data)
  if (!match) return null
  return {
    action: match[1] === 'a' ? 'approve' : 'reject',
    id: match[2]
  }
}

function jobsForSender(jobs) {
  return jobs.map(job => {
    const copy = Object.assign({}, job)
    delete copy.summary
    return copy
  })
}

function sourceBlock(job) {
  const summary = job && job.summary
  if (!summary) return null
  const raw = summary.blockNumber
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 0) return raw
  if (typeof raw === 'string' && /^[0-9]+$/.test(raw)) {
    const value = Number(raw)
    if (Number.isSafeInteger(value)) return value
  }
  return null
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function displayValue(value) {
  const number = new BigNumber(value)
  if (number.isNaN()) return String(value)
  return number.toString(10)
}

function formatJob(job, index) {
  const decoded = decodeJob(job) || { method: 'unknown' }
  const lines = [
    `${index + 1}. tx <code>${escapeHtml(job.transactionReference)}</code>`,
    `Bridge: <code>${escapeHtml(job.to)}</code>`,
    `Method: <code>${escapeHtml(decoded.method)}</code>`
  ]
  if (decoded.recipient) {
    lines.push(`Recipient: <code>${escapeHtml(decoded.recipient)}</code>`)
    lines.push(`Value: <code>${escapeHtml(displayValue(decoded.value))}</code>`)
  }
  const block = sourceBlock(job)
  if (block != null) lines.push(`Block: <code>${block}</code>`)
  return lines
}

function formatApprovalMessage(record) {
  const lines = [
    '<b>Swap approval required</b>',
    '',
    `Request: <code>${escapeHtml(record.id)}</code>`,
    `Event: <code>${escapeHtml(record.event)}</code>`,
    `Relay side: <code>${escapeHtml(record.sender)}</code>`,
    `Jobs: ${record.jobs.length}`
  ]
  let hidden = 0

  for (let i = 0; i < record.jobs.length; i++) {
    const block = formatJob(record.jobs[i], i)
    const nextLength = lines.concat([''], block).join('\n').length
    if (nextLength > 3500) {
      hidden = record.jobs.length - i
      break
    }
    lines.push('')
    block.forEach(line => lines.push(line))
  }

  if (hidden > 0) {
    lines.push('', `… ${hidden} more jobs not shown`)
  }

  const blocks = record.jobs.map(sourceBlock).filter(block => block != null)
  if (blocks.length === record.jobs.length && blocks.length) {
    const earliest = Math.min.apply(null, blocks)
    const key = record.watcherId ? `${record.watcherId}:lastProcessedBlock` : 'lastProcessedBlock'
    lines.push('', `Undo reject: set <code>${escapeHtml(key)}</code> to <code>${earliest - 1}</code>`)
  }

  return lines.join('\n')
}

function parseMessageContent(content) {
  if (content == null) return null
  if (typeof content === 'object' && !Buffer.isBuffer(content)) return content
  const text = Buffer.isBuffer(content) ? content.toString('utf8') : String(content)
  return JSON.parse(text)
}

module.exports = {
  APPROVAL_QUEUE,
  SENDER_QUEUES,
  isTxApprovalEnabled,
  readApprovalConfig,
  buildApprovalEnvelope,
  queueNameForWatcher,
  payloadForWatcher,
  payloadsForWatcher,
  validateEnvelope,
  requestId,
  TELEGRAM_NOTIFY_DEADLINE_MS,
  TELEGRAM_NOTIFY_RETRY_MS,
  classifyExisting,
  notifyDeadlineReached,
  noteNotifyFailure,
  deferNotify,
  signJobs,
  unsealJobs,
  stampRecord,
  recordMacValid,
  sentJobKey,
  decodeJob,
  calldataConflict,
  decisionFromCallback,
  parseCallbackData,
  jobsForSender,
  formatApprovalMessage,
  parseMessageContent
}
