'use strict'

const Joi = require('joi')

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
})

module.exports = { updateProfileSchema }
