'use strict'

const router         = require('express').Router()
const controller     = require('./user.controller')
const authMiddleware = require('../../../../middleware/auth.middleware')
const { validate }   = require('../../../../middleware/validate.middleware')
const { updateProfileSchema } = require('./user.validator')

router.get('/me',   authMiddleware, controller.getProfile)
router.patch('/me', authMiddleware, validate(updateProfileSchema), controller.updateProfile)

module.exports = router
