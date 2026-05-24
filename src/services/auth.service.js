'use strict'

const bcrypt        = require('bcryptjs')
const jwt           = require('jsonwebtoken')
const config        = require('../config/env')
const firebaseAdmin = require('../config/firebase')
const User          = require('../models/User')
const ApiError      = require('../utils/ApiError')
const { decryptAES } = require('../utils/encrypt')
const { authDebug } = require('../utils/logger')
const MESSAGES      = require('../common/constants/messages.constant')

// ---------------------------------------------------------------------------
// Private helpers (not exported)
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
 * Return a safe, plain-object representation of the user (no secrets).
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
 * @param {string} refreshToken - raw (un-hashed) token
 */
const _attachRefreshToken = async (user, refreshToken) => {
  user.refreshToken = await bcrypt.hash(refreshToken, 8)
  await user.save()
  return user
}

// ---------------------------------------------------------------------------
// Exported service functions
// ---------------------------------------------------------------------------

/**
 * Register a new user with phone + password.
 * Generates a 4-digit OTP valid for 10 minutes.
 * In development the OTP is included in the response.
 */
const register = async (name, phone, password) => {
  // 1. Prevent duplicate phone registrations
  const existing = await User.findByPhone(phone)
  if (existing) {
    throw new ApiError(409, MESSAGES.AUTH.PHONE_EXISTS)
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, 10)

  // 3. Generate 4-digit numeric OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString()

  // 4. Create user — pre-save hook will encrypt the phone number automatically
  await User.create({
    name,
    phone,
    passwordHash,
    otp: {
      code:      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  authDebug('OTP for %s → %s', phone, otp)

  return {
    message: MESSAGES.AUTH.OTP_SENT,
    ...(config.NODE_ENV === 'development' && { otp }),
  }
}

/**
 * Verify the OTP for a phone number.
 * Marks the user as verified, clears the OTP, and issues tokens.
 */
const verifyOtp = async (phone, otp) => {
  // 1. User must exist
  const user = await User.findByPhone(phone)
  if (!user) {
    throw new ApiError(404, MESSAGES.COMMON.USER_NOT_FOUND)
  }

  // 2. OTP must match
  if (user.otp?.code !== otp) {
    throw new ApiError(400, MESSAGES.AUTH.OTP_INVALID)
  }

  // 3. OTP must not be expired
  if (new Date() > user.otp.expiresAt) {
    throw new ApiError(400, MESSAGES.AUTH.OTP_EXPIRED)
  }

  // 4. Mark verified and clear OTP
  user.isVerified = true
  user.otp        = undefined

  // 5. Generate tokens and persist hashed refresh token
  const tokens = _generateTokens(user._id)
  await _attachRefreshToken(user, tokens.refreshToken)

  return { ...tokens, user: _sanitizeUser(user) }
}

/**
 * Log in a verified user with phone + password.
 * Returns tokens — never reveals whether the phone exists (uses 401 for all auth failures).
 */
const login = async (phone, password) => {
  // 1. Look up user — use generic 401 to avoid phone enumeration
  const user = await User.findByPhone(phone)
  if (!user) {
    throw new ApiError(401, MESSAGES.AUTH.INVALID_CREDS)
  }

  // 2. Must be verified before logging in
  if (!user.isVerified) {
    throw new ApiError(403, MESSAGES.AUTH.UNVERIFIED)
  }

  // 3. Must not be a social-only account
  if (!user.passwordHash) {
    throw new ApiError(400, MESSAGES.AUTH.SOCIAL_ONLY)
  }

  // 4. Validate password
  const isMatch = await bcrypt.compare(password, user.passwordHash)
  if (!isMatch) {
    throw new ApiError(401, MESSAGES.AUTH.INVALID_CREDS)
  }

  // 5. Issue tokens
  const tokens = _generateTokens(user._id)
  await _attachRefreshToken(user, tokens.refreshToken)

  return { ...tokens, user: _sanitizeUser(user) }
}

/**
 * Authenticate via Firebase ID token.
 * Creates a new user record on first login.
 */
const firebaseLogin = async (firebaseToken) => {
  // 1. Verify Firebase token — any failure maps to 401
  let decoded
  try {
    decoded = await firebaseAdmin.auth().verifyIdToken(firebaseToken)
  } catch {
    throw new ApiError(401, MESSAGES.AUTH.INVALID_FIREBASE)
  }

  const { uid, phone_number, email, name: fbName } = decoded

  // 2. Find or create the user
  let user = await User.findOne({ firebaseUid: uid })

  if (!user) {
    // Pre-save hook encrypts phone_number if provided
    user = await User.create({
      name:        fbName || 'User',
      firebaseUid: uid,
      phone:       phone_number || null,
      email:       email || null,
      isVerified:  true,
    })
  }

  // 3. Issue tokens
  const tokens = _generateTokens(user._id)
  await _attachRefreshToken(user, tokens.refreshToken)

  return { ...tokens, user: _sanitizeUser(user) }
}

/**
 * Rotate: verify the refresh token, issue a new access token.
 * Does NOT rotate the refresh token itself (single-rotation pattern).
 */
const refreshAccessToken = async (refreshToken) => {
  // 1. Verify JWT signature / expiry
  let decoded
  try {
    decoded = jwt.verify(refreshToken, config.JWT_SECRET)
  } catch {
    throw new ApiError(401, MESSAGES.AUTH.REFRESH_INVALID)
  }

  // 2. Load user
  const user = await User.findById(decoded.userId)
  if (!user?.refreshToken) {
    throw new ApiError(401, MESSAGES.AUTH.REFRESH_INVALID)
  }

  // 3. Verify stored hash matches the provided raw token
  const isValid = await bcrypt.compare(refreshToken, user.refreshToken)
  if (!isValid) {
    throw new ApiError(401, MESSAGES.AUTH.REFRESH_MISMATCH)
  }

  // 4. Issue new access token only
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
  firebaseLogin,
  refreshAccessToken,
  logout,
}
