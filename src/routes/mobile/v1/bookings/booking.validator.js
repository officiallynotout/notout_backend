'use strict'

const Joi = require('joi')
const { date, time } = require('../../../../common/validators/shared.validator')

const createBookingSchema = Joi.object({
  turfName:  Joi.string().trim().min(2).max(80).required(),
  date:      date.required(),
  startTime: time.required(),
  endTime:   time.required(),
})

module.exports = { createBookingSchema }
