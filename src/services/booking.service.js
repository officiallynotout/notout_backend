'use strict'

const Booking = require('../models/Booking')
const ApiError = require('../utils/ApiError')
const MESSAGES = require('../common/constants/messages.constant')
const { isFutureOrToday } = require('../common/helpers/date.helper')
const { isValidTimeRange } = require('../common/helpers/time.helper')

const createBooking = async (userId, payload) => {
  if (!isFutureOrToday(payload.date)) {
    throw new ApiError(400, MESSAGES.SLOT.PAST_DATE)
  }

  if (!isValidTimeRange(payload.startTime, payload.endTime)) {
    throw new ApiError(400, MESSAGES.SLOT.INVALID_RANGE)
  }

  return Booking.create({
    user:      userId,
    turfName:  payload.turfName,
    date:      payload.date,
    startTime: payload.startTime,
    endTime:   payload.endTime,
  })
}

module.exports = { createBooking }
