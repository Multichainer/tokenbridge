const { redis } = require('./redisClient')

const REQUEST_PREFIX = 'approval:request:'
const INDEX_KEY = 'approval:ids'
const OFFSET_KEY = 'approval:telegram:offset'
const LOCK_PREFIX = 'approval:lock:'

function requestKey(id) {
  return `${REQUEST_PREFIX}${id}`
}

async function get(id) {
  const raw = await redis.get(requestKey(id))
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

async function save(record) {
  await redis.set(requestKey(record.id), JSON.stringify(record))
  await redis.sadd(INDEX_KEY, record.id)
}

async function createIfAbsent(record) {
  const created = await redis.set(requestKey(record.id), JSON.stringify(record), 'NX')
  if (created !== 'OK') return false
  await redis.sadd(INDEX_KEY, record.id)
  return true
}

async function list() {
  const ids = await redis.smembers(INDEX_KEY)
  const records = []
  for (let i = 0; i < ids.length; i++) {
    const record = await get(ids[i])
    if (record) records.push(record)
  }
  return records
}

async function acquire(id) {
  const result = await redis.set(`${LOCK_PREFIX}${id}`, '1', 'EX', 30, 'NX')
  return result === 'OK'
}

async function release(id) {
  await redis.del(`${LOCK_PREFIX}${id}`)
}

async function getOffset() {
  const value = await redis.get(OFFSET_KEY)
  if (!value) return undefined
  const offset = Number(value)
  return Number.isFinite(offset) ? offset : undefined
}

async function setOffset(offset) {
  await redis.set(OFFSET_KEY, String(offset))
}

module.exports = {
  get,
  save,
  createIfAbsent,
  list,
  acquire,
  release,
  getOffset,
  setOffset
}
