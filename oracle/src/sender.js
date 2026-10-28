require('../env')
const path = require('path')
const { connectSenderToQueue } = require('./services/amqpClient')
const { redis } = require('./services/redisClient')
const { readApprovalConfig, signJobs, unsealJobs, sentJobKey } = require('./services/txApproval')
const GasPrice = require('./services/gasPrice')
const logger = require('./services/logger')
const { getShutdownFlag } = require('./services/shutdownState')
const { sendTx } = require('./tx/sendTx')
const { getNonce, getChainId } = require('./tx/web3')
const {
  addExtraGas,
  checkHTTPS,
  syncForEach,
  waitForFunds,
  waitForUnsuspend,
  watchdog,
  isGasPriceError,
  isSameTransactionError,
  isInsufficientBalanceError,
  isNonceError
} = require('./utils/utils')
const { EXIT_CODES, EXTRA_GAS_PERCENTAGE, MAX_GAS_LIMIT } = require('./utils/constants')

const { ORACLE_TX_REDUNDANCY } = process.env

if (process.argv.length < 3) {
  logger.error('Please check the number of arguments, config file was not provided')
  process.exit(EXIT_CODES.GENERAL_ERROR)
}

const config = require(path.join('../config/', process.argv[2]))
const approvalConfig = readApprovalConfig()

if (approvalConfig.enabled && approvalConfig.problems.length) {
  approvalConfig.problems.forEach(problem => logger.error(problem))
  process.exit(EXIT_CODES.GENERAL_ERROR)
}

const { web3, web3Fallback } = config
const web3Redundant = ORACLE_TX_REDUNDANCY === 'true' ? config.web3Redundant : web3

const nonceKey = `${config.id}:nonce`
let chainId = 0

async function initialize() {
  try {
    const checkHttps = checkHTTPS(process.env.ORACLE_ALLOW_HTTP_FOR_RPC, logger)

    web3.currentProvider.urls.forEach(checkHttps(config.id))

    GasPrice.start(config.id)

    chainId = await getChainId(web3)
    connectQueue()
  } catch (e) {
    logger.error(e.message)
    process.exit(EXIT_CODES.GENERAL_ERROR)
  }
}

function connectQueue() {
  connectSenderToQueue({
    queueName: config.queue,
    oldQueueName: config.oldQueue,
    resendInterval: config.resendInterval,
    cb: options => {
      if (config.maxProcessingTime) {
        return watchdog(() => main(options), config.maxProcessingTime, () => {
          logger.fatal('Max processing time reached')
          process.exit(EXIT_CODES.MAX_TIME_REACHED)
        })
      }

      return main(options)
    }
  })
}

function resume(newBalance) {
  logger.info(`Validator balance changed. New balance is ${newBalance}. Resume messages processing.`)
  connectQueue()
}

function unsuspend() {
  logger.info(`Oracle sender was unsuspended.`)
  connectQueue()
}

async function readNonce(forceUpdate) {
  logger.debug('Reading nonce')
  if (forceUpdate) {
    logger.debug('Forcing update of nonce')
    return getNonce(web3, config.validatorAddress)
  }

  const nonce = await redis.get(nonceKey)
  if (nonce) {
    logger.debug({ nonce }, 'Nonce found in the DB')
    return Number(nonce)
  } else {
    logger.warn("Nonce wasn't found in the DB")
    return getNonce(web3, config.validatorAddress)
  }
}

function updateNonce(nonce) {
  if (typeof nonce !== 'number') {
    logger.warn('Given nonce value is not a valid number. Nothing will be updated in the DB.')
  } else {
    redis.set(nonceKey, nonce)
  }
}

async function main({ msg, ackMsg, nackMsg, channel, scheduleForRetry, scheduleTransactionResend }) {
  try {
    if (redis.status !== 'ready') {
      nackMsg(msg)
      return
    }

    if (await getShutdownFlag(logger, config.shutdownKey, true)) {
      logger.info('Oracle sender was suspended via the remote shutdown process')
      channel.close()
      waitForUnsuspend(() => getShutdownFlag(logger, config.shutdownKey, true), unsuspend)
      return
    }

    let txArray
    try {
      const parsed = JSON.parse(msg.content)
      if (!approvalConfig.enabled) {
        if (!Array.isArray(parsed)) throw new Error('expected a job array')
        txArray = parsed
      } else {
        txArray = unsealJobs(parsed, approvalConfig.stateSecret)
        if (!txArray) throw new Error('missing or invalid approval signature')
      }
    } catch (e) {
      logger.error({ err: e.message }, 'Dropping a sender message that is not an approved job')
      ackMsg(msg)
      return
    }
    logger.debug(`Msg received with ${txArray.length} Tx to send`)
    const gasPrice = GasPrice.getPrice().toString(10)

    let nonce
    let insufficientFunds = false
    let minimumBalance = null
    const failedTx = []
    const resendJobs = []

    const isResend = txArray.length > 0 && !!txArray[0].txHash

    if (isResend) {
      logger.info(`Checking status of ${txArray.length} transactions`)
      nonce = null
    } else {
      logger.info(`Sending ${txArray.length} transactions`)
      nonce = await readNonce()
    }
    await syncForEach(txArray, async job => {
      let gasLimit
      if (typeof job.extraGas === 'number') {
        gasLimit = addExtraGas(job.gasEstimate + job.extraGas, 0, MAX_GAS_LIMIT)
      } else {
        gasLimit = addExtraGas(job.gasEstimate, EXTRA_GAS_PERCENTAGE, MAX_GAS_LIMIT)
      }

      try {
        if (isResend) {
          const tx = await web3Fallback.eth.getTransaction(job.txHash)

          if (tx && tx.blockNumber !== null) {
            logger.debug(`Transaction ${job.txHash} was successfully mined`)
            return
          }

          if (nonce === null) {
            nonce = await readNonce(true)
          }

          logger.info(`Transaction ${job.txHash} was not mined, updating gasPrice: ${job.gasPrice} -> ${gasPrice}`)
        }
        if (!isResend && approvalConfig.enabled) {
          const claimed = await redis.set(sentJobKey(job), '1', 'NX')
          if (claimed !== 'OK') {
            logger.info(
              { eventTransactionHash: job.transactionReference },
              'Skipping a duplicate approved transaction'
            )
            return
          }
        }
        logger.info(`Sending transaction with nonce ${nonce}`)
        let txHash
        try {
          txHash = await sendTx({
            data: job.data,
            nonce,
            gasPrice,
            amount: '0',
            gasLimit,
            privateKey: config.validatorPrivateKey,
            to: job.to,
            chainId,
            web3: web3Redundant
          })
        } catch (sendError) {
          if (!isResend && approvalConfig.enabled) await redis.del(sentJobKey(job))
          throw sendError
        }
        const resendJob = {
          ...job,
          txHash,
          gasPrice
        }
        resendJobs.push(resendJob)

        nonce++
        logger.info(
          { eventTransactionHash: job.transactionReference, generatedTransactionHash: txHash },
          `Tx generated ${txHash} for event Tx ${job.transactionReference}`
        )
      } catch (e) {
        logger.error(
          { eventTransactionHash: job.transactionReference, error: e.message },
          `Tx Failed for event Tx ${job.transactionReference}.`,
          e.message
        )

        if (isGasPriceError(e)) {
          logger.info('Replacement transaction underpriced, forcing gas price update')
          GasPrice.start(config.id)
          failedTx.push(job)
        } else if (isResend || isSameTransactionError(e)) {
          resendJobs.push(job)
        } else {
          // if initial transaction sending has failed not due to the same hash error
          // send it to the failed tx queue
          // this will result in the sooner resend attempt than if using resendJobs
          failedTx.push(job)
        }

        if (isInsufficientBalanceError(e)) {
          insufficientFunds = true
          const currentBalance = await web3.eth.getBalance(config.validatorAddress)
          minimumBalance = gasLimit.multipliedBy(gasPrice)
          logger.error(
            `Insufficient funds: ${currentBalance}. Stop processing messages until the balance is at least ${minimumBalance}.`
          )
        } else if (isNonceError(e)) {
          nonce = await readNonce(true)
        }
      }
    })

    if (typeof nonce === 'number') {
      logger.debug('Updating nonce')
      await updateNonce(nonce)
    }

    const seal = jobs => (approvalConfig.enabled ? signJobs(jobs, approvalConfig.stateSecret) : jobs)
    if (failedTx.length) {
      logger.info(`Sending ${failedTx.length} Failed Tx to Queue`)
      await scheduleForRetry(seal(failedTx), msg.properties.headers['x-retries'])
    }
    if (resendJobs.length) {
      logger.info({ delay: config.resendInterval }, `Sending ${resendJobs.length} Tx Delayed Resend Requests to Queue`)
      await scheduleTransactionResend(seal(resendJobs))
    }
    ackMsg(msg)
    logger.debug(`Finished processing msg`)

    if (insufficientFunds) {
      logger.warn('Insufficient funds. Stop sending transactions until the account has the minimum balance')
      channel.close()
      waitForFunds(web3, config.validatorAddress, minimumBalance, resume, logger)
    }
  } catch (e) {
    logger.error(e)
    nackMsg(msg)
  }

  logger.debug('Finished')
}

initialize()
