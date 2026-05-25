'use strict'

const Joi = require('joi')
const { phone } = require('../../../../common/validators/shared.validator')

const registerSchema = Joi.object({
  name:  Joi.string().trim().min(2).max(50).required(),
  phone: phone.required(),
})

const loginSchema = Joi.object({
  phone: phone.required(),
})

const verifyOtpSchema = Joi.object({
  phone: phone.required(),
  otp:   Joi.string().length(4).pattern(/^\d+$/).required(),
})

const otpPreviewSchema = Joi.object({
  phone: phone.required(),
})

const firebaseAuthSchema = Joi.object({
  firebaseToken: Joi.string().required(),
})

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().optional(),
})

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  otpPreviewSchema,
  firebaseAuthSchema,
  refreshTokenSchema,
}
