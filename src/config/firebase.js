'use strict'

const admin  = require('firebase-admin')
const config = require('./env')

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   config.FIREBASE_PROJECT_ID,
      clientEmail: config.FIREBASE_CLIENT_EMAIL,
      privateKey:  config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
}

module.exports = admin
