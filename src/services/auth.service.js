'use strict'

const bcrypt         = require('bcryptjs')
const jwt            = require('jsonwebtoken')
const config         = require('../config/env')
const firebaseAdmin  = require('../config/firebase')
const prisma         = require('../config/prisma')
const ApiError       = require('../utils/ApiError')
const { encryptAES, hashPhone, decryptAES } = require('../utils/encrypt')
const { authDebug }  = require('../utils/logger')
const MESSAGES       = require('../common/constants/messages.constant')

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

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

const _sanitizeUser = (user) => ({
  _id:        user.id,
  name:       user.name,
  phone:      user.phone ? decryptAES(user.phone) : null,
  email:      user.email || null,
  role:       user.role,
  isVerified: user.isVerified,
  createdAt:  user.createdAt,
})

const _attachRefreshToken = async (userId, refreshToken) => {
  const hashed = await bcrypt.hash(refreshToken, 8)
  return prisma.user.update({
    where: { id: userId },
    data:  { refreshToken: hashed },
  })
}

const _generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString()

const _setOtp = async (userId) => {
  const otp = _generateOtp()
  await prisma.user.update({
    where: { id: userId },
    data: {
      otpCode:      otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })
  return otp
}

const _otpResponse = (otp) => ({
  message: MESSAGES.AUTH.OTP_SENT,
  // ...(config.NODE_ENV === 'development' && { otp }),
  otp,
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

const register = async (name, phone) => {
  const existing = await prisma.user.findUnique({ where: { phoneHash: hashPhone(phone) } })
  if (existing) throw new ApiError(409, MESSAGES.AUTH.PHONE_EXISTS)

  const user = await prisma.user.create({
    data: {
      name,
      phone:     encryptAES(phone),
      phoneHash: hashPhone(phone),
    },
  })

  const otp = await _setOtp(user.id)

  authDebug('Signup OTP for %s -> %s', phone, otp)
  return _otpResponse(otp)
}

const verifyOtp = async (phone, otp) => {
  const user = await prisma.user.findUnique({ where: { phoneHash: hashPhone(phone) } })
  if (!user) throw new ApiError(404, MESSAGES.COMMON.USER_NOT_FOUND)

  if (user.otpCode !== otp) throw new ApiError(400, MESSAGES.AUTH.OTP_INVALID)
  if (new Date() > user.otpExpiresAt) throw new ApiError(400, MESSAGES.AUTH.OTP_EXPIRED)

  await prisma.user.update({
    where: { id: user.id },
    data:  { isVerified: true, otpCode: null, otpExpiresAt: null },
  })

  const tokens = _generateTokens(user.id)
  await _attachRefreshToken(user.id, tokens.refreshToken)

  return { ...tokens, user: _sanitizeUser(user) }
}

const login = async (phone) => {
  const user = await prisma.user.findUnique({ where: { phoneHash: hashPhone(phone) } })
  if (!user) throw new ApiError(401, MESSAGES.AUTH.INVALID_CREDS)

  const otp = await _setOtp(user.id)

  authDebug('Login OTP for %s -> %s', phone, otp)
  return _otpResponse(otp)
}

const firebaseLogin = async (firebaseToken, name) => {
  let decoded
  try {
    decoded = await firebaseAdmin.auth().verifyIdToken(firebaseToken)
  } catch {
    throw new ApiError(401, MESSAGES.AUTH.INVALID_FIREBASE)
  }

  const { uid, phone_number, email, name: fbName } = decoded
  const phone = _toIndianMobile(phone_number)

  if (!phone_number && !email) throw new ApiError(401, MESSAGES.AUTH.INVALID_FIREBASE)

  let user = await prisma.user.findUnique({ where: { firebaseUid: uid } })

  if (!user && phone) {
    user = await prisma.user.findUnique({ where: { phoneHash: hashPhone(phone) } })
  }
  if (!user && email) {
    user = await prisma.user.findUnique({ where: { email } })
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        name:        name || fbName || 'User',
        firebaseUid: uid,
        phone:       phone ? encryptAES(phone) : null,
        phoneHash:   phone ? hashPhone(phone) : null,
        email:       email || null,
        isVerified:  true,
      },
    })
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        firebaseUid: user.firebaseUid || uid,
        isVerified:  true,
        ...(name && { name }),
        ...(email && !user.email && { email }),
        ...(phone && !user.phone && { phone: encryptAES(phone), phoneHash: hashPhone(phone) }),
      },
    })
  }

  const tokens = _generateTokens(user.id)
  await _attachRefreshToken(user.id, tokens.refreshToken)

  return { ...tokens, user: _sanitizeUser(user) }
}

const refreshAccessToken = async (refreshToken) => {
  let decoded
  try {
    decoded = jwt.verify(refreshToken, config.JWT_SECRET)
  } catch {
    throw new ApiError(401, MESSAGES.AUTH.REFRESH_INVALID)
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
  if (!user?.refreshToken) throw new ApiError(401, MESSAGES.AUTH.REFRESH_INVALID)

  const isValid = await bcrypt.compare(refreshToken, user.refreshToken)
  if (!isValid) throw new ApiError(401, MESSAGES.AUTH.REFRESH_MISMATCH)

  const accessToken = jwt.sign(
    { userId: user.id },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  )

  return { accessToken }
}

const logout = async (userId) => {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } })
  return { message: MESSAGES.AUTH.LOGGED_OUT }
}

module.exports = {
  register,
  verifyOtp,
  login,
  firebaseLogin,
  refreshAccessToken,
  logout,
  sanitizeUser: _sanitizeUser,
}
