'use strict'

const prisma      = require('./prisma')
const { dbDebug } = require('../utils/logger')

async function connectDB() {
  try {
    await prisma.$connect()
    dbDebug('PostgreSQL connected via Prisma')
  } catch (err) {
    console.error('❌ Database connection error:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB
