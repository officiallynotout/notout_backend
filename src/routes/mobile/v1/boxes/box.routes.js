'use strict'

const router     = require('express').Router({ mergeParams: true })
const controller = require('./box.controller')

// GET /turfs/:turfId/boxes
router.get('/', controller.getBoxes)

module.exports = router
