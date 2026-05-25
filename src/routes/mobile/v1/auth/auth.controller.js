'use strict'

const asyncHandler = require('../../../../utils/asyncHandler')
const ApiResponse  = require('../../../../utils/ApiResponse')
const authService  = require('../../../../services/auth.service')
const bookingService = require('../../../../services/booking.service')
const config       = require('../../../../config/env')
const MESSAGES     = require('../../../../common/constants/messages.constant')

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

const durationToMs = (value, fallbackMs) => {
  const match = String(value || '').match(/^(\d+)([smhd])$/)
  if (!match) return fallbackMs

  const amount = Number(match[1])
  const unit = match[2]
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }

  return amount * multipliers[unit]
}

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure:   config.NODE_ENV === 'production',
  sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge,
})

const setAuthCookies = (res, tokens) => {
  res.cookie(
    'accessToken',
    tokens.accessToken,
    cookieOptions(durationToMs(config.JWT_EXPIRES_IN, 15 * 60 * 1000))
  )
  res.cookie('refreshToken', tokens.refreshToken, cookieOptions(THIRTY_DAYS_MS))
}

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', cookieOptions(0))
  res.clearCookie('refreshToken', cookieOptions(0))
}

const cookieState = (req) => ({
  hasAccessToken:  Boolean(req.cookies.accessToken),
  hasRefreshToken: Boolean(req.cookies.refreshToken),
})

const baseViewData = (req, data = {}) => ({
  message: '',
  error:   '',
  phone:   '',
  otp:     '',
  user:    null,
  cookies: cookieState(req),
  ...data,
})

const renderAuthPage = (req, res, view, data = {}) =>
  res.render(`auth/${view}`, baseViewData(req, data))

const authStyles = (req, res) => {
  res.type('text/css').send(`
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f4f7f5;
      color: #1b2d24;
      font-family: Arial, sans-serif;
    }
    .shell {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 28px 18px;
    }
    .compact .panel { max-width: 440px; }
    .panel {
      width: 100%;
      max-width: 620px;
      background: #ffffff;
      border: 1px solid #d9e6df;
      border-radius: 8px;
      padding: 28px;
      box-shadow: 0 2px 12px rgba(22, 45, 32, 0.08);
    }
    h1 {
      margin: 0 0 8px;
      color: #157342;
      font-size: 30px;
    }
    .muted {
      margin: 0 0 20px;
      color: #66736c;
      line-height: 1.5;
    }
    label {
      display: block;
      margin: 14px 0 6px;
      font-size: 13px;
      font-weight: 700;
    }
    input {
      width: 100%;
      height: 44px;
      border: 1px solid #bdccc3;
      border-radius: 6px;
      padding: 0 12px;
      font-size: 15px;
    }
    button,
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      border: 0;
      border-radius: 6px;
      background: #157342;
      color: #ffffff;
      cursor: pointer;
      font-weight: 700;
      padding: 0 16px;
      text-decoration: none;
    }
    .secondary { background: #34443b; }
    .danger { background: #b83232; }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 18px;
    }
    .notice,
    .error {
      border-radius: 8px;
      margin: 14px 0;
      padding: 12px 14px;
      font-weight: 700;
    }
    .notice {
      background: #e8f6ee;
      border: 1px solid #bce0cb;
      color: #116638;
    }
    .error {
      background: #fff0f0;
      border: 1px solid #e6bcbc;
      color: #9b1c1c;
    }
    .otp {
      display: inline-block;
      margin: 4px 0 14px;
      border: 2px dashed #157342;
      border-radius: 8px;
      background: #effaf4;
      color: #157342;
      font-family: "Courier New", monospace;
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 10px;
      padding: 14px 22px;
    }
    .status {
      display: grid;
      gap: 8px;
      margin-top: 18px;
      border-top: 1px solid #e2ece6;
      padding-top: 16px;
      color: #536159;
    }
    .switch { margin: 18px 0 0; color: #66736c; }
    .switch a,
    .back {
      color: #157342;
      font-weight: 700;
      text-decoration: none;
    }
    .back {
      display: inline-block;
      margin-bottom: 16px;
    }
    dl {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 10px 14px;
      margin: 18px 0 0;
    }
    dt { font-weight: 700; }
    dd { margin: 0; overflow-wrap: anywhere; }
  `)
}

/**
 * POST /mobile/v1/auth/register
 * Register a new user and send OTP.
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body.name, req.body.phone)
  return ApiResponse.created(res, result, result.message)
})

/**
 * POST /mobile/v1/auth/verify-otp
 * Verify phone OTP and return tokens.
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyOtp(req.body.phone, req.body.otp)
  setAuthCookies(res, result)
  return ApiResponse.success(res, result, MESSAGES.AUTH.VERIFIED)
})

/**
 * POST /mobile/v1/auth/login
 * Send a login OTP to an existing phone number.
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.phone)
  return ApiResponse.success(res, result, result.message)
})

/**
 * GET /mobile/v1/auth/otp-preview?phone=9876543210
 * Development helper that renders the latest OTP in the EJS template.
 */
const otpPreview = asyncHandler(async (req, res) => {
  const result = await authService.getOtpPreview(req.query.phone)
  return res.render('emails/otp', result)
})

const authTest = asyncHandler(async (req, res) =>
  renderAuthPage(req, res, 'index', {
    message: req.query.message || '',
    error:   req.query.error || '',
  })
)

const showSignupPage = asyncHandler(async (req, res) =>
  renderAuthPage(req, res, 'signup', {
    message: req.query.message || '',
    error:   req.query.error || '',
    phone:   req.query.phone || '',
  })
)

const showLoginPage = asyncHandler(async (req, res) =>
  renderAuthPage(req, res, 'login', {
    message: req.query.message || '',
    error:   req.query.error || '',
    phone:   req.query.phone || '',
  })
)

const showBookingPage = asyncHandler(async (req, res) =>
  renderAuthPage(req, res, 'booking', {
    message: req.query.message || '',
    error:   req.query.error || '',
  })
)

const testSignup = asyncHandler(async (req, res) => {
  try {
    const result = await authService.register(req.body.name, req.body.phone)
    return renderAuthPage(req, res, 'verify', {
      message: result.message,
      otp:     result.otp,
      phone:   req.body.phone,
    })
  } catch (err) {
    if (err.statusCode === 409) {
      return res.redirect(
        `/mobile/v1/auth/test/login?phone=${encodeURIComponent(req.body.phone)}&message=${encodeURIComponent('User already exists. Please login with OTP.')}`
      )
    }

    return renderAuthPage(req, res, 'signup', {
      error: err.message,
      phone: req.body.phone,
    })
  }
})

const testLogin = asyncHandler(async (req, res) => {
  try {
    const result = await authService.login(req.body.phone)
    return renderAuthPage(req, res, 'verify', {
      message: result.message,
      otp:     result.otp,
      phone:   req.body.phone,
    })
  } catch (err) {
    return renderAuthPage(req, res, 'login', {
      error: err.message,
      phone: req.body.phone,
    })
  }
})

const testVerifyOtp = asyncHandler(async (req, res) => {
  try {
    const result = await authService.verifyOtp(req.body.phone, req.body.otp)
    setAuthCookies(res, result)
    return renderAuthPage(req, res, 'booking', {
      message: MESSAGES.AUTH.VERIFIED,
      phone:   req.body.phone,
      user:    result.user,
      cookies: {
        hasAccessToken:  true,
        hasRefreshToken: true,
      },
    })
  } catch (err) {
    return renderAuthPage(req, res, 'verify', {
      error:   err.message,
      phone:   req.body.phone,
    })
  }
})

const testCreateBooking = asyncHandler(async (req, res) => {
  try {
    const booking = await bookingService.createBooking(req.user._id, req.body)
    return renderAuthPage(req, res, 'booking', {
      message: MESSAGES.BOOKING.CREATED,
      booking,
    })
  } catch (err) {
    return renderAuthPage(req, res, 'booking', {
      error: err.message,
    })
  }
})

const testRefresh = asyncHandler(async (req, res) => {
  try {
    const result = await authService.refreshAccessToken(req.cookies.refreshToken)
    res.cookie(
      'accessToken',
      result.accessToken,
      cookieOptions(durationToMs(config.JWT_EXPIRES_IN, 15 * 60 * 1000))
    )
    return renderAuthPage(req, res, 'booking', {
      message: MESSAGES.AUTH.TOKEN_REFRESHED,
      cookies: {
        hasAccessToken:  true,
        hasRefreshToken: Boolean(req.cookies.refreshToken),
      },
    })
  } catch (err) {
    return renderAuthPage(req, res, 'index', {
      error: err.message,
    })
  }
})

const testLogout = asyncHandler(async (req, res) => {
  if (req.user?._id) {
    await authService.logout(req.user._id)
  }
  clearAuthCookies(res)
  return res.redirect(
    `/mobile/v1/auth/test?message=${encodeURIComponent(MESSAGES.AUTH.LOGGED_OUT)}`
  )
})

/**
 * POST /mobile/v1/auth/firebase
 * Authenticate via Firebase ID token.
 */
const firebaseLogin = asyncHandler(async (req, res) => {
  const result = await authService.firebaseLogin(req.body.firebaseToken)
  setAuthCookies(res, result)
  return ApiResponse.success(res, result, MESSAGES.AUTH.LOGIN_SUCCESS)
})

/**
 * POST /mobile/v1/auth/refresh
 * Exchange a valid refresh token for a new access token.
 */
const refreshToken = asyncHandler(async (req, res) => {
  const refreshTokenValue = req.body.refreshToken || req.cookies.refreshToken
  const result = await authService.refreshAccessToken(refreshTokenValue)
  res.cookie(
    'accessToken',
    result.accessToken,
    cookieOptions(durationToMs(config.JWT_EXPIRES_IN, 15 * 60 * 1000))
  )
  return ApiResponse.success(res, result, MESSAGES.AUTH.TOKEN_REFRESHED)
})

/**
 * POST /mobile/v1/auth/logout
 * Invalidate the user's refresh token. Requires authMiddleware.
 */
const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.user._id)
  clearAuthCookies(res)
  return ApiResponse.success(res, result, MESSAGES.AUTH.LOGGED_OUT)
})

module.exports = {
  register,
  verifyOtp,
  login,
  otpPreview,
  authStyles,
  authTest,
  showSignupPage,
  showLoginPage,
  showBookingPage,
  testSignup,
  testLogin,
  testVerifyOtp,
  testCreateBooking,
  testRefresh,
  testLogout,
  firebaseLogin,
  refreshToken,
  logout,
}
