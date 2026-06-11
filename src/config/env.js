'use strict'

const required = [
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CRYPTO_SECRET',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'CLIENT_URL',
  'NODE_ENV',
]

const missing = required.filter((k) => !process.env[k])
if (missing.length) {
  console.error('❌ Missing env vars:', missing.join(', '))
  process.exit(1)
}

module.exports = {
  PORT:                   process.env.PORT,
  NODE_ENV:               process.env.NODE_ENV,
  DATABASE_URL:           process.env.DATABASE_URL,
  JWT_SECRET:             process.env.JWT_SECRET,
  JWT_EXPIRES_IN:         process.env.JWT_EXPIRES_IN,
  CRYPTO_SECRET:          process.env.CRYPTO_SECRET,
  CLIENT_URL:             process.env.CLIENT_URL,
  REDIS_URL:              process.env.REDIS_URL || 'redis://localhost:6379',
  FIREBASE_PROJECT_ID:    process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL:  process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY:   process.env.FIREBASE_PRIVATE_KEY,
}
