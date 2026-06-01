'use strict'

const prisma   = require('../config/prisma')
const ApiError = require('../utils/ApiError')
const MESSAGES = require('../common/constants/messages.constant')
const { isFutureOrToday } = require('../common/helpers/date.helper')
const { isValidTimeRange } = require('../common/helpers/time.helper')
const { decryptAES } = require('../utils/encrypt')

const _format = (b) => ({
  _id:       b.id,
  turfName:  b.turfName,
  date:      b.date,
  startTime: b.startTime,
  endTime:   b.endTime,
  status:    b.status,
  createdAt: b.createdAt,
  updatedAt: b.updatedAt,
})

const _formatAdmin = (b) => ({
  _id:       b.id,
  turfName:  b.turfName,
  date:      b.date,
  startTime: b.startTime,
  endTime:   b.endTime,
  status:    b.status,
  createdAt: b.createdAt,
  user: b.user
    ? {
        _id:   b.user.id,
        name:  b.user.name,
        phone: b.user.phone ? decryptAES(b.user.phone) : null,
      }
    : null,
})

const createBooking = async (userId, payload) => {
  if (!isFutureOrToday(payload.date)) throw new ApiError(400, MESSAGES.SLOT.PAST_DATE)
  if (!isValidTimeRange(payload.startTime, payload.endTime)) throw new ApiError(400, MESSAGES.SLOT.INVALID_RANGE)

  const booking = await prisma.booking.create({
    data: {
      userId,
      turfName:  payload.turfName,
      date:      payload.date,
      startTime: payload.startTime,
      endTime:   payload.endTime,
    },
  })

  return _format(booking)
}

const getMyBookings = async (userId) => {
  const bookings = await prisma.booking.findMany({
    where:   { userId },
    orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
  })
  return bookings.map(_format)
}

const getBookingById = async (bookingId, userId) => {
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, userId } })
  if (!booking) throw new ApiError(404, MESSAGES.BOOKING.NOT_FOUND)
  return _format(booking)
}

const cancelBooking = async (bookingId, userId) => {
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, userId } })
  if (!booking) throw new ApiError(404, MESSAGES.BOOKING.NOT_FOUND)
  if (booking.status === 'cancelled') throw new ApiError(400, MESSAGES.BOOKING.ALREADY_CANCELLED)
  if (!isFutureOrToday(booking.date)) throw new ApiError(400, MESSAGES.BOOKING.CANNOT_CANCEL)

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data:  { status: 'cancelled' },
  })
  return _format(updated)
}

const getAllBookings = async () => {
  const bookings = await prisma.booking.findMany({
    include: { user: { select: { id: true, name: true, phone: true } } },
    orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
  })
  return bookings.map(_formatAdmin)
}

const getAdminStats = async () => {
  const today = new Date().toISOString().slice(0, 10)

  const [total, confirmed, cancelled, pending, todayCount, activeTurfs] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'confirmed' } }),
    prisma.booking.count({ where: { status: 'cancelled' } }),
    prisma.booking.count({ where: { status: 'pending' } }),
    prisma.booking.count({ where: { date: today } }),
    prisma.turf.count({ where: { isActive: true } }),
  ])

  return { total, confirmed, cancelled, pending, today: todayCount, activeTurfs }
}

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking, getAllBookings, getAdminStats }
