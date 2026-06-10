'use strict'

const asyncHandler = require('../../../../utils/asyncHandler')
const ApiResponse  = require('../../../../utils/ApiResponse')
const boxService   = require('../../../../services/box.service')

const getBoxes = asyncHandler(async (req, res) => {
  const result = await boxService.getBoxesByTurf(req.params.turfId)
  return ApiResponse.success(res, result)
})

module.exports = { getBoxes }
