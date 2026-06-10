'use strict'

const Joi                        = require('joi')
const { mongoId, date, time }    = require('../../../../common/validators/shared.validator')

const getSlotSchema = Joi.object({
  boxId: mongoId.required(),
  date:  date.required(),
})

const lockSlotSchema = Joi.object({
  slotId: mongoId.required(),
})

const generateSlotsSchema = Joi.object({
  turfId:          mongoId.required(),
  date:            date.required(),
  startTime:       time.required(),
  endTime:         time.required(),
  durationMinutes: Joi.number().valid(30, 60, 90, 120).required(),
  price:           Joi.number().min(0).required(),
})

module.exports = { getSlotSchema, lockSlotSchema, generateSlotsSchema }
