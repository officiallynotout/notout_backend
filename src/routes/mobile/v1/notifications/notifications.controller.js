'use strict'

const asyncHandler           = require('../../../../utils/asyncHandler')
const ApiResponse            = require('../../../../utils/ApiResponse')
const notificationService    = require('../../../../services/notification.service')
const MESSAGES               = require('../../../../common/constants/messages.constant')

/**
 * POST /mobile/v1/notifications/register-token
 * Save the user's Expo push token.
 */
const registerToken = asyncHandler(async (req, res) => {
  await notificationService.registerToken(req.user.id, req.body.token)
  return ApiResponse.success(res, null, MESSAGES.NOTIFICATION.TOKEN_SAVED)
})

/**
 * DELETE /mobile/v1/notifications/register-token
 * Remove the user's Expo push token (on logout / permission revoked).
 */
const removeToken = asyncHandler(async (req, res) => {
  await notificationService.registerToken(req.user.id, null)
  return ApiResponse.success(res, null, MESSAGES.NOTIFICATION.TOKEN_REMOVED)
})

module.exports = { registerToken, removeToken }
