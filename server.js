'use strict'

require('dotenv').config()

const config    = require('./src/config/env')
const connectDB = require('./src/config/db')
const prisma    = require('./src/config/prisma')
const app       = require('./src/app')

connectDB().then(() => {
  const server = app.listen(config.PORT, () => {
    console.log(`✅ Server running on port ${config.PORT} [${config.NODE_ENV}]`)
  })

  const shutdown = async () => {
    await prisma.$disconnect()
    server.close(() => process.exit(0))
  }

  process.on('unhandledRejection', (err) => {
    console.error('unhandledRejection:', err)
    server.close(() => process.exit(1))
  })

  process.on('uncaughtException', (err) => {
    console.error('uncaughtException:', err)
    process.exit(1)
  })

  process.on('SIGTERM', shutdown)
  process.on('SIGINT',  shutdown)
})
