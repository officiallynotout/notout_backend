'use strict'

const router          = require('express').Router()
const controller      = require('./turf.controller')
const { validate }    = require('../../../../middleware/validate.middleware')
const authMiddleware  = require('../../../../middleware/auth.middleware')
const adminMiddleware = require('../../../../middleware/admin.middleware')
const { createTurfSchema, updateTurfSchema } = require('./turf.validator')

// Public routes
router.get('/',    controller.getAllTurfs)   // GET /turfs?city=Surat&isActive=true
router.get('/:id', controller.getTurfById)  // GET /turfs/:id

// Admin-only routes
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  validate(createTurfSchema),
  controller.createTurf
)

router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
  validate(updateTurfSchema),
  controller.updateTurf
)

router.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  controller.deleteTurf
)

module.exports = router
