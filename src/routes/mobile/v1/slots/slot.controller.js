'use strict'

const asyncHandler  = require('../../../../utils/asyncHandler')
const ApiResponse   = require('../../../../utils/ApiResponse')
const slotService   = require('../../../../services/slot.service')
const MESSAGES      = require('../../../../common/constants/messages.constant')

const getSlots = asyncHandler(async (req, res) => {
  const { turfId, date } = req.query
  const result = await slotService.getSlots({ turfId, date })
  return ApiResponse.success(res, result)
})

const lockSlot = asyncHandler(async (req, res) => {
  const { slotId } = req.body
  const result = await slotService.lockSlot({ slotId, userId: req.user._id })
  return ApiResponse.success(res, result, MESSAGES.SLOT.LOCK_SUCCESS)
})

const releaseSlot = asyncHandler(async (req, res) => {
  const { slotId } = req.params
  const result = await slotService.releaseSlot({ slotId, userId: req.user._id })
  return ApiResponse.success(res, result, MESSAGES.SLOT.RELEASE_SUCCESS)
})

const generateSlots = asyncHandler(async (req, res) => {
  const result = await slotService.generateSlots(req.body)
  return ApiResponse.created(res, result, MESSAGES.SLOT.GENERATED)
})

module.exports = { getSlots, lockSlot, releaseSlot, generateSlots }
