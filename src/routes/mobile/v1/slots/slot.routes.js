'use strict'

const router          = require('express').Router()
const controller      = require('./slot.controller')
const { validate }    = require('../../../../middleware/validate.middleware')
const authMiddleware  = require('../../../../middleware/auth.middleware')
const adminMiddleware = require('../../../../middleware/admin.middleware')
const { getSlotSchema, lockSlotSchema, generateSlotsSchema } = require('./slot.validator')

// Public — query-validated slot listing
router.get('/', validate(getSlotSchema, 'query'), controller.getSlots)

// Auth required — lock / release
router.post('/lock',          authMiddleware, validate(lockSlotSchema), controller.lockSlot)
router.delete('/lock/:slotId', authMiddleware, controller.releaseSlot)

// Admin only — bulk generate
router.post(
  '/generate',
  authMiddleware,
  adminMiddleware,
  validate(generateSlotsSchema),
  controller.generateSlots
)

module.exports = router
