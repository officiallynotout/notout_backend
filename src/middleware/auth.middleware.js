'use strict'

const jwt          = require('jsonwebtoken')
const asyncHandler = require('../utils/asyncHandler')
const ApiError     = require('../utils/ApiError')
const MESSAGES     = require('../common/constants/messages.constant')
const User         = require('../models/User')
const config       = require('../config/env')

const authMiddleware = async (req, res, next) => {
  // 1. Extract Bearer token or HTTP-only cookie token
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.accessToken

  // 2. Require token presence
  if (!token) {
    throw new ApiError(401, MESSAGES.COMMON.UNAUTHORIZED)
  }

  // 3. Verify signature — throws JsonWebTokenError / TokenExpiredError on failure,
  //    which are caught and mapped by errorHandler.
  const decoded = jwt.verify(token, config.JWT_SECRET)

  // 4. Load user (exclude sensitive fields)
  const user = await User.findById(decoded.userId).select(
    '-otp -refreshToken'
  )

  // 5. User must still exist in DB
  if (!user) {
    throw new ApiError(401, MESSAGES.COMMON.USER_NOT_FOUND)
  }

  // 6. Attach to request for downstream handlers
  req.user = user
  next()
}

module.exports = asyncHandler(authMiddleware)
