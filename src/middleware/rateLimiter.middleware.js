'use strict'

const rateLimit = require('express-rate-limit')

const handler = (req, res) =>
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
  })

// All routes — baseline protection
const generalLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             100,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
})

// All /auth/* routes
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
})

// OTP-sending routes only (/login and /register)
const otpLimiter = rateLimit({
  windowMs:        60 * 60 * 1000, // 1 hour
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
})

module.exports = { generalLimiter, authLimiter, otpLimiter }
