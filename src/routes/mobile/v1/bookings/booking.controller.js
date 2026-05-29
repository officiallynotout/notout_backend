'use strict'

const asyncHandler   = require('../../../../utils/asyncHandler')
const ApiResponse    = require('../../../../utils/ApiResponse')
const bookingService = require('../../../../services/booking.service')
const MESSAGES       = require('../../../../common/constants/messages.constant')

const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user._id, req.body)
  return ApiResponse.created(res, booking, MESSAGES.BOOKING.CREATED)
})

const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getMyBookings(req.user._id)
  return ApiResponse.success(res, bookings)
})

const getBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user._id)
  return ApiResponse.success(res, booking)
})

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user._id)
  return ApiResponse.success(res, booking, MESSAGES.BOOKING.CANCELLED)
})

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking }
