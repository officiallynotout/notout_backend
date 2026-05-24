'use strict'

const router         = require('express').Router()
const controller     = require('./auth.controller')
const { validate }   = require('../../../../middleware/validate.middleware')
const authMiddleware = require('../../../../middleware/auth.middleware')
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  firebaseAuthSchema,
  refreshTokenSchema,
} = require('./auth.validator')

// Public routes
router.post('/register',   validate(registerSchema),    controller.register)
router.post('/verify-otp', validate(verifyOtpSchema),   controller.verifyOtp)
router.post('/login',      validate(loginSchema),        controller.login)
router.post('/firebase',   validate(firebaseAuthSchema), controller.firebaseLogin)
router.post('/refresh',    validate(refreshTokenSchema), controller.refreshToken)

// Protected routes (require valid access token)
router.post('/logout', authMiddleware, controller.logout)

module.exports = router
