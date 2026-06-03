'use strict'

const Joi                        = require('joi')
const { mongoId, page, limit }   = require('../../../../common/validators/shared.validator')

const getTurfsSchema = Joi.object({
  city:      Joi.string().optional(),
  isActive:  Joi.string().valid('true', 'false', 'all').optional(),
  latitude:  Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  page,
  limit,
})

const createTurfSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),

  description: Joi.string().trim().max(500).optional(),

  location: Joi.object({
    address: Joi.string().required(),
    city:    Joi.string().required(),
    pincode: Joi.string().pattern(/^\d{6}$/).optional(),
  }).required(),

  amenities: Joi.array().items(Joi.string()).optional(),

  pricePerHour: Joi.number().min(0).required(),

  operatingHours: Joi.object({
    open:  Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    close: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  }).optional(),
})

const updateTurfSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),

  description: Joi.string().trim().max(500).optional(),

  location: Joi.object({
    address: Joi.string().optional(),
    city:    Joi.string().optional(),
    pincode: Joi.string().pattern(/^\d{6}$/).optional(),
  }).optional(),

  amenities: Joi.array().items(Joi.string()).optional(),

  pricePerHour: Joi.number().min(0).optional(),

  operatingHours: Joi.object({
    open:  Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    close: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  }).optional(),

  isActive: Joi.boolean().optional(),
})

module.exports = { getTurfsSchema, createTurfSchema, updateTurfSchema }
