'use strict'

const Joi = require('joi')

/**
 * Reusable Joi building blocks — import these everywhere, never redefine them.
 */

const mongoId = Joi.string()
  .min(1)
  .max(36)
  .messages({
    'string.min': 'Invalid ID',
    'string.max': 'Invalid ID',
  })

const phone = Joi.string()
  .pattern(/^[6-9]\d{9}$/)
  .messages({
    'string.pattern.base': 'Enter a valid 10-digit Indian mobile number',
  })

const date = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .messages({
    'string.pattern.base': 'Date must be in YYYY-MM-DD format',
  })

const time = Joi.string()
  .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
  .messages({
    'string.pattern.base': 'Time must be in HH:mm format',
  })

const password = Joi.string().min(6).max(50)

const page = Joi.number().integer().min(1).default(1)

const limit = Joi.number().integer().min(1).max(100).default(10)

module.exports = { mongoId, phone, date, time, password, page, limit }
