'use strict'

const debug = require('debug')

module.exports = {
  authDebug:    debug('app:auth'),
  dbDebug:      debug('app:db'),
  slotDebug:    debug('app:slot'),
  bookingDebug: debug('app:booking'),
  errorDebug:   debug('app:error'),
}
