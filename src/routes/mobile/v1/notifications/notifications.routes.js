'use strict'

const router     = require('express').Router()
const controller = require('./notifications.controller')
const { validate } = require('../../../../middleware/validate.middleware')
const { registerTokenSchema, removeTokenSchema } = require('./notifications.validator')

router.post('/register-token',   validate(registerTokenSchema), controller.registerToken)
router.delete('/register-token', validate(removeTokenSchema),   controller.removeToken)

module.exports = router
