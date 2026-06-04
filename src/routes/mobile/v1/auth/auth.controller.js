'use strict'

const jwt          = require('jsonwebtoken')
const asyncHandler = require('../../../../utils/asyncHandler')
const ApiResponse  = require('../../../../utils/ApiResponse')
const authService  = require('../../../../services/auth.service')
const config       = require('../../../../config/env')
const MESSAGES     = require('../../../../common/constants/messages.constant')

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

const durationToMs = (value, fallbackMs) => {
  const match = String(value || '').match(/^(\d+)([smhd])$/)
  if (!match) return fallbackMs

  const amount = Number(match[1])
  const unit = match[2]
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }

  return amount * multipliers[unit]
}

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure:   config.NODE_ENV === 'production',
  sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge,
})

const setAuthCookies = (res, tokens) => {
  res.cookie(
    'accessToken',
    tokens.accessToken,
    cookieOptions(durationToMs(config.JWT_EXPIRES_IN, 15 * 60 * 1000))
  )
  res.cookie('refreshToken', tokens.refreshToken, cookieOptions(THIRTY_DAYS_MS))
}

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', cookieOptions(0))
  res.clearCookie('refreshToken', cookieOptions(0))
}

/**
 * POST /mobile/v1/auth/register
 * Register a new user and send OTP.
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body.name, req.body.phone)
  return ApiResponse.created(res, result, result.message)
})

/**
 * POST /mobile/v1/auth/verify-otp
 * Verify phone OTP and return tokens.
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyOtp(req.body.phone, req.body.otp)
  setAuthCookies(res, result)
  return ApiResponse.success(res, result, MESSAGES.AUTH.VERIFIED)
})

/**
 * POST /mobile/v1/auth/login
 * Send a login OTP to an existing phone number.
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.phone)
  return ApiResponse.success(res, result, result.message)
})

/**
 * POST /mobile/v1/auth/firebase
 * Authenticate via Firebase ID token.
 */
const firebaseLogin = asyncHandler(async (req, res) => {
  const result = await authService.firebaseLogin(req.body.firebaseToken, req.body.name)
  setAuthCookies(res, result)
  return ApiResponse.success(res, result, MESSAGES.AUTH.LOGIN_SUCCESS)
})

/**
 * GET /mobile/v1/auth/me
 * Return the authenticated user's profile.
 */
const me = asyncHandler(async (req, res) =>
  ApiResponse.success(res, authService.sanitizeUser(req.user))
)

/**
 * POST /mobile/v1/auth/refresh
 * Exchange a valid refresh token for a new access token.
 */
const refreshToken = asyncHandler(async (req, res) => {
  const refreshTokenValue = req.body.refreshToken || req.cookies.refreshToken
  const result = await authService.refreshAccessToken(refreshTokenValue)
  res.cookie(
    'accessToken',
    result.accessToken,
    cookieOptions(durationToMs(config.JWT_EXPIRES_IN, 15 * 60 * 1000))
  )
  return ApiResponse.success(res, result, MESSAGES.AUTH.TOKEN_REFRESHED)
})

/**
 * POST /mobile/v1/auth/logout
 * Invalidate the user's refresh token. Requires authMiddleware.
 */
const logout = asyncHandler(async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.accessToken
    if (token) {
      const decoded = jwt.verify(token, config.JWT_SECRET)
      await authService.logout(decoded.userId)
    }
  } catch {
    // Token invalid or user not found — still clear client session
  }
  clearAuthCookies(res)
  return ApiResponse.success(res, null, MESSAGES.AUTH.LOGGED_OUT)
})

module.exports = {
  register,
  verifyOtp,
  login,
  firebaseLogin,
  me,
  refreshToken,
  logout,
}
