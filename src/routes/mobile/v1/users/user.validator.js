'use strict'

const Joi = require('joi')

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
})

const updateLocationSchema = Joi.object({
  latitude:  Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
})

module.exports = { updateProfileSchema, updateLocationSchema }
