'use strict'

const asyncHandler    = require('../../../../utils/asyncHandler')
const ApiResponse     = require('../../../../utils/ApiResponse')
const cricketService  = require('../../../../services/cricket.service')
const MESSAGES        = require('../../../../common/constants/messages.constant')

const createMatch = asyncHandler(async (req, res) => {
  const result = await cricketService.createMatch(req.user._id, req.body)
  return ApiResponse.created(res, result, MESSAGES.CRICKET.MATCH_CREATED)
})

const listMatches = asyncHandler(async (req, res) => {
  const { data, pagination } = await cricketService.listMatches(req.user._id, req.query)
  return ApiResponse.paginated(res, data, pagination)
})

const getMatch = asyncHandler(async (req, res) => {
  const result = await cricketService.getMatch(req.params.id, req.user._id)
  return ApiResponse.success(res, result)
})

const getMatchByCode = asyncHandler(async (req, res) => {
  const result = await cricketService.getMatchByCode(req.params.code)
  return ApiResponse.success(res, result)
})

const startMatch = asyncHandler(async (req, res) => {
  const result = await cricketService.startMatch(req.params.id, req.user._id, req.body)
  return ApiResponse.success(res, result)
})

const logBall = asyncHandler(async (req, res) => {
  const result = await cricketService.logBall(req.params.id, req.user._id, req.body)
  return ApiResponse.success(res, result)
})

const setNextBatsman = asyncHandler(async (req, res) => {
  const result = await cricketService.setNextBatsman(req.params.id, req.user._id, req.body)
  return ApiResponse.success(res, result)
})

const setNextBowler = asyncHandler(async (req, res) => {
  const result = await cricketService.setNextBowler(req.params.id, req.user._id, req.body)
  return ApiResponse.success(res, result)
})

const startInnings2 = asyncHandler(async (req, res) => {
  const result = await cricketService.startInnings2(req.params.id, req.user._id, req.body)
  return ApiResponse.success(res, result)
})

const completeMatch = asyncHandler(async (req, res) => {
  const result = await cricketService.completeMatch(req.params.id, req.user._id)
  return ApiResponse.success(res, result, MESSAGES.CRICKET.MATCH_COMPLETE)
})

module.exports = {
  createMatch,
  listMatches,
  getMatch,
  getMatchByCode,
  startMatch,
  logBall,
  setNextBatsman,
  setNextBowler,
  startInnings2,
  completeMatch,
}
