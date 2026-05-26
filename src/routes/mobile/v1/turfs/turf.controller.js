'use strict'

const asyncHandler  = require('../../../../utils/asyncHandler')
const ApiResponse   = require('../../../../utils/ApiResponse')
const turfService   = require('../../../../services/turf.service')
const MESSAGES      = require('../../../../common/constants/messages.constant')

const getAllTurfs = asyncHandler(async (req, res) => {
  const result = await turfService.getAllTurfs(req.query)
  return ApiResponse.success(res, result)
})

const getTurfById = asyncHandler(async (req, res) => {
  const result = await turfService.getTurfById(req.params.id)
  return ApiResponse.success(res, result)
})

const createTurf = asyncHandler(async (req, res) => {
  const result = await turfService.createTurf(req.body)
  return ApiResponse.created(res, result, MESSAGES.TURF.CREATED)
})

const updateTurf = asyncHandler(async (req, res) => {
  const result = await turfService.updateTurf(req.params.id, req.body)
  return ApiResponse.success(res, result, MESSAGES.TURF.UPDATED)
})

const deleteTurf = asyncHandler(async (req, res) => {
  const result = await turfService.deleteTurf(req.params.id)
  return ApiResponse.success(res, result)
})

module.exports = { getAllTurfs, getTurfById, createTurf, updateTurf, deleteTurf }
