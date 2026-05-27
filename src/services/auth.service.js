'use strict'

const bcrypt         = require('bcryptjs')
const jwt            = require('jsonwebtoken')
const config         = require('../config/env')
const firebaseAdmin  = require('../config/firebase')
const User           = require('../models/User')
const ApiError       = require('../utils/ApiError')
const { decryptAES } = require('../utils/encrypt')
const { authDebug }  = require('../utils/logger')
const MESSAGES       = require('../common/constants/messages.constant')

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Generate a short-lived access token and a 30-day refresh token.
 * @param {import('mongoose').Types.ObjectId} userId
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const _generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  )
  const refreshToken = jwt.sign(
    { userId },
    config.JWT_SECRET,
    { expiresIn: '30d' }
  )
  return { accessToken, refreshToken }
}

/**
 * Return a safe, plain-object representation of the user.
 * @param {import('../models/User')} user
 */
const _sanitizeUser = (user) => ({
  _id:        user._id,
  name:       user.name,
  phone:      user.phone ? decryptAES(user.phone) : null,
  email:      user.email || null,
  role:       user.role,
  isVerified: user.isVerified,
  createdAt:  user.createdAt,
})

/**
 * Hash the raw refresh token with bcrypt and persist it on the user document.
 * @param {import('../models/User')} user
 * @param {string} refreshToken
 */
const _attachRefreshToken = async (user, refreshToken) => {
  user.refreshToken = await bcrypt.hash(refreshToken, 8)
  await user.save()
  return user
}

const _generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString()

const _setOtp = async (user) => {
  const otp = _generateOtp()
  user.otp = {
    code:      otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  }
  await user.save()
  return otp
}

const _otpResponse = (otp) => ({
  message: MESSAGES.AUTH.OTP_SENT,
  ...(config.NODE_ENV === 'development' && { otp }),
})

const _toIndianMobile = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 10) return digits
  return phone || null
}

// ---------------------------------------------------------------------------
// Exported service functions
// ---------------------------------------------------------------------------

/**
 * Register a new user with phone OTP.
 * Generates a 4-digit OTP valid for 10 minutes.
 */
const register = async (name, phone) => {
  const existing = await User.findByPhone(phone)
  if (existing) {
    throw new ApiError(409, MESSAGES.AUTH.PHONE_EXISTS)
  }

  const user = await User.create({ name, phone })
  const otp = await _setOtp(user)

  authDebug('Signup OTP for %s -> %s', phone, otp)

  return _otpResponse(otp)
}

/**
 * Verify the OTP for a phone number.
 * Marks the user as verified, clears the OTP, and issues tokens.
 */
const verifyOtp = async (phone, otp) => {
  const user = await User.findByPhone(phone)
  if (!user) {
    throw new ApiError(404, MESSAGES.COMMON.USER_NOT_FOUND)
  }

  if (user.otp?.code !== otp) {
    throw new ApiError(400, MESSAGES.AUTH.OTP_INVALID)
  }

  if (new Date() > user.otp.expiresAt) {
    throw new ApiError(400, MESSAGES.AUTH.OTP_EXPIRED)
  }

  user.isVerified = true
  user.otp        = undefined

  const tokens = _generateTokens(user._id)
  await _attachRefreshToken(user, tokens.refreshToken)

  return { ...tokens, user: _sanitizeUser(user) }
}

/**
 * Send a login OTP to an existing user.
 */
const login = async (phone) => {
  const user = await User.findByPhone(phone)
  if (!user) {
    throw new ApiError(401, MESSAGES.AUTH.INVALID_CREDS)
  }

  const otp = await _setOtp(user)

  authDebug('Login OTP for %s -> %s', phone, otp)

  return _otpResponse(otp)
}

/**
 * Return OTP details for the development EJS preview.
 */
const getOtpPreview = async (phone) => {
  const user = await User.findByPhone(phone)
  if (!user) {
    throw new ApiError(404, MESSAGES.COMMON.USER_NOT_FOUND)
  }

  if (!user.otp?.code) {
    throw new ApiError(404, MESSAGES.AUTH.OTP_INVALID)
  }

  return {
    name: user.name,
    otp:  user.otp.code,
  }
}

/**
 * Authenticate via Firebase ID token.
 * Creates or links a user record using Firebase's verified phone number.
 */
const firebaseLogin = async (firebaseToken, name) => {
  let decoded
  try {
    decoded = await firebaseAdmin.auth().verifyIdToken(firebaseToken)
  } catch {
    throw new ApiError(401, MESSAGES.AUTH.INVALID_FIREBASE)
  }

  const { uid, phone_number, email, name: fbName } = decoded
  const phone = _toIndianMobile(phone_number)
  if (!phone_number && !email) {
    throw new ApiError(401, MESSAGES.AUTH.INVALID_FIREBASE)
  }

  let user = await User.findOne({ firebaseUid: uid })
  if (!user && phone) {
    user = await User.findByPhone(phone)
  }
  if (!user && email) {
    user = await User.findOne({ email })
  }

  if (!user) {
    user = await User.create({
      name:        name || fbName || 'User',
      firebaseUid: uid,
      phone:       phone,
      email:       email || null,
      isVerified:  true,
    })
  } else {
    user.firebaseUid = user.firebaseUid || uid
    user.isVerified  = true

    if (name) user.name = name
    if (email && !user.email) user.email = email
    if (phone && !user.phone) user.phone = phone

    await user.save()
  }

  const tokens = _generateTokens(user._id)
  await _attachRefreshToken(user, tokens.refreshToken)

  return { ...tokens, user: _sanitizeUser(user) }
}

/**
 * Verify the refresh token and issue a new access token.
 */
const refreshAccessToken = async (refreshToken) => {
  let decoded
  try {
    decoded = jwt.verify(refreshToken, config.JWT_SECRET)
  } catch {
    throw new ApiError(401, MESSAGES.AUTH.REFRESH_INVALID)
  }

  const user = await User.findById(decoded.userId)
  if (!user?.refreshToken) {
    throw new ApiError(401, MESSAGES.AUTH.REFRESH_INVALID)
  }

  const isValid = await bcrypt.compare(refreshToken, user.refreshToken)
  if (!isValid) {
    throw new ApiError(401, MESSAGES.AUTH.REFRESH_MISMATCH)
  }

  const accessToken = jwt.sign(
    { userId: user._id },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  )

  return { accessToken }
}

/**
 * Log out by clearing the stored refresh token hash.
 */
const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null })
  return { message: MESSAGES.AUTH.LOGGED_OUT }
}

module.exports = {
  register,
  verifyOtp,
  login,
  getOtpPreview,
  firebaseLogin,
  refreshAccessToken,
  logout,
  sanitizeUser: _sanitizeUser,
}
