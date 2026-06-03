'use strict'

const asyncHandler  = require('../../../../utils/asyncHandler')
const ApiResponse   = require('../../../../utils/ApiResponse')
const userService   = require('../../../../services/user.service')
const MESSAGES      = require('../../../../common/constants/messages.constant')

const getProfile = asyncHandler(async (req, res) => {
  const profile = userService.getProfile(req.user)
  return ApiResponse.success(res, profile)
})

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await userService.updateProfile(req.user._id, req.body)
  return ApiResponse.success(res, profile, MESSAGES.USER.UPDATED)
})

const updateLocation = asyncHandler(async (req, res) => {
  await userService.updateLocation(req.user._id, req.body)
  return ApiResponse.success(res, null, MESSAGES.USER.LOCATION_UPDATED)
})

module.exports = { getProfile, updateProfile, updateLocation }
