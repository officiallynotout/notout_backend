'use strict'

const router = require('express').Router()

// Auth module
router.use('/auth', require('./auth/auth.routes'))

// Future modules — uncomment as they are built
// router.use('/turfs',    require('./turfs/turf.routes'))
// router.use('/slots',    require('./slots/slot.routes'))
// router.use('/bookings', require('./bookings/booking.routes'))
// router.use('/payments', require('./payments/payment.routes'))

module.exports = router
