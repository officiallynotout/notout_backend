'use strict'

const router         = require('express').Router()
const controller     = require('./auth.controller')
const { validate }   = require('../../../../middleware/validate.middleware')
const authMiddleware = require('../../../../middleware/auth.middleware')
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  otpPreviewSchema,
  firebaseAuthSchema,
  refreshTokenSchema,
} = require('./auth.validator')

// Browser test pages
router.get('/test/styles.css', controller.authStyles)
router.get('/test', controller.authTest)
router.get('/test/signup', controller.showSignupPage)
router.get('/test/login', controller.showLoginPage)
router.get('/test/booking', authMiddleware, controller.showBookingPage)
router.post('/test/signup', controller.testSignup)
router.post('/test/login', controller.testLogin)
router.post('/test/verify-otp', controller.testVerifyOtp)
router.post('/test/booking', authMiddleware, controller.testCreateBooking)
router.post('/test/refresh', controller.testRefresh)
router.post('/test/logout', authMiddleware, controller.testLogout)

// Public routes
router.post('/register',   validate(registerSchema),    controller.register)
router.post('/verify-otp', validate(verifyOtpSchema),   controller.verifyOtp)
router.post('/login',      validate(loginSchema),        controller.login)
router.get('/otp-preview', validate(otpPreviewSchema, 'query'), controller.otpPreview)
router.post('/firebase',   validate(firebaseAuthSchema), controller.firebaseLogin)
router.post('/refresh',    validate(refreshTokenSchema), controller.refreshToken)

// Protected routes (require valid access token)
router.post('/logout', authMiddleware, controller.logout)

module.exports = router
