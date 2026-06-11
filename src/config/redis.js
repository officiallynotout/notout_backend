'use strict'

const Redis  = require('ioredis')
const config = require('./env')

const redis = new Redis(config.REDIS_URL, {
  lazyConnect:         true,
  enableOfflineQueue:  false,
  retryStrategy:       (times) => Math.min(times * 200, 2000),
})

redis.on('connect',    () => console.log('✅ Redis connected'))
redis.on('error',      (err) => console.error('❌ Redis error:', err.message || err.code || err))
redis.on('close',      () => console.warn('⚠️  Redis connection closed'))

redis.connect().catch(() => {})

const MATCH_TTL = 60 * 60 * 4 // 4 hours

const getMatch = async (matchId) => {
  try {
    const data = await redis.get(`match:${matchId}`)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

const setMatch = async (matchId, payload) => {
  try {
    await redis.set(`match:${matchId}`, JSON.stringify(payload), 'EX', MATCH_TTL)
  } catch {
    // Redis unavailable — app continues without cache
  }
}

const deleteMatch = async (matchId) => {
  try {
    await redis.del(`match:${matchId}`)
  } catch {
    // ignore
  }
}

module.exports = { redis, getMatch, setMatch, deleteMatch }
