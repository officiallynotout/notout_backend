'use strict'

const Joi      = require('joi')
const { page, limit } = require('../../../../common/validators/shared.validator')

const createMatchSchema = Joi.object({
  team1Name:     Joi.string().min(1).max(50).required(),
  team2Name:     Joi.string().min(1).max(50).required(),
  battingFirst:  Joi.string().valid('team1', 'team2').required(),
  totalOvers:    Joi.number().integer().min(1).max(50).required(),
  playersPerSide: Joi.number().integer().min(2).max(11).required(),
  trackExtras:   Joi.boolean().default(false),
})

const startMatchSchema = Joi.object({
  opener1: Joi.string().min(1).max(50).required(),
  opener2: Joi.string().min(1).max(50).required(),
  bowler:  Joi.string().min(1).max(50).required(),
})

const logBallSchema = Joi.object({
  batsmanName:          Joi.string().min(1).max(50).required(),
  bowlerName:           Joi.string().min(1).max(50).required(),
  runs:                 Joi.number().integer().min(0).max(6).default(0),
  isWide:               Joi.boolean().default(false),
  isNoBall:             Joi.boolean().default(false),
  isBye:                Joi.boolean().default(false),
  isLegBye:             Joi.boolean().default(false),
  isWicket:             Joi.boolean().default(false),
  dismissalType:        Joi.when('isWicket', {
    is:   true,
    then: Joi.string().valid('BOWLED', 'CAUGHT', 'RUN_OUT', 'LBW', 'STUMPED', 'HIT_WICKET', 'RETIRED_HURT').required(),
    otherwise: Joi.forbidden(),
  }),
  dismissedBatsmanName: Joi.when('isWicket', {
    is:   true,
    then: Joi.string().min(1).max(50).required(),
    otherwise: Joi.forbidden(),
  }),
})

const nextBatsmanSchema = Joi.object({
  playerName: Joi.string().min(1).max(50).required(),
  isOnStrike: Joi.boolean().required(),
})

const nextBowlerSchema = Joi.object({
  bowlerName: Joi.string().min(1).max(50).required(),
})

const startInnings2Schema = Joi.object({
  opener1: Joi.string().min(1).max(50).required(),
  opener2: Joi.string().min(1).max(50).required(),
  bowler:  Joi.string().min(1).max(50).required(),
})

const listMatchesSchema = Joi.object({ page, limit })

module.exports = {
  createMatchSchema,
  startMatchSchema,
  logBallSchema,
  nextBatsmanSchema,
  nextBowlerSchema,
  startInnings2Schema,
  listMatchesSchema,
}
