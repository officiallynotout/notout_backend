'use strict'

const router         = require('express').Router()
const authMiddleware = require('../../../middleware/auth.middleware')

// Public — no token required
router.use('/auth', require('./auth/auth.routes'))

// All routes below this line require a valid access token
router.use(authMiddleware)

router.use('/users',    require('./users/user.routes'))
router.use('/turfs',    require('./turfs/turf.routes'))
router.use('/slots',    require('./slots/slot.routes'))
router.use('/bookings', require('./bookings/booking.routes'))

module.exports = router
