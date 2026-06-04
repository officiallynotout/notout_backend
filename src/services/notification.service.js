'use strict'

const https   = require('https')
const prisma  = require('../config/prisma')
const logger  = require('../utils/logger')

const EXPO_PUSH_URL = 'exp.host'
const EXPO_PUSH_PATH = '/--/api/v2/push/send'

/**
 * POST to Expo Push API.
 * Silently drops failures so a notification error never breaks the booking flow.
 */
const _sendToExpo = (messages) => {
  const body = JSON.stringify(messages)

  const options = {
    hostname: EXPO_PUSH_URL,
    path:     EXPO_PUSH_PATH,
    method:   'POST',
    headers:  {
      'Content-Type':   'application/json',
      'Accept':         'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Length': Buffer.byteLength(body),
    },
  }

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          logger('notification')('Expo push response: %O', parsed)
        } catch {
          // non-critical
        }
        resolve()
      })
    })

    req.on('error', (err) => {
      logger('notification')('Expo push error: %s', err.message)
      resolve()
    })

    req.write(body)
    req.end()
  })
}

/**
 * Send a push notification to a single user by their DB userId.
 * Looks up the stored Expo push token. No-ops if the user has none.
 */
const sendToUser = async (userId, { title, body, data = {} }) => {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { expoPushToken: true },
  })

  if (!user?.expoPushToken) return

  await _sendToExpo([{
    to:    user.expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  }])
}

/**
 * Save (or clear) an Expo push token for a user.
 */
const registerToken = async (userId, token) => {
  await prisma.user.update({
    where: { id: userId },
    data:  { expoPushToken: token ?? null },
  })
}

module.exports = { sendToUser, registerToken }
