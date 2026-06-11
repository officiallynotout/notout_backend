'use strict'

const router         = require('express').Router()
const controller     = require('./auth.controller')
const { validate }   = require('../../../../middleware/validate.middleware')
const authMiddleware = require('../../../../middleware/auth.middleware')
const { authLimiter, otpLimiter } = require('../../../../middleware/rateLimiter.middleware')
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  firebaseAuthSchema,
  refreshTokenSchema,
} = require('./auth.validator')

// Public routes
router.post('/register',   authLimiter, otpLimiter, validate(registerSchema),    controller.register)
router.post('/verify-otp', authLimiter,             validate(verifyOtpSchema),   controller.verifyOtp)
router.post('/login',      authLimiter, otpLimiter, validate(loginSchema),       controller.login)
router.post('/firebase',   authLimiter, validate(firebaseAuthSchema), controller.firebaseLogin)
router.post('/refresh',    authLimiter, validate(refreshTokenSchema), controller.refreshToken)

// Protected routes (require valid access token)
router.get('/me', authMiddleware, controller.me)
router.post('/logout', authMiddleware, controller.logout)

module.exports = router
