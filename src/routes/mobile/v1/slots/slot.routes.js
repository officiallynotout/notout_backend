'use strict'

const router          = require('express').Router()
const controller      = require('./slot.controller')
const { validate }    = require('../../../../middleware/validate.middleware')
const adminMiddleware = require('../../../../middleware/admin.middleware')
const { getSlotSchema, lockSlotSchema, generateSlotsSchema } = require('./slot.validator')

router.get('/',              validate(getSlotSchema, 'query'), controller.getSlots)
router.post('/lock',         validate(lockSlotSchema),         controller.lockSlot)
router.delete('/lock/:slotId',                                 controller.releaseSlot)
router.post('/generate', adminMiddleware, validate(generateSlotsSchema), controller.generateSlots)

module.exports = router
