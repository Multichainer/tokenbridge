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

function parseBridgeMessage(message) {
  const hex = String(message || '').replace(/^0x/i, '')
  if (!/^[0-9a-fA-F]{208}$/.test(hex)) return null
  try {
    const value = web3.eth.abi.decodeParameter('uint256', `0x${hex.slice(40, 104)}`)
    return {
      recipient: `0x${hex.slice(0, 40)}`,
      value: value.toString(),
      txHash: `0x${hex.slice(104, 168)}`,
      bridgeAddress: `0x${hex.slice(168, 208)}`
    }
  } catch (e) {
    return null
  }
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
    if (
      method.signature === 'submitSignature(bytes,bytes)' ||
      method.signature === 'executeSignatures(bytes,bytes)'
    ) {
      const messageArg = method.signature === 'submitSignature(bytes,bytes)' ? decoded[1] : decoded[0]
      const parsed = parseBridgeMessage(messageArg)
      if (!parsed) return { method: method.name }
      const result = {
        method: method.name,
        recipient: parsed.recipient,
        value: parsed.value,
        originTxHash: parsed.txHash,
        messageBridge: parsed.bridgeAddress
      }
      if (method.signature === 'submitSignature(bytes,bytes)') result.txHash = parsed.txHash
      return result
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
  if (
    decoded.originTxHash &&
    summary.originTxHash &&
    summary.originTxHash.toLowerCase() !== decoded.originTxHash.toLowerCase()
  ) {
    return 'summary origin does not match calldata'
  }
  if (decoded.messageBridge) {
    const foreign = process.env.COMMON_FOREIGN_BRIDGE_ADDRESS || ''
    if (!foreign || decoded.messageBridge.toLowerCase() !== foreign.toLowerCase()) {
      return 'message bridge does not match the foreign bridge'
    }
  }
  return null
}

function expectedBridge(targetQueue) {
  if (targetQueue === HOME_SENDER_QUEUE) return process.env.COMMON_HOME_BRIDGE_ADDRESS || ''
  if (targetQueue === FOREIGN_SENDER_QUEUE) return process.env.COMMON_FOREIGN_BRIDGE_ADDRESS || ''
  return ''
}

function signatureAlreadyApproved(records, originTxHash, secret) {
  if (!originTxHash) return false
  const wanted = String(originTxHash).toLowerCase()
  return (records || []).some(record => {
    if (!recordMacValid(record, secret)) return false
    if (record.event !== 'UserRequestForSignature') return false
    if (record.status !== 'approved' && record.status !== 'forwarded') return false
    return (record.jobs || []).some(job => String(job.transactionReference || '').toLowerCase() === wanted)
  })
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
    .replace(/"/g, '&quot;')
}

function displayValue(value) {
  const number = new BigNumber(value)
  if (number.isNaN()) return String(value)
  return number.toString(10)
}

const EXPLORERS_BY_CHAIN_ID = {
  1: 'https://etherscan.io',
  56: 'https://bscscan.com',
  97: 'https://testnet.bscscan.com',
  106: 'https://evmexplorer.velas.com',
  111: 'https://evmexplorer.testnet.velas.com',
  128: 'https://hecoinfo.com',
  256: 'https://testnet.hecoinfo.com'
}

const CHAIN_NAMES_BY_ID = {
  1: 'Ethereum',
  56: 'BNB Smart Chain',
  97: 'BNB Smart Chain testnet',
  106: 'Velas',
  111: 'Velas testnet',
  128: 'Heco',
  256: 'Heco testnet'
}

function chainInfo(side, chainIds) {
  const raw = chainIds && chainIds[side]
  if (raw && typeof raw === 'object') return { id: raw.id, explorer: raw.explorer || '' }
  return { id: raw, explorer: '' }
}

function referenceSide(event) {
  if (event === 'UserRequestForAffirmation' || event === 'Transfer') return 'foreign'
  if (event === 'UserRequestForSignature' || event === 'CollectedSignatures') return 'home'
  return null
}

function recipientSide(event) {
  if (event === 'UserRequestForAffirmation' || event === 'Transfer') return 'home'
  if (event === 'UserRequestForSignature' || event === 'CollectedSignatures') return 'foreign'
  return null
}

function explorerOrigin(side, chainIds) {
  const info = chainInfo(side, chainIds)
  const id = info.id == null || info.id === '' ? '' : String(info.id)
  if (EXPLORERS_BY_CHAIN_ID[id]) return EXPLORERS_BY_CHAIN_ID[id]
  return String(info.explorer || '').replace(/\/$/, '')
}

function linkedValue(value, side, chainIds, kind) {
  const shown = escapeHtml(value)
  const origin = explorerOrigin(side, chainIds)
  if (!origin) return `<code>${shown}</code>`
  const href = escapeHtml(`${origin}/${kind}/${value}`)
  return `<a href="${href}">${shown}</a>`
}

function isAddress(value) {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value)
}

function userSide(event) {
  if (event === 'UserRequestForAffirmation' || event === 'Transfer') return 'foreign'
  if (event === 'UserRequestForSignature' || event === 'CollectedSignatures') return 'home'
  return null
}

function rejectNote(event) {
  if (event === 'UserRequestForSignature') return 'ℹ️ <i>Reject burns the tokens.</i>'
  if (event === 'UserRequestForAffirmation' || event === 'Transfer') {
    return 'ℹ️ <i>Reject locks the tokens on the bridge contract.</i>'
  }
  if (event === 'CollectedSignatures') {
    return 'ℹ️ <i>Reject leaves the ERC-20 unreleased. The native tokens are already burned.</i>'
  }
  return null
}

function formatJob(job, index, context) {
  const info = context || {}
  const decoded = decodeJob(job) || { method: 'unknown' }
  const lines = [
    `${index + 1}. tx ${linkedValue(job.transactionReference, referenceSide(info.event), info.chainIds, 'tx')}`,
    `Bridge: ${linkedValue(job.to, info.sender, info.chainIds, 'address')}`,
    `Method: <code>${escapeHtml(decoded.method)}</code>`
  ]
  const user = job.summary && job.summary.sender
  if (isAddress(user)) {
    lines.push(`Sender: ${linkedValue(user, userSide(info.event), info.chainIds, 'address')}`)
  }
  if (decoded.recipient) {
    lines.push(
      `Recipient: ${linkedValue(decoded.recipient, recipientSide(info.event), info.chainIds, 'address')}`
    )
    lines.push(`Value: <code>${escapeHtml(displayValue(decoded.value))}</code>`)
  }
  if (
    decoded.originTxHash &&
    (!decoded.txHash || decoded.txHash.toLowerCase() !== decoded.originTxHash.toLowerCase())
  ) {
    lines.push(`Origin tx: ${linkedValue(decoded.originTxHash, 'home', info.chainIds, 'tx')}`)
  }
  const block = sourceBlock(job)
  if (block != null) lines.push(`Block: <code>${block}</code>`)
  return lines
}

function swapDirection(event) {
  if (event === 'UserRequestForAffirmation' || event === 'Transfer') {
    return { from: 'foreign', to: 'home', assets: 'ERC-20 → native' }
  }
  if (event === 'UserRequestForSignature' || event === 'CollectedSignatures') {
    return { from: 'home', to: 'foreign', assets: 'native → ERC-20' }
  }
  return null
}

function sideLabel(side, chainIds) {
  const id = chainInfo(side, chainIds).id
  if (id == null || id === '') return side
  const name = CHAIN_NAMES_BY_ID[String(id)]
  if (name) return `${name} (${id})`
  return `${side} chain ${id}`
}

function formatApprovalMessage(record, chainIds) {
  const lines = ['<b>Swap approval required</b>', '']
  const direction = swapDirection(record.event)
  if (direction) {
    const from = sideLabel(direction.from, chainIds)
    const to = sideLabel(direction.to, chainIds)
    lines.push(`Swap: <code>${escapeHtml(`${from} → ${to}`)}</code>`)
    lines.push(`Assets: <code>${escapeHtml(direction.assets)}</code>`)
  }
  lines.push(
    `Request: <code>${escapeHtml(record.id)}</code>`,
    `Event: <code>${escapeHtml(record.event)}</code>`,
    `Relay side: <code>${escapeHtml(record.sender)}</code>`,
    `Jobs: ${record.jobs.length}`
  )
  let hidden = 0

  for (let i = 0; i < record.jobs.length; i++) {
    const block = formatJob(record.jobs[i], i, {
      event: record.event,
      sender: record.sender,
      chainIds
    })
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

  const note = rejectNote(record.event)
  if (note) lines.push('', note)

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
  signatureAlreadyApproved,
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
