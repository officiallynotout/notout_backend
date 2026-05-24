'use strict'

/**
 * Returns today's date as 'YYYY-MM-DD' string (UTC).
 * @returns {string}
 */
const getTodayString = () =>
  new Date().toISOString().split('T')[0]

/**
 * Returns true if the given dateStr (YYYY-MM-DD) is today or in the future.
 * @param {string} dateStr
 * @returns {boolean}
 */
const isFutureOrToday = (dateStr) =>
  dateStr >= getTodayString()

/**
 * Returns a Date object set `minutes` from now (default 10).
 * Used for slot lock expiry.
 * @param {number} minutes
 * @returns {Date}
 */
const getLockExpiry = (minutes = 10) =>
  new Date(Date.now() + minutes * 60 * 1000)

module.exports = { getTodayString, isFutureOrToday, getLockExpiry }
