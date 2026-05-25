'use strict'

const ApiError       = require('../utils/ApiError')
const MESSAGES       = require('../common/constants/messages.constant')
const { errorDebug } = require('../utils/logger')
const config         = require('../config/env')

/**
 * Central error handler — must be registered LAST in app.js.
 * Handles all thrown ApiErrors and known Mongoose/JWT error shapes.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  errorDebug('%o', err)

  // 1. Operational ApiError (thrown by services / middleware)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors:  err.errors,
    })
  }

  // 2. Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }))
    return res.status(400).json({
      success: false,
      message: MESSAGES.COMMON.VALIDATION_ERROR,
      errors,
    })
  }

  // 3. Mongoose CastError (invalid ObjectId etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: MESSAGES.COMMON.INVALID_ID,
      errors:  [],
    })
  }

  // 4. MongoDB duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: MESSAGES.COMMON.DUPLICATE,
      errors:  [],
    })
  }

  // 5. JWT malformed / invalid signature
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: MESSAGES.AUTH.INVALID_TOKEN,
      errors:  [],
    })
  }

  // 6. JWT expired
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: MESSAGES.AUTH.TOKEN_EXPIRED,
      errors:  [],
    })
  }

  // 7. Default — unexpected server error
  return res.status(500).json({
    success: false,
    message: config.NODE_ENV === 'development' ? err.message : MESSAGES.COMMON.SERVER_ERROR,
    errors:  [],
  })
}

module.exports = errorHandler
