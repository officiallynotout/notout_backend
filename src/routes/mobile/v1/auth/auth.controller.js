'use strict'

const asyncHandler = require('../../../../utils/asyncHandler')
const ApiResponse  = require('../../../../utils/ApiResponse')
const authService  = require('../../../../services/auth.service')
const MESSAGES     = require('../../../../common/constants/messages.constant')

/**
 * POST /mobile/v1/auth/register
 * Register a new user and send OTP.
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(
    req.body.name,
    req.body.phone,
    req.body.password
  )
  return ApiResponse.created(res, result, result.message)
})

/**
 * POST /mobile/v1/auth/verify-otp
 * Verify phone OTP and return tokens.
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyOtp(req.body.phone, req.body.otp)
  return ApiResponse.success(res, result, MESSAGES.AUTH.VERIFIED)
})

/**
 * POST /mobile/v1/auth/login
 * Authenticate with phone + password.
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.phone, req.body.password)
  return ApiResponse.success(res, result, MESSAGES.AUTH.LOGIN_SUCCESS)
})

/**
 * POST /mobile/v1/auth/firebase
 * Authenticate via Firebase ID token.
 */
const firebaseLogin = asyncHandler(async (req, res) => {
  const result = await authService.firebaseLogin(req.body.firebaseToken)
  return ApiResponse.success(res, result, MESSAGES.AUTH.LOGIN_SUCCESS)
})

/**
 * POST /mobile/v1/auth/refresh
 * Exchange a valid refresh token for a new access token.
 */
const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshAccessToken(req.body.refreshToken)
  return ApiResponse.success(res, result, MESSAGES.AUTH.TOKEN_REFRESHED)
})

/**
 * POST /mobile/v1/auth/logout
 * Invalidate the user's refresh token. Requires authMiddleware.
 */
const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.user._id)
  return ApiResponse.success(res, result, MESSAGES.AUTH.LOGGED_OUT)
})

module.exports = { register, verifyOtp, login, firebaseLogin, refreshToken, logout }
