'use strict'

const express      = require('express')
const cors         = require('cors')
const cookieParser = require('cookie-parser')
const morgan       = require('morgan')
const path         = require('path')
const config       = require('./config/env')
const errorHandler             = require('./middleware/errorHandler.middleware')
const { generalLimiter }       = require('./middleware/rateLimiter.middleware')
const MESSAGES                 = require('./common/constants/messages.constant')

const app = express()

// ── Body parsers ────────────────────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = new Set([
  config.CLIENT_URL,
  'http://localhost:8081',
  'http://127.0.0.1:8081',
])

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true)
    return callback(null, false)
  },
  credentials: true,
}))

// ── Request logging ─────────────────────────────────────────────────────────
app.use(config.NODE_ENV === 'development' ? morgan('dev') : morgan('combined'))

// ── Trust one proxy layer (required for express-rate-limit behind a proxy/tunnel)
app.set('trust proxy', 1)

// ── Rate limiting ────────────────────────────────────────────────────────────
app.use(generalLimiter)

// ── View engine (EJS for email templates) ───────────────────────────────────
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '../views'))

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/mobile/v1', require('./routes/mobile/v1/index'))

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ success: true, status: 'ok', env: config.NODE_ENV })
)

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: MESSAGES.COMMON.ROUTE_NOT_FOUND })
)

// ── Central error handler (must be last) ─────────────────────────────────────
app.use(errorHandler)

module.exports = app
