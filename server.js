'use strict'

require('dotenv').config()

const http         = require('http')
const { Server }   = require('socket.io')
const config       = require('./src/config/env')
const connectDB    = require('./src/config/db')
const prisma       = require('./src/config/prisma')
const app          = require('./src/app')
const socketModule = require('./src/socket')

connectDB().then(() => {
  const httpServer = http.createServer(app)

  const io = new Server(httpServer, {
    cors: {
      origin:      [config.CLIENT_URL, 'http://localhost:8081', 'http://127.0.0.1:8081'],
      credentials: true,
    },
  })

  socketModule.init(io)

  httpServer.listen(config.PORT, () => {
    console.log(`✅ Server running on port ${config.PORT} [${config.NODE_ENV}]`)
  })

  const shutdown = async () => {
    await prisma.$disconnect()
    httpServer.close(() => process.exit(0))
  }

  process.on('unhandledRejection', (err) => {
    console.error('unhandledRejection:', err)
    httpServer.close(() => process.exit(1))
  })

  process.on('uncaughtException', (err) => {
    console.error('uncaughtException:', err)
    process.exit(1)
  })

  process.on('SIGTERM', shutdown)
  process.on('SIGINT',  shutdown)
})
