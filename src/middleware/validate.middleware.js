'use strict'

const ApiError = require('../utils/ApiError')
const MESSAGES = require('../common/constants/messages.constant')

/**
 * Returns Express middleware that validates req[source] against a Joi schema.
 *
 * @param {import('joi').Schema} schema - Joi schema to validate against
 * @param {'body'|'query'|'params'} source - which request property to validate
 * @returns {Function} Express middleware
 *
 * Usage:
 *   validate(schema)           → validates req.body   (default)
 *   validate(schema, 'query')  → validates req.query
 *   validate(schema, 'params') → validates req.params
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly:    false,
    stripUnknown:  true,
  })

  if (error) {
    const errors = error.details.map((d) => ({
      field:   d.path[0],
      message: d.message,
    }))
    return next(new ApiError(400, MESSAGES.COMMON.VALIDATION_ERROR, errors))
  }

  if (source !== 'query') {
    req[source] = value
  }
  return next()
}

module.exports = { validate }
