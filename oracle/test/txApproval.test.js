const { expect } = require('chai')
const Web3 = require('web3')

const web3 = new Web3()

const {
  isTxApprovalEnabled,
  readApprovalConfig,
  buildApprovalEnvelope,
  queueNameForWatcher,
  payloadForWatcher,
  payloadsForWatcher,
  validateEnvelope,
  requestId,
  classifyExisting,
  notifyDeadlineReached,
  noteNotifyFailure,
  deferNotify,
  signJobs,
  unsealJobs,
  stampRecord,
  recordMacValid,
  signatureAlreadyApproved,
  decisionFromCallback,
  parseCallbackData,
  jobsForSender,
  formatApprovalMessage,
  parseMessageContent,
  APPROVAL_QUEUE
} = require('../src/services/txApproval')
const { redact } = require('../src/services/telegramClient')
const { createMessage } = require('../src/utils/message')

const tx = '0x1111111111111111111111111111111111111111111111111111111111111111'
const otherTx = '0x2222222222222222222222222222222222222222222222222222222222222222'
const homeBridge = '0x00000000000000000000000000000000000000aa'
const recipient = '0x00000000000000000000000000000000000000bb'

function affirmationData(reference) {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: 'executeAffirmation',
      type: 'function',
      inputs: [
        { type: 'address', name: 'recipient' },
        { type: 'uint256', name: 'value' },
        { type: 'bytes32', name: 'transactionHash' }
      ]
    },
    [recipient, '10', reference]
  )
}

const calldata = affirmationData(tx)

function sampleJob(reference) {
  return {
    data: reference === tx ? calldata : affirmationData(reference),
    gasEstimate: 1000,
    transactionReference: reference,
    to: homeBridge,
    summary: {
      recipient,
      value: '0x0a',
      blockNumber: 3533
    }
  }
}

function sampleEnvelope() {
  return buildApprovalEnvelope({
    targetQueue: 'home-prioritized',
    event: 'UserRequestForSignature',
    sender: 'home',
    watcherId: 'erc-native-signature-request',
    jobs: [sampleJob(tx)]
  })
}

describe('txApproval', () => {
  const previous = {}

  beforeEach(() => {
    const keys = [
      'ORACLE_TX_APPROVAL_ENABLED',
      'ORACLE_TX_APPROVAL_BOT_TOKEN',
      'ORACLE_TX_APPROVAL_CHAT_ID',
      'ORACLE_TX_APPROVAL_ADMIN_IDS',
      'ORACLE_TX_APPROVAL_STATE_SECRET',
      'COMMON_HOME_BRIDGE_ADDRESS',
      'COMMON_FOREIGN_BRIDGE_ADDRESS'
    ]
    keys.forEach(key => {
      previous[key] = process.env[key]
      delete process.env[key]
    })
    process.env.COMMON_HOME_BRIDGE_ADDRESS = homeBridge
    process.env.COMMON_FOREIGN_BRIDGE_ADDRESS = '0x00000000000000000000000000000000000000cc'
  })

  afterEach(() => {
    Object.keys(previous).forEach(key => {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    })
  })

  it('keeps the sender queue unless approval is enabled', () => {
    const config = { queue: 'home-prioritized', event: 'UserRequestForSignature', sender: 'home' }
    const jobs = [sampleJob(tx)]

    expect(isTxApprovalEnabled()).to.equal(false)
    expect(queueNameForWatcher(config)).to.equal('home-prioritized')
    expect(payloadForWatcher(config, jobs)).to.equal(jobs)

    process.env.ORACLE_TX_APPROVAL_ENABLED = 'true'
    expect(queueNameForWatcher(config)).to.equal(APPROVAL_QUEUE)
    expect(payloadForWatcher(config, jobs)).to.deep.equal({
      targetQueue: 'home-prioritized',
      event: 'UserRequestForSignature',
      sender: 'home',
      jobs
    })
  })

  it('sends one approval payload per transaction', () => {
    process.env.ORACLE_TX_APPROVAL_ENABLED = 'true'
    const config = { queue: 'home-prioritized', event: 'UserRequestForAffirmation', sender: 'home' }
    const jobs = [sampleJob(tx), sampleJob(otherTx)]
    const payloads = payloadsForWatcher(config, jobs)

    expect(payloads).to.have.length(2)
    expect(payloads[0].jobs).to.deep.equal([jobs[0]])
    expect(payloads[1].jobs).to.deep.equal([jobs[1]])
    expect(requestId(payloads[0])).to.not.equal(requestId(payloads[1]))
  })

  it('requires telegram settings only when approval is enabled', () => {
    expect(readApprovalConfig().problems).to.deep.equal([])

    process.env.ORACLE_TX_APPROVAL_ENABLED = 'true'
    expect(readApprovalConfig().problems).to.have.length(4)

    process.env.ORACLE_TX_APPROVAL_BOT_TOKEN = 'token'
    process.env.ORACLE_TX_APPROVAL_CHAT_ID = '-100'
    process.env.ORACLE_TX_APPROVAL_ADMIN_IDS = '10, 20'
    process.env.ORACLE_TX_APPROVAL_STATE_SECRET = 'state-secret'
    const config = readApprovalConfig()
    expect(config.problems).to.deep.equal([])
    expect(config.adminIds).to.deep.equal(['10', '20'])
    expect(config.chatId).to.equal('-100')
  })

  it('defers a card the worker could not deliver to Telegram within one minute', () => {
    const started = 1000000
    const record = {
      id: 'abc',
      status: 'pending',
      jobs: [sampleJob(tx)]
    }

    expect(notifyDeadlineReached(undefined, started + 60000)).to.equal(false)
    expect(notifyDeadlineReached(started, started + 59999)).to.equal(false)
    expect(notifyDeadlineReached(started, started + 60000)).to.equal(true)

    const failed = noteNotifyFailure(record, started, 'chat not found')
    expect(failed.firstNotifyAt).to.equal(started)
    expect(failed.notifyAttempts).to.equal(1)

    const deferred = deferNotify(failed, started + 61000, 'chat not found')
    expect(deferred.status).to.equal('deferred')
    expect(deferred.jobs[0].data).to.equal(calldata)
    expect(deferred.nextRetryAt).to.equal(started + 61000 + 5 * 60 * 1000)
    expect(classifyExisting(deferred)).to.equal('defer')
  })

  it('binds the approval record and the sender payload to a secret', () => {
    const secret = 'state-secret'
    const record = stampRecord(
      {
        id: 'abc',
        status: 'approved',
        targetQueue: 'home-prioritized',
        event: 'UserRequestForAffirmation',
        sender: 'home',
        jobs: [sampleJob(tx)]
      },
      secret
    )
    expect(recordMacValid(record, secret)).to.equal(true)
    record.status = 'approved'
    record.jobs[0].data = '0xdead'
    expect(recordMacValid(record, secret)).to.equal(false)

    const sealed = signJobs([{ data: calldata, to: homeBridge, transactionReference: tx }], secret)
    expect(unsealJobs(sealed, secret)[0].data).to.equal(calldata)
    expect(unsealJobs([sealed.jobs[0]], secret)).to.equal(null)
    sealed.jobs[0].data = '0xdead'
    expect(unsealJobs(sealed, secret)).to.equal(null)
  })

  it('rejects a summary that disagrees with the calldata', () => {
    const envelope = sampleEnvelope()
    envelope.jobs[0].summary.value = '99'
    expect(validateEnvelope(envelope)).to.equal('summary value does not match calldata')
    envelope.jobs[0].summary.value = '0x0a'
    envelope.jobs[0].to = '0x00000000000000000000000000000000000000ff'
    expect(validateEnvelope(envelope)).to.equal('job destination is not the bridge')
  })

  it('rejects envelopes that do not target a sender queue', () => {
    const envelope = sampleEnvelope()
    expect(validateEnvelope(envelope)).to.equal(null)

    envelope.targetQueue = 'home'
    expect(validateEnvelope(envelope)).to.equal('unexpected target queue')

    envelope.targetQueue = 'foreign-prioritized'
    envelope.jobs[0].data = ''
    expect(validateEnvelope(envelope)).to.equal('job missing data')
  })

  it('builds a stable request id from the transaction references', () => {
    const first = sampleEnvelope()
    const second = buildApprovalEnvelope({
      targetQueue: 'home-prioritized',
      event: 'UserRequestForSignature',
      sender: 'home',
      jobs: [sampleJob(tx), sampleJob(otherTx)].reverse()
    })
    const reordered = buildApprovalEnvelope({
      targetQueue: 'home-prioritized',
      event: 'UserRequestForSignature',
      sender: 'home',
      jobs: [sampleJob(otherTx), sampleJob(tx)]
    })

    expect(requestId(first)).to.have.length(32)
    expect(requestId(second)).to.equal(requestId(reordered))
    expect(requestId(first)).to.not.equal(requestId(second))
  })

  it('classifies stored approval records', () => {
    expect(classifyExisting(null)).to.equal('create')
    expect(classifyExisting({ status: 'pending' })).to.equal('notify')
    expect(classifyExisting({ status: 'pending', telegramMessageId: 7 })).to.equal('wait')
    expect(classifyExisting({ status: 'approved' })).to.equal('forward')
    expect(classifyExisting({ status: 'forwarded' })).to.equal('drop')
    expect(classifyExisting({ status: 'rejected' })).to.equal('drop')
    expect(classifyExisting({ status: 'deferred' })).to.equal('defer')
  })

  it('accepts approve and reject only from an admin in the configured chat', () => {
    const record = { status: 'pending' }
    const base = {
      record,
      action: 'approve',
      userId: 10,
      adminIds: ['10'],
      chatId: '-100',
      callbackChatId: -100
    }

    expect(decisionFromCallback(base).type).to.equal('approve')
    expect(decisionFromCallback(Object.assign({}, base, { action: 'reject' })).type).to.equal('reject')
    expect(decisionFromCallback(Object.assign({}, base, { userId: 11 })).type).to.equal('forbidden')
    expect(decisionFromCallback(Object.assign({}, base, { callbackChatId: 1 })).type).to.equal('forbidden')
    expect(decisionFromCallback(Object.assign({}, base, { record: { status: 'forwarded' } })).type).to.equal('already')
    expect(decisionFromCallback(Object.assign({}, base, { record: null })).type).to.equal('missing')
  })

  it('parses callback data and strips the summary before the sender sees the job', () => {
    const id = requestId(sampleEnvelope())
    expect(parseCallbackData(`a:${id}`)).to.deep.equal({ action: 'approve', id })
    expect(parseCallbackData(`r:${id}`)).to.deep.equal({ action: 'reject', id })
    expect(parseCallbackData('approve')).to.equal(null)

    const job = sampleJob(tx)
    const forwarded = jobsForSender([job])
    expect(forwarded[0]).to.not.have.property('summary')
    expect(forwarded[0].data).to.equal(calldata)
    expect(job).to.have.property('summary')
  })

  it('shows the transaction summary in Telegram without the calldata', () => {
    const envelope = sampleEnvelope()
    const text = formatApprovalMessage(Object.assign({ id: requestId(envelope) }, envelope), { home: 77, foreign: 42 })

    expect(text).to.contain('Swap: <code>home chain 77 → foreign chain 42</code>')
    expect(text).to.contain('Assets: <code>native → ERC-20</code>')
    expect(text).to.contain('UserRequestForSignature')
    expect(text).to.contain(tx)
    expect(text).to.contain(recipient)
    expect(text).to.contain('Value: <code>10</code>')
    expect(text).to.contain('Block: <code>3533</code>')
    expect(text).to.contain('erc-native-signature-request:lastProcessedBlock')
    expect(text).to.contain('to <code>3532</code>')
    expect(text).to.contain('executeAffirmation')
    expect(text).to.not.contain(calldata)

    const reverse = formatApprovalMessage(Object.assign({}, envelope, { event: 'UserRequestForAffirmation' }), {
      home: 77,
      foreign: 42
    })
    expect(reverse).to.contain('Swap: <code>foreign chain 42 → home chain 77</code>')
    expect(reverse).to.contain('Assets: <code>ERC-20 → native</code>')

    const linked = formatApprovalMessage(Object.assign({ id: requestId(envelope) }, envelope), {
      home: { id: 77, explorer: 'https://home.example' },
      foreign: { id: 42, explorer: 'https://foreign.example' }
    })
    expect(linked).to.contain(`https://home.example/tx/${tx}`)
    expect(linked).to.contain(`https://foreign.example/address/${recipient}`)

    const known = formatApprovalMessage(Object.assign({ id: requestId(envelope) }, envelope), {
      home: { id: 56 },
      foreign: { id: 1 }
    })
    expect(known).to.contain(`https://bscscan.com/tx/${tx}`)
    expect(known).to.contain(`https://etherscan.io/address/${recipient}`)
    expect(known).to.contain('BNB Smart Chain (56) → Ethereum (1)')

    const named = formatApprovalMessage(Object.assign({}, envelope, { event: 'UserRequestForAffirmation' }), {
      home: { id: 106 },
      foreign: { id: 128 }
    })
    expect(named).to.contain('Heco (128) → Velas (106)')
  })

  it('parses queued JSON from a buffer', () => {
    const envelope = sampleEnvelope()
    expect(parseMessageContent(Buffer.from(JSON.stringify(envelope)))).to.deep.equal(envelope)
  })

  it('shows the native-to-erc release taken from the signed bridge message', () => {
    const foreignBridge = '0x00000000000000000000000000000000000000cc'
    const message = createMessage({
      recipient,
      value: '10',
      transactionHash: tx,
      bridgeAddress: foreignBridge,
      expectedMessageLength: 104
    })
    const signature = `0x${'ab'.repeat(65)}`
    const submitData = web3.eth.abi.encodeFunctionCall(
      {
        name: 'submitSignature',
        type: 'function',
        inputs: [{ type: 'bytes', name: 'signature' }, { type: 'bytes', name: 'message' }]
      },
      [signature, message]
    )
    const releaseData = web3.eth.abi.encodeFunctionCall(
      {
        name: 'executeSignatures',
        type: 'function',
        inputs: [{ type: 'bytes', name: 'message' }, { type: 'bytes', name: 'signatures' }]
      },
      [message, signature]
    )
    const submitJob = {
      data: submitData,
      gasEstimate: 1000,
      transactionReference: tx,
      to: homeBridge,
      summary: { recipient, value: '10', blockNumber: 40 }
    }
    const releaseJob = {
      data: releaseData,
      gasEstimate: 1000,
      transactionReference: otherTx,
      to: foreignBridge,
      summary: { recipient, value: '0x0a', originTxHash: tx, blockNumber: 41 }
    }

    expect(validateEnvelope(buildApprovalEnvelope({
      targetQueue: 'home-prioritized',
      event: 'UserRequestForSignature',
      sender: 'home',
      jobs: [submitJob]
    }))).to.equal(null)
    expect(validateEnvelope(buildApprovalEnvelope({
      targetQueue: 'foreign-prioritized',
      event: 'CollectedSignatures',
      sender: 'foreign',
      jobs: [releaseJob]
    }))).to.equal(null)

    const text = formatApprovalMessage({
      id: 'abc',
      event: 'CollectedSignatures',
      sender: 'foreign',
      jobs: [releaseJob]
    })
    expect(text).to.contain('executeSignatures')
    expect(text).to.contain('Value: <code>10</code>')
    expect(text).to.contain(recipient)
    expect(text).to.contain(tx)

    submitJob.summary.value = '99'
    expect(validateEnvelope(buildApprovalEnvelope({
      targetQueue: 'home-prioritized',
      event: 'UserRequestForSignature',
      sender: 'home',
      jobs: [submitJob]
    }))).to.equal('summary value does not match calldata')
  })

  it('continues a release when the signature request was already approved', () => {
    const secret = 'state-secret'
    const approved = stampRecord(
      {
        id: 'sig',
        status: 'forwarded',
        event: 'UserRequestForSignature',
        sender: 'home',
        jobs: [{ transactionReference: tx, data: '0x', to: homeBridge }]
      },
      secret
    )
    const rejected = stampRecord(
      {
        id: 'other',
        status: 'rejected',
        event: 'UserRequestForSignature',
        sender: 'home',
        jobs: [{ transactionReference: otherTx, data: '0x', to: homeBridge }]
      },
      secret
    )

    expect(signatureAlreadyApproved([approved], tx, secret)).to.equal(true)
    expect(signatureAlreadyApproved([rejected], otherTx, secret)).to.equal(false)
    expect(signatureAlreadyApproved([approved], otherTx, secret)).to.equal(false)
    approved.status = 'rejected'
    expect(signatureAlreadyApproved([approved], tx, secret)).to.equal(false)
  })

  it('redacts the bot token from transport errors', () => {
    expect(redact('request to https://api.telegram.org/botsecret-token/getUpdates failed', 'secret-token')).to.equal(
      'request to https://api.telegram.org/bot[redacted]/getUpdates failed'
    )
  })
})
