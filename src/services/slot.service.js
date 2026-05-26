'use strict'

const Slot     = require('../models/Slot')
const Turf     = require('../models/Turf')
const ApiError = require('../utils/ApiError')
const MESSAGES = require('../common/constants/messages.constant')
const STATUS   = require('../common/constants/status.constant')
const { timeToMinutes, minutesToTime, isValidTimeRange } = require('../common/helpers/time.helper')
const { isFutureOrToday, getLockExpiry }                 = require('../common/helpers/date.helper')
const { slotDebug }                                      = require('../utils/logger')

/**
 * Return all slots for a given turf + date.
 * Computes effectiveStatus in memory — never writes to the DB.
 */
const getSlots = async ({ turfId, date }) => {
  const turf = await Turf.findOne({ _id: turfId, isActive: true })
  if (!turf) throw new ApiError(404, MESSAGES.TURF.NOT_FOUND)

  const slots = await Slot.find({ turfId, date }).sort({ startTime: 1 })

  const now = new Date()

  return slots.map((s) => {
    const obj = s.toObject()
    obj.effectiveStatus =
      s.status === STATUS.SLOT.LOCKED && s.lockedUntil < now
        ? STATUS.SLOT.AVAILABLE
        : s.status
    return obj
  })
}

/**
 * Atomically lock a slot for a user for 10 minutes.
 * Also claims expired locks from other users in the same operation.
 */
const lockSlot = async ({ slotId, userId }) => {
  const now        = new Date()
  const lockExpiry = getLockExpiry(10)

  const slot = await Slot.findOneAndUpdate(
    {
      _id: slotId,
      $or: [
        { status: STATUS.SLOT.AVAILABLE },
        { status: STATUS.SLOT.LOCKED, lockedUntil: { $lt: now } },
      ],
    },
    {
      status:      STATUS.SLOT.LOCKED,
      lockedBy:    userId,
      lockedUntil: lockExpiry,
    },
    { new: true }
  )

  if (!slot) throw new ApiError(409, MESSAGES.SLOT.UNAVAILABLE)

  slotDebug('Slot %s locked by %s until %s', slotId, userId, lockExpiry)
  return slot
}

/**
 * Release a slot that was locked by the requesting user.
 */
const releaseSlot = async ({ slotId, userId }) => {
  const slot = await Slot.findOneAndUpdate(
    { _id: slotId, lockedBy: userId, status: STATUS.SLOT.LOCKED },
    { status: STATUS.SLOT.AVAILABLE, lockedBy: null, lockedUntil: null },
    { new: true }
  )

  if (!slot) throw new ApiError(400, MESSAGES.SLOT.NOT_LOCKED_BY_YOU)

  slotDebug('Slot %s released by %s', slotId, userId)
  return slot
}

/**
 * Bulk-generate time slots for a turf on a specific date.
 * Skips (does not throw on) duplicate slots via ordered:false + code 11000.
 */
const generateSlots = async ({ turfId, date, startTime, endTime, durationMinutes, price }) => {
  const turf = await Turf.findOne({ _id: turfId, isActive: true })
  if (!turf) throw new ApiError(404, MESSAGES.TURF.NOT_FOUND)

  if (!isFutureOrToday(date)) {
    throw new ApiError(400, MESSAGES.SLOT.PAST_DATE)
  }

  if (!isValidTimeRange(startTime, endTime)) {
    throw new ApiError(400, MESSAGES.SLOT.INVALID_RANGE)
  }

  // Build the slots array from the time window
  let current  = timeToMinutes(startTime)
  const end    = timeToMinutes(endTime)
  const slots  = []

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

  if (slots.length === 0) {
    throw new ApiError(400, MESSAGES.SLOT.NO_SLOTS)
  }

  let inserted = 0
  try {
    const result = await Slot.insertMany(slots, { ordered: false })
    inserted = result.length
  } catch (err) {
    if (err.code === 11000) {
      // Partial success — some slots already existed; count what was inserted
      inserted = err.insertedDocs?.length || 0
    } else {
      throw err
    }
  }

  slotDebug(
    'Generated %d/%d slots for turf %s on %s',
    inserted,
    slots.length,
    turfId,
    date
  )

  return { created: inserted, total: slots.length, skipped: slots.length - inserted }
}

module.exports = { getSlots, lockSlot, releaseSlot, generateSlots }
