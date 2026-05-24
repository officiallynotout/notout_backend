'use strict'

const Joi = require('joi')
// Import shared Joi primitives — NEVER redefine these
const { phone, password } = require('../../../../common/validators/shared.validator')

const registerSchema = Joi.object({
  name:     Joi.string().trim().min(2).max(50).required(),
  phone:    phone.required(),
  password: password.required(),
})

const loginSchema = Joi.object({
  phone:    phone.required(),
  password: Joi.string().required(),
})

const verifyOtpSchema = Joi.object({
  phone: phone.required(),
  otp:   Joi.string().length(4).pattern(/^\d+$/).required(),
})

const firebaseAuthSchema = Joi.object({
  firebaseToken: Joi.string().required(),
})

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
})

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  firebaseAuthSchema,
  refreshTokenSchema,
}
