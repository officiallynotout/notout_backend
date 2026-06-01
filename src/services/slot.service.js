'use strict'

const prisma   = require('../config/prisma')
const ApiError = require('../utils/ApiError')
const MESSAGES = require('../common/constants/messages.constant')
const STATUS   = require('../common/constants/status.constant')
const { timeToMinutes, minutesToTime, isValidTimeRange } = require('../common/helpers/time.helper')
const { isFutureOrToday, getLockExpiry }                 = require('../common/helpers/date.helper')
const { slotDebug }                                      = require('../utils/logger')

const _format = (slot) => ({
  ...slot,
  _id: slot.id,
})

const getSlots = async ({ turfId, date }) => {
  const turf = await prisma.turf.findFirst({ where: { id: turfId, isActive: true } })
  if (!turf) throw new ApiError(404, MESSAGES.TURF.NOT_FOUND)

  const slots = await prisma.slot.findMany({
    where:   { turfId, date },
    orderBy: { startTime: 'asc' },
  })

  const now = new Date()

  return slots.map((s) => ({
    ..._format(s),
    effectiveStatus:
      s.status === STATUS.SLOT.LOCKED && s.lockedUntil < now
        ? STATUS.SLOT.AVAILABLE
        : s.status,
  }))
}

/**
 * Atomically lock a slot using a conditional UPDATE.
 * updateMany with a WHERE condition is a single SQL statement — safe against race conditions.
 */
const lockSlot = async ({ slotId, userId }) => {
  const now        = new Date()
  const lockExpiry = getLockExpiry(10)

  const result = await prisma.slot.updateMany({
    where: {
      id: slotId,
      OR: [
        { status: STATUS.SLOT.AVAILABLE },
        { status: STATUS.SLOT.LOCKED, lockedUntil: { lt: now } },
      ],
    },
    data: {
      status:      STATUS.SLOT.LOCKED,
      lockedBy:    userId,
      lockedUntil: lockExpiry,
    },
  })

  if (result.count === 0) throw new ApiError(409, MESSAGES.SLOT.UNAVAILABLE)

  const slot = await prisma.slot.findUnique({ where: { id: slotId } })

  slotDebug('Slot %s locked by %s until %s', slotId, userId, lockExpiry)
  return _format(slot)
}

const releaseSlot = async ({ slotId, userId }) => {
  const result = await prisma.slot.updateMany({
    where: { id: slotId, lockedBy: userId, status: STATUS.SLOT.LOCKED },
    data:  { status: STATUS.SLOT.AVAILABLE, lockedBy: null, lockedUntil: null },
  })

  if (result.count === 0) throw new ApiError(400, MESSAGES.SLOT.NOT_LOCKED_BY_YOU)

  const slot = await prisma.slot.findUnique({ where: { id: slotId } })

  slotDebug('Slot %s released by %s', slotId, userId)
  return _format(slot)
}

const generateSlots = async ({ turfId, date, startTime, endTime, durationMinutes, price }) => {
  const turf = await prisma.turf.findFirst({ where: { id: turfId, isActive: true } })
  if (!turf) throw new ApiError(404, MESSAGES.TURF.NOT_FOUND)

  if (!isFutureOrToday(date)) throw new ApiError(400, MESSAGES.SLOT.PAST_DATE)
  if (!isValidTimeRange(startTime, endTime)) throw new ApiError(400, MESSAGES.SLOT.INVALID_RANGE)

  let current = timeToMinutes(startTime)
  const end   = timeToMinutes(endTime)
  const slots = []

  while (current + durationMinutes <= end) {
    slots.push({
      turfId,
      date,
      startTime: minutesToTime(current),
      endTime:   minutesToTime(current + durationMinutes),
      price,
    })
    current += durationMinutes
  }

  if (slots.length === 0) throw new ApiError(400, MESSAGES.SLOT.NO_SLOTS)

  // skipDuplicates silently ignores slots that already exist (unique constraint on turfId+date+startTime)
  const result = await prisma.slot.createMany({ data: slots, skipDuplicates: true })

  slotDebug('Generated %d/%d slots for turf %s on %s', result.count, slots.length, turfId, date)

  return { created: result.count, total: slots.length, skipped: slots.length - result.count }
}

module.exports = { getSlots, lockSlot, releaseSlot, generateSlots }
