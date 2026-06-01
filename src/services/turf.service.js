'use strict'

const Turf     = require('../models/Turf')
const ApiError = require('../utils/ApiError')
const MESSAGES = require('../common/constants/messages.constant')

/**
 * Return all turfs, optionally filtered by city and/or isActive.
 * Defaults to showing only active turfs when isActive is not specified.
 */
const getAllTurfs = async ({ city, isActive } = {}) => {
  const query = {}

  if (city) {
    query['location.city'] = new RegExp(city, 'i')
  }

  if (isActive === 'all') {
    // no filter — admin view
  } else if (isActive !== undefined && isActive !== null && isActive !== '') {
    query.isActive = isActive === 'true' || isActive === true
  } else {
    query.isActive = true
  }

  return Turf.find(query).select('-__v').sort({ createdAt: -1 })
}

/**
 * Return a single turf by its MongoDB ObjectId string.
 * Throws 404 if not found.
 */
const getTurfById = async (turfId) => {
  const turf = await Turf.findById(turfId).select('-__v')
  if (!turf) throw new ApiError(404, MESSAGES.TURF.NOT_FOUND)
  return turf
}

/**
 * Create a new turf document.
 */
const createTurf = async (data) => {
  return Turf.create(data)
}

/**
 * Update an existing turf. Throws 404 if not found.
 */
const updateTurf = async (turfId, data) => {
  const turf = await Turf.findByIdAndUpdate(turfId, data, {
    new:          true,
    runValidators: true,
  })
  if (!turf) throw new ApiError(404, MESSAGES.TURF.NOT_FOUND)
  return turf
}

/**
 * Soft-delete a turf by setting isActive = false.
 * Throws 404 if not found.
 */
const deleteTurf = async (turfId) => {
  const turf = await Turf.findByIdAndUpdate(
    turfId,
    { isActive: false },
    { new: true }
  )
  if (!turf) throw new ApiError(404, MESSAGES.TURF.NOT_FOUND)
  return { message: MESSAGES.TURF.DEACTIVATED }
}

module.exports = { getAllTurfs, getTurfById, createTurf, updateTurf, deleteTurf }
