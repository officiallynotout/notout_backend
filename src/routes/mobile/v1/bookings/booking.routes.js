'use strict'

const router          = require('express').Router()
const controller      = require('./booking.controller')
const authMiddleware  = require('../../../../middleware/auth.middleware')
const adminMiddleware = require('../../../../middleware/admin.middleware')
const { validate }    = require('../../../../middleware/validate.middleware')
const { createBookingSchema } = require('./booking.validator')

router.post('/',    authMiddleware, validate(createBookingSchema), controller.createBooking)
router.get('/',     authMiddleware, controller.getMyBookings)

// Admin-only routes — must be declared before /:id to avoid param conflict
router.get('/admin/all',   authMiddleware, adminMiddleware, controller.getAllBookings)
router.get('/admin/stats', authMiddleware, adminMiddleware, controller.getAdminStats)

router.get('/:id',  authMiddleware, controller.getBookingById)
router.patch('/:id/cancel', authMiddleware, controller.cancelBooking)

module.exports = router
