'use strict'

// Slot times are stored as IST (Asia/Kolkata, UTC+5:30).
// Comparing them against server time (UTC on cloud) causes off-by-5.5h errors,
// so all "what time is it now" logic must use IST explicitly.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

const getNowIST = () => new Date(Date.now() + IST_OFFSET_MS)

/**
 * Returns today's date as 'YYYY-MM-DD' string in IST.
 * @returns {string}
 */
const getTodayString = () => {
  const d = getNowIST()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

/**
 * Returns true if the given dateStr (YYYY-MM-DD) is today or in the future (IST).
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

module.exports = { getNowIST, getTodayString, isFutureOrToday, getLockExpiry }
