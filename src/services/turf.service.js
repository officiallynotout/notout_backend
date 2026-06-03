'use strict'

const prisma      = require('../config/prisma')
const ApiError    = require('../utils/ApiError')
const MESSAGES    = require('../common/constants/messages.constant')
const { parsePagination, paginationMeta } = require('../common/helpers/pagination.helper')
const { geocodeAddress } = require('../utils/geocode')
const { haversineKm }    = require('../utils/haversine')

// Reshape flat DB row → nested API shape the frontend expects
const _format = (turf, distance = null) => ({
  _id:         turf.id,
  name:        turf.name,
  description: turf.description,
  location: {
    address:     turf.address,
    city:        turf.city,
    pincode:     turf.pincode,
    coordinates: turf.latitude != null
      ? { latitude: turf.latitude, longitude: turf.longitude }
      : null,
  },
  amenities:    turf.amenities,
  pricePerHour: turf.pricePerHour,
  operatingHours: {
    open:  turf.openTime,
    close: turf.closeTime,
  },
  distance:      distance !== null ? parseFloat(distance.toFixed(2)) : null,
  googleMapsLink: turf.latitude != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${turf.latitude},${turf.longitude}`
    : null,
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

const getAllTurfs = async (query = {}, userLocation = null) => {
  const { city, isActive } = query
  const { page, limit, skip, take } = parsePagination(query)
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

  const hasLocation = userLocation?.latitude != null && userLocation?.longitude != null

  if (hasLocation) {
    // Fetch all matching turfs, sort by distance in JS, then paginate
    const allTurfs = await prisma.turf.findMany({ where })
    const { latitude: uLat, longitude: uLng } = userLocation

    const withDistance = allTurfs
      .map(t => ({
        turf:     t,
        distance: t.latitude != null ? haversineKm(uLat, uLng, t.latitude, t.longitude) : null,
      }))
      .sort((a, b) => {
        if (a.distance === null) return 1
        if (b.distance === null) return -1
        return a.distance - b.distance
      })

    const paginated = withDistance.slice(skip, skip + take)

    return {
      data:       paginated.map(({ turf, distance }) => _format(turf, distance)),
      pagination: paginationMeta(allTurfs.length, page, limit),
    }
  }

  const [turfs, total] = await Promise.all([
    prisma.turf.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.turf.count({ where }),
  ])

  return { data: turfs.map(t => _format(t)), pagination: paginationMeta(total, page, limit) }
}

const getTurfById = async (turfId) => {
  const turf = await prisma.turf.findUnique({ where: { id: turfId } })
  if (!turf) throw new ApiError(404, MESSAGES.TURF.NOT_FOUND)
  return _format(turf)
}

const createTurf = async (data) => {
  const flat = _flatten(data)
  const { latitude, longitude } = await geocodeAddress(flat.address, flat.city, flat.pincode)
  const turf = await prisma.turf.create({ data: { ...flat, latitude, longitude } })
  return _format(turf)
}

const updateTurf = async (turfId, data) => {
  const flat = _flatten(data)

  // Re-geocode if address/city/pincode changed
  if (flat.address || flat.city || flat.pincode) {
    const existing = await prisma.turf.findUnique({ where: { id: turfId } })
    if (!existing) throw new ApiError(404, MESSAGES.TURF.NOT_FOUND)

    const address = flat.address ?? existing.address
    const city    = flat.city    ?? existing.city
    const pincode = flat.pincode ?? existing.pincode
    const { latitude, longitude } = await geocodeAddress(address, city, pincode)
    flat.latitude  = latitude
    flat.longitude = longitude
  }

  const turf = await prisma.turf.update({
    where: { id: turfId },
    data:  flat,
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
