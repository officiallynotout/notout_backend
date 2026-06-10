'use strict'

const rateLimit = require('express-rate-limit')

const isDev = process.env.NODE_ENV !== 'production'

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
  skip: () => isDev,
})

// All /auth/* routes
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
  skip: () => isDev,
})

// OTP-sending routes only (/login and /register)
const otpLimiter = rateLimit({
  windowMs:        60 * 60 * 1000, // 1 hour
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
  skip: () => isDev,
})

// Per-ball scoring routes — 1 ball every ~30s, allow headroom for fast play
const cricketLimiter = rateLimit({
  windowMs:        60 * 1000,  // 1 minute
  max:             30,          // max 30 balls/minute per IP (well above any real match pace)
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
  skip: () => isDev,
})

module.exports = { generalLimiter, authLimiter, otpLimiter, cricketLimiter }
