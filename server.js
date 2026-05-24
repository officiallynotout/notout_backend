'use strict'

// Load env vars FIRST — before any other require that might read process.env
require('dotenv').config()

const config    = require('./src/config/env')   // validates all required env vars
const connectDB = require('./src/config/db')
const app       = require('./src/app')

connectDB().then(() => {
  const server = app.listen(config.PORT, () => {
    console.log(`✅ Server running on port ${config.PORT} [${config.NODE_ENV}]`)
  })

  // Unhandled promise rejections — give in-flight requests a chance to finish
  process.on('unhandledRejection', (err) => {
    console.error('unhandledRejection:', err)
    server.close(() => process.exit(1))
  })

  // Uncaught synchronous exceptions — exit immediately
  process.on('uncaughtException', (err) => {
    console.error('uncaughtException:', err)
    process.exit(1)
  })
})
