'use strict'

const router = require('express').Router()
const controller = require('./booking.controller')
const authMiddleware = require('../../../../middleware/auth.middleware')
const { validate } = require('../../../../middleware/validate.middleware')
const { createBookingSchema } = require('./booking.validator')

router.post('/', authMiddleware, validate(createBookingSchema), controller.createBooking)

module.exports = router
