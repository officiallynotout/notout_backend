'use strict'

/**
 * Convert 'HH:mm' time string to total minutes from midnight.
 * @param {string} time - e.g. '09:30'
 * @returns {number}
 */
const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * Convert total minutes from midnight to 'HH:mm' string.
 * @param {number} minutes
 * @returns {string}
 */
const minutesToTime = (minutes) => {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0')
  const m = String(minutes % 60).padStart(2, '0')
  return h + ':' + m
}

/**
 * Returns true if startTime is strictly before endTime.
 * @param {string} startTime - 'HH:mm'
 * @param {string} endTime   - 'HH:mm'
 * @returns {boolean}
 */
const isValidTimeRange = (startTime, endTime) =>
  timeToMinutes(startTime) < timeToMinutes(endTime)

module.exports = { timeToMinutes, minutesToTime, isValidTimeRange }
