'use strict'

const User     = require('../models/User')
const ApiError = require('../utils/ApiError')
const MESSAGES = require('../common/constants/messages.constant')
const { decryptAES } = require('../utils/encrypt')

/**
 * Format a User document for a safe, readable profile response.
 * Decrypts phone and strips internal fields.
 */
const formatProfile = (user) => ({
  _id:        user._id,
  name:       user.name,
  phone:      user.phone ? decryptAES(user.phone) : null,
  email:      user.email  || null,
  role:       user.role,
  isVerified: user.isVerified,
  createdAt:  user.createdAt,
})

/**
 * Return formatted profile for the authenticated user.
 * Accepts the req.user document directly — no extra DB call needed.
 */
const getProfile = (user) => formatProfile(user)

/**
 * Update the authenticated user's name.
 * Only `name` is allowed to change via this endpoint.
 */
const updateProfile = async (userId, { name }) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { name },
    { new: true, runValidators: true }
  ).select('-otp -refreshToken -phoneHash -__v')

  if (!user) throw new ApiError(404, MESSAGES.COMMON.USER_NOT_FOUND)

  return formatProfile(user)
}

module.exports = { getProfile, updateProfile }
