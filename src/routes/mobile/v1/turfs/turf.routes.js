'use strict'

const router          = require('express').Router()
const controller      = require('./turf.controller')
const { validate }    = require('../../../../middleware/validate.middleware')
const adminMiddleware = require('../../../../middleware/admin.middleware')
const { getTurfsSchema, createTurfSchema, updateTurfSchema } = require('./turf.validator')
const boxRoutes       = require('../boxes/box.routes')

router.get('/',    validate(getTurfsSchema, 'query'), controller.getAllTurfs)
router.get('/:id', controller.getTurfById)

router.post('/',   adminMiddleware, validate(createTurfSchema), controller.createTurf)
router.put('/:id', adminMiddleware, validate(updateTurfSchema), controller.updateTurf)
router.delete('/:id', adminMiddleware, controller.deleteTurf)

// Nested: GET /turfs/:turfId/boxes
router.use('/:turfId/boxes', boxRoutes)

module.exports = router
