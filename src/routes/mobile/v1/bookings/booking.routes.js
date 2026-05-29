'use strict'

const router         = require('express').Router()
const controller     = require('./booking.controller')
const authMiddleware = require('../../../../middleware/auth.middleware')
const { validate }   = require('../../../../middleware/validate.middleware')
const { createBookingSchema } = require('./booking.validator')

router.post('/',    authMiddleware, validate(createBookingSchema), controller.createBooking)
router.get('/',     authMiddleware, controller.getMyBookings)
router.get('/:id',  authMiddleware, controller.getBookingById)
router.patch('/:id/cancel', authMiddleware, controller.cancelBooking)

module.exports = router
