'use strict'

const router      = require('express').Router()
const controller  = require('./cricket.controller')
const { validate } = require('../../../../middleware/validate.middleware')
const { cricketLimiter } = require('../../../../middleware/rateLimiter.middleware')
const {
  createMatchSchema,
  startMatchSchema,
  logBallSchema,
  nextBatsmanSchema,
  nextBowlerSchema,
  startInnings2Schema,
  listMatchesSchema,
} = require('./cricket.validator')

// Match management
router.post('/',            validate(createMatchSchema),              controller.createMatch)
router.get('/',             validate(listMatchesSchema, 'query'),     controller.listMatches)
router.get('/code/:code',                                             controller.getMatchByCode)
router.get('/:id',                                                    controller.getMatch)

// Match lifecycle
router.post('/:id/start',         validate(startMatchSchema),         controller.startMatch)
router.post('/:id/start-innings2', validate(startInnings2Schema),     controller.startInnings2)
router.post('/:id/complete',                                          controller.completeMatch)

// Per-ball scoring (higher rate limit applied)
router.post('/:id/ball',          cricketLimiter, validate(logBallSchema),       controller.logBall)
router.post('/:id/next-batsman',  cricketLimiter, validate(nextBatsmanSchema),   controller.setNextBatsman)
router.post('/:id/next-bowler',   cricketLimiter, validate(nextBowlerSchema),    controller.setNextBowler)

module.exports = router
