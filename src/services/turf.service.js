'use strict'

const prisma   = require('../config/prisma')
const ApiError = require('../utils/ApiError')
const MESSAGES = require('../common/constants/messages.constant')

// Reshape flat DB row → nested API shape the frontend expects
const _format = (turf) => ({
  _id:         turf.id,
  name:        turf.name,
  description: turf.description,
  location: {
    address: turf.address,
    city:    turf.city,
    pincode: turf.pincode,
  },
  amenities:    turf.amenities,
  pricePerHour: turf.pricePerHour,
  operatingHours: {
    open:  turf.openTime,
    close: turf.closeTime,
  },
  isActive:  turf.isActive,
  createdAt: turf.createdAt,
  updatedAt: turf.updatedAt,
})

// Flatten nested input → DB columns
const _flatten = (data) => {
  const out = { ...data }
  if (data.location) {
    out.address = data.location.address
    out.city    = data.location.city
    out.pincode = data.location.pincode ?? ''
    delete out.location
  }
  if (data.operatingHours) {
    out.openTime  = data.operatingHours.open
    out.closeTime = data.operatingHours.close
    delete out.operatingHours
  }
  return out
}

const getAllTurfs = async ({ city, isActive } = {}) => {
  const where = {}

  if (city) {
    where.city = { contains: city, mode: 'insensitive' }
  }

  if (isActive === 'all') {
    // no filter — admin view
  } else if (isActive !== undefined && isActive !== null && isActive !== '') {
    where.isActive = isActive === 'true' || isActive === true
  } else {
    where.isActive = true
  }

  const turfs = await prisma.turf.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return turfs.map(_format)
}

const getTurfById = async (turfId) => {
  const turf = await prisma.turf.findUnique({ where: { id: turfId } })
  if (!turf) throw new ApiError(404, MESSAGES.TURF.NOT_FOUND)
  return _format(turf)
}

const createTurf = async (data) => {
  const turf = await prisma.turf.create({ data: _flatten(data) })
  return _format(turf)
}

const updateTurf = async (turfId, data) => {
  const turf = await prisma.turf.update({
    where: { id: turfId },
    data:  _flatten(data),
  }).catch(() => { throw new ApiError(404, MESSAGES.TURF.NOT_FOUND) })

  return _format(turf)
}

const deleteTurf = async (turfId) => {
  await prisma.turf.update({
    where: { id: turfId },
    data:  { isActive: false },
  }).catch(() => { throw new ApiError(404, MESSAGES.TURF.NOT_FOUND) })

  return { message: MESSAGES.TURF.DEACTIVATED }
}

module.exports = { getAllTurfs, getTurfById, createTurf, updateTurf, deleteTurf }
