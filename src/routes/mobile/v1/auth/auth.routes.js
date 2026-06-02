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
router.post('/register',   authLimiter, otpLimiter, validate(registerSchema),    controller.register)
router.post('/verify-otp', authLimiter,             validate(verifyOtpSchema),   controller.verifyOtp)
router.post('/login',      authLimiter, otpLimiter, validate(loginSchema),       controller.login)
router.get('/otp-preview', validate(otpPreviewSchema, 'query'), controller.otpPreview)
router.post('/firebase',   authLimiter, validate(firebaseAuthSchema), controller.firebaseLogin)
router.post('/refresh',    authLimiter, validate(refreshTokenSchema), controller.refreshToken)

// Protected routes (require valid access token)
router.get('/me', authMiddleware, controller.me)
router.post('/logout', authMiddleware, controller.logout)

module.exports = router
