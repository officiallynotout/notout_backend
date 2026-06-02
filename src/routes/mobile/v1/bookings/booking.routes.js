'use strict'

const router          = require('express').Router()
const controller      = require('./booking.controller')
const adminMiddleware = require('../../../../middleware/admin.middleware')
const { validate }    = require('../../../../middleware/validate.middleware')
const { createBookingSchema, listBookingsSchema } = require('./booking.validator')

router.post('/',    validate(createBookingSchema),        controller.createBooking)
router.get('/',     validate(listBookingsSchema, 'query'), controller.getMyBookings)

// Admin-only routes — must be declared before /:id to avoid param conflict
router.get('/admin/all',   adminMiddleware, validate(listBookingsSchema, 'query'), controller.getAllBookings)
router.get('/admin/stats', adminMiddleware, controller.getAdminStats)

router.get('/:id',          controller.getBookingById)
router.patch('/:id/cancel', controller.cancelBooking)

module.exports = router
