'use strict'

const asyncHandler   = require('../../../../utils/asyncHandler')
const ApiResponse    = require('../../../../utils/ApiResponse')
const bookingService = require('../../../../services/booking.service')
const MESSAGES       = require('../../../../common/constants/messages.constant')

const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user._id, req.body)
  return ApiResponse.created(res, booking, MESSAGES.BOOKING.CREATED)
})

module.exports = { createBooking }
