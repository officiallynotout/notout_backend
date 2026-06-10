'use strict'

const prisma   = require('../config/prisma')
const ApiError = require('../utils/ApiError')
const MESSAGES = require('../common/constants/messages.constant')

const _format = (box) => ({
  _id:       box.id,
  turfId:    box.turfId,
  name:      box.name,
  isActive:  box.isActive,
  createdAt: box.createdAt,
  updatedAt: box.updatedAt,
})

const getBoxesByTurf = async (turfId) => {
  const turf = await prisma.turf.findFirst({ where: { id: turfId, isActive: true } })
  if (!turf) throw new ApiError(404, MESSAGES.TURF.NOT_FOUND)

  const boxes = await prisma.box.findMany({
    where:   { turfId, isActive: true },
    orderBy: { name: 'asc' },
  })
  return boxes.map(_format)
}

module.exports = { getBoxesByTurf }
