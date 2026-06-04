'use strict'

const Joi = require('joi')

const registerTokenSchema = Joi.object({
  token: Joi.string().pattern(/^ExponentPushToken\[.+\]$/).required().messages({
    'string.pattern.base': 'token must be a valid Expo push token',
  }),
})

const removeTokenSchema = Joi.object({})

module.exports = { registerTokenSchema, removeTokenSchema }
