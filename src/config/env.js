'use strict'

const required = [
  'PORT',
  'MONGO_URI',
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
  MONGO_URI:              process.env.MONGO_URI,
  JWT_SECRET:             process.env.JWT_SECRET,
  JWT_EXPIRES_IN:         process.env.JWT_EXPIRES_IN,
  CRYPTO_SECRET:          process.env.CRYPTO_SECRET,
  CLIENT_URL:             process.env.CLIENT_URL,
  FIREBASE_PROJECT_ID:    process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL:  process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY:   process.env.FIREBASE_PRIVATE_KEY,
}
