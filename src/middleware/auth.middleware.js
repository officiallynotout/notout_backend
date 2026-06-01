'use strict'

const jwt          = require('jsonwebtoken')
const asyncHandler = require('../utils/asyncHandler')
const ApiError     = require('../utils/ApiError')
const MESSAGES     = require('../common/constants/messages.constant')
const prisma       = require('../config/prisma')
const config       = require('../config/env')

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.accessToken

  if (!token) throw new ApiError(401, MESSAGES.COMMON.UNAUTHORIZED)

  const decoded = jwt.verify(token, config.JWT_SECRET)

  const user = await prisma.user.findUnique({
    where:  { id: decoded.userId },
    select: {
      id: true, name: true, phone: true, email: true,
      role: true, isVerified: true, createdAt: true, updatedAt: true,
    },
  })

  if (!user) throw new ApiError(401, MESSAGES.COMMON.USER_NOT_FOUND)

  // Expose both id and _id so services and middleware work uniformly
  req.user = { ...user, _id: user.id }
  next()
}

module.exports = asyncHandler(authMiddleware)
