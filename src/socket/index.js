'use strict'

const jwt    = require('jsonwebtoken')
const prisma = require('../config/prisma')
const config = require('../config/env')

let _io = null

const init = (io) => {
  _io = io

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Unauthorized'))

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET)
      const user = await prisma.user.findUnique({
        where:  { id: decoded.userId },
        select: { id: true, name: true },
      })
      if (!user) return next(new Error('Unauthorized'))
      socket.userId = user.id
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    socket.on('join:match', async ({ matchId, shareCode }) => {
      try {
        let match = null

        if (matchId) {
          match = await prisma.cricketMatch.findFirst({
            where: { id: matchId, userId: socket.userId },
          })
        } else if (shareCode) {
          match = await prisma.cricketMatch.findUnique({
            where: { shareCode: shareCode.toUpperCase() },
          })
        }

        if (!match) return socket.emit('match:error', { message: 'Match not found' })

        socket.join(`match:${match.id}`)
        socket.emit('match:joined', { matchId: match.id })
      } catch {
        socket.emit('match:error', { message: 'Failed to join match' })
      }
    })

    socket.on('leave:match', ({ matchId }) => {
      socket.leave(`match:${matchId}`)
    })
  })
}

const getIO = () => {
  if (!_io) throw new Error('Socket.io not initialized')
  return _io
}

const emitMatchUpdate = (matchId, data) => {
  if (_io) _io.to(`match:${matchId}`).emit('match:update', data)
}

module.exports = { init, getIO, emitMatchUpdate }
