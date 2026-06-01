'use strict'

const Booking  = require('../models/Booking')
const Turf     = require('../models/Turf')
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

const getMyBookings = async (userId) => {
  return Booking.find({ user: userId })
    .select('-__v')
    .sort({ date: -1, startTime: -1 })
}

const getBookingById = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId }).select('-__v')
  if (!booking) throw new ApiError(404, MESSAGES.BOOKING.NOT_FOUND)
  return booking
}

const cancelBooking = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId })
  if (!booking) throw new ApiError(404, MESSAGES.BOOKING.NOT_FOUND)

  if (booking.status === 'cancelled') {
    throw new ApiError(400, MESSAGES.BOOKING.ALREADY_CANCELLED)
  }

  if (!isFutureOrToday(booking.date)) {
    throw new ApiError(400, MESSAGES.BOOKING.CANNOT_CANCEL)
  }

  booking.status = 'cancelled'
  await booking.save()
  return booking
}

const getAllBookings = async () => {
  return Booking.find({})
    .populate('user', 'name phone')
    .select('-__v')
    .sort({ date: -1, startTime: -1 })
}

const getAdminStats = async () => {
  const today = new Date().toISOString().slice(0, 10)
  const [total, confirmed, cancelled, pending, todayCount, activeTurfs] = await Promise.all([
    Booking.countDocuments({}),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.countDocuments({ status: 'cancelled' }),
    Booking.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ date: today }),
    Turf.countDocuments({ isActive: true }),
  ])
  return { total, confirmed, cancelled, pending, today: todayCount, activeTurfs }
}

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking, getAllBookings, getAdminStats }
