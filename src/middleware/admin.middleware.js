'use strict'

const asyncHandler = require('../utils/asyncHandler')
const ApiError     = require('../utils/ApiError')
const MESSAGES     = require('../common/constants/messages.constant')
const ROLES        = require('../common/constants/roles.constant')

/**
 * Must be used AFTER authMiddleware (requires req.user to be set).
 * Restricts access to users with ADMIN role.
 */
const adminMiddleware = async (req, res, next) => {
  if (req.user.role !== ROLES.ADMIN) {
    throw new ApiError(403, MESSAGES.COMMON.ADMIN_ONLY)
  }
  next()
}

module.exports = asyncHandler(adminMiddleware)
