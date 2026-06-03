'use strict'

const router       = require('express').Router()
const controller   = require('./user.controller')
const { validate } = require('../../../../middleware/validate.middleware')
const { updateProfileSchema, updateLocationSchema } = require('./user.validator')

router.get('/me',       controller.getProfile)
router.patch('/me',     validate(updateProfileSchema), controller.updateProfile)
router.patch('/location', validate(updateLocationSchema), controller.updateLocation)

module.exports = router
