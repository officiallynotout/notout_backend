'use strict'

const crypto              = require('crypto')
const prisma              = require('../config/prisma')
const ApiError            = require('../utils/ApiError')
const MESSAGES            = require('../common/constants/messages.constant')
const { emitMatchUpdate } = require('../socket')
const { parsePagination, paginationMeta } = require('../common/helpers/pagination.helper')
const redisCache          = require('../config/redis')

// ── Helpers ───────────────────────────────────────────────────────────────────

const _generateShareCode = async () => {
  let code, exists
  do {
    code   = crypto.randomBytes(3).toString('hex').toUpperCase()
    exists = await prisma.cricketMatch.findUnique({ where: { shareCode: code } })
  } while (exists)
  return code
}

const _oversDisplay = (totalBalls) => {
  const overs = Math.floor(totalBalls / 6)
  const balls = totalBalls % 6
  return `${overs}.${balls}`
}

const _formatBatsman = (b) => ({
  id:           b.id,
  playerName:   b.playerName,
  runs:         b.runs,
  balls:        b.balls,
  fours:        b.fours,
  sixes:        b.sixes,
  strikeRate:   b.balls > 0 ? parseFloat(((b.runs / b.balls) * 100).toFixed(1)) : 0,
  isOut:        b.isOut,
  dismissalType: b.dismissalType ?? null,
  battingOrder: b.battingOrder,
})

const _formatBowler = (b) => ({
  id:        b.id,
  playerName: b.playerName,
  overs:     _oversDisplay(b.balls),
  runs:      b.runs,
  wickets:   b.wickets,
  maidens:   b.maidens,
  wides:     b.wides,
  noBalls:   b.noBalls,
  economy:   b.balls > 0 ? parseFloat(((b.runs / (b.balls / 6))).toFixed(1)) : 0,
})

const _formatInnings = (innings, batsmen, bowlers, recentBalls) => ({
  id:           innings.id,
  inningsNumber: innings.inningsNumber,
  battingTeam:  innings.battingTeam,
  totalRuns:    innings.totalRuns,
  totalWickets: innings.totalWickets,
  overs:        _oversDisplay(innings.totalBalls),
  runRate:      innings.totalBalls > 0
    ? parseFloat(((innings.totalRuns / (innings.totalBalls / 6))).toFixed(2))
    : 0,
  extras: {
    wides:   innings.extrasWides,
    noBalls: innings.extrasNoBalls,
    byes:    innings.extrasByes,
    legByes: innings.extrasLegByes,
    total:   innings.extrasWides + innings.extrasNoBalls + innings.extrasByes + innings.extrasLegByes,
  },
  status:                 innings.status,
  currentOverNumber:      innings.currentOverNumber,
  currentLegalBallsInOver: innings.currentLegalBallsInOver,
  currentBowlerName:      innings.currentBowlerName,
  currentStrikeBatsman:   innings.currentStrikeBatsman,
  currentNonStrikeBatsman: innings.currentNonStrikeBatsman,
  batsmen:    batsmen.map(_formatBatsman),
  bowlers:    bowlers.map(_formatBowler),
  recentBalls: recentBalls ?? [],
})

const _buildMatchPayload = async (match) => {
  const inningsList = await prisma.cricketInnings.findMany({
    where:   { matchId: match.id },
    orderBy: { inningsNumber: 'asc' },
  })

  const formatted = await Promise.all(inningsList.map(async (innings) => {
    const [batsmen, bowlers, recentBalls] = await Promise.all([
      prisma.cricketBatsmanScore.findMany({ where: { inningsId: innings.id }, orderBy: { battingOrder: 'asc' } }),
      prisma.cricketBowlerScore.findMany({ where: { inningsId: innings.id } }),
      prisma.cricketBall.findMany({
        where:   { inningsId: innings.id },
        orderBy: { createdAt: 'desc' },
        take:    6,
      }),
    ])
    return _formatInnings(innings, batsmen, bowlers, recentBalls.reverse())
  }))

  return {
    matchId:       match.id,
    shareCode:     match.shareCode,
    team1Name:     match.team1Name,
    team2Name:     match.team2Name,
    battingFirst:  match.battingFirst,
    totalOvers:    match.totalOvers,
    playersPerSide: match.playersPerSide,
    trackExtras:   match.trackExtras,
    status:        match.status,
    result:        match.result ?? null,
    createdAt:     match.createdAt,
    innings:       formatted,
  }
}

// ── Service functions ─────────────────────────────────────────────────────────

const createMatch = async (userId, { team1Name, team2Name, battingFirst, totalOvers, playersPerSide, trackExtras }) => {
  const shareCode = await _generateShareCode()

  const match = await prisma.cricketMatch.create({
    data: {
      userId,
      shareCode,
      team1Name,
      team2Name,
      battingFirst,
      totalOvers,
      playersPerSide,
      trackExtras: trackExtras ?? false,
    },
  })

  return {
    matchId:   match.id,
    shareCode: match.shareCode,
    message:   MESSAGES.CRICKET.SHARE_CODE_LABEL,
    status:    match.status,
  }
}

const listMatches = async (userId, query) => {
  const { page, limit, skip, take } = parsePagination(query)

  const [matches, total] = await Promise.all([
    prisma.cricketMatch.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        innings: {
          select: {
            inningsNumber: true,
            battingTeam:   true,
            totalRuns:     true,
            totalWickets:  true,
            totalBalls:    true,
            status:        true,
          },
        },
      },
    }),
    prisma.cricketMatch.count({ where: { userId } }),
  ])

  const data = matches.map((m) => ({
    matchId:    m.id,
    shareCode:  m.shareCode,
    team1Name:  m.team1Name,
    team2Name:  m.team2Name,
    status:     m.status,
    result:     m.result ?? null,
    totalOvers: m.totalOvers,
    createdAt:  m.createdAt,
    innings:    m.innings.map((i) => ({
      inningsNumber: i.inningsNumber,
      battingTeam:   i.battingTeam,
      totalRuns:     i.totalRuns,
      totalWickets:  i.totalWickets,
      overs:         _oversDisplay(i.totalBalls),
      status:        i.status,
    })),
  }))

  return { data, pagination: paginationMeta(total, page, limit) }
}

const getMatch = async (matchId, userId) => {
  const match = await prisma.cricketMatch.findUnique({ where: { id: matchId } })
  if (!match) throw new ApiError(404, MESSAGES.CRICKET.MATCH_NOT_FOUND)
  if (match.userId !== userId) throw new ApiError(403, MESSAGES.CRICKET.MATCH_FORBIDDEN)

  const cached = await redisCache.getMatch(matchId)
  if (cached) return cached

  const payload = await _buildMatchPayload(match)
  await redisCache.setMatch(matchId, payload)
  return payload
}

const getMatchByCode = async (shareCode) => {
  const match = await prisma.cricketMatch.findUnique({
    where:  { shareCode: shareCode.toUpperCase() },
    select: { id: true },
  })
  if (!match) throw new ApiError(404, MESSAGES.CRICKET.INVALID_CODE)

  const cached = await redisCache.getMatch(match.id)
  if (cached) return cached

  const full    = await prisma.cricketMatch.findUnique({ where: { id: match.id } })
  const payload = await _buildMatchPayload(full)
  await redisCache.setMatch(match.id, payload)
  return payload
}

const startMatch = async (matchId, userId, { opener1, opener2, bowler }) => {
  const match = await prisma.cricketMatch.findFirst({ where: { id: matchId, userId } })
  if (!match)                       throw new ApiError(404, MESSAGES.CRICKET.MATCH_NOT_FOUND)
  if (match.status !== 'SETUP')     throw new ApiError(400, MESSAGES.CRICKET.MATCH_WRONG_STATUS)

  const innings = await prisma.cricketInnings.create({
    data: {
      matchId,
      inningsNumber:          1,
      battingTeam:            match.battingFirst,
      currentBowlerName:      bowler,
      currentStrikeBatsman:   opener1,
      currentNonStrikeBatsman: opener2,
    },
  })

  await Promise.all([
    prisma.cricketBatsmanScore.create({ data: { inningsId: innings.id, playerName: opener1, battingOrder: 1 } }),
    prisma.cricketBatsmanScore.create({ data: { inningsId: innings.id, playerName: opener2, battingOrder: 2 } }),
    prisma.cricketBowlerScore.create({ data: { inningsId: innings.id, playerName: bowler } }),
    prisma.cricketMatch.update({ where: { id: matchId }, data: { status: 'IN_PROGRESS' } }),
  ])

  const payload = await _buildMatchPayload({ ...match, status: 'IN_PROGRESS' })
  await redisCache.setMatch(matchId, payload)
  emitMatchUpdate(matchId, payload)
  return payload
}

const logBall = async (matchId, userId, ballData) => {
  const {
    batsmanName, bowlerName,
    runs = 0,
    isWide = false, isNoBall = false, isBye = false, isLegBye = false,
    isWicket = false, dismissalType = null, dismissedBatsmanName = null,
  } = ballData

  const match = await prisma.cricketMatch.findFirst({ where: { id: matchId, userId } })
  if (!match)                           throw new ApiError(404, MESSAGES.CRICKET.MATCH_NOT_FOUND)
  if (match.status !== 'IN_PROGRESS')   throw new ApiError(400, MESSAGES.CRICKET.MATCH_WRONG_STATUS)

  const innings = await prisma.cricketInnings.findFirst({
    where:   { matchId, status: 'IN_PROGRESS' },
    orderBy: { inningsNumber: 'desc' },
  })
  if (!innings) throw new ApiError(404, MESSAGES.CRICKET.INNINGS_NOT_FOUND)

  // Guard: over must not already be complete
  if (innings.currentLegalBallsInOver >= 6) {
    throw new ApiError(400, MESSAGES.CRICKET.OVER_ALREADY_DONE)
  }

  const isLegal    = !isWide && !isNoBall
  const totalRuns  = runs + (isWide ? 1 : 0) + (isNoBall ? 1 : 0) + (isBye ? runs : 0) + (isLegBye ? runs : 0)
  const batRuns    = (isBye || isLegBye) ? 0 : runs

  // Persist ball record
  const ball = await prisma.cricketBall.create({
    data: {
      inningsId:           innings.id,
      overNumber:          innings.currentOverNumber,
      ballNumber:          innings.currentLegalBallsInOver + 1,
      batsmanName,
      bowlerName,
      runs:                batRuns,
      isWide,
      isNoBall,
      isBye,
      isLegBye,
      isWicket,
      dismissalType:       isWicket ? dismissalType : null,
      dismissedBatsmanName: isWicket ? dismissedBatsmanName : null,
      totalRuns,
    },
  })

  // Update batsman stats
  const batsmanRecord = await prisma.cricketBatsmanScore.findFirst({
    where: { inningsId: innings.id, playerName: batsmanName, isOut: false },
  })
  if (!batsmanRecord) throw new ApiError(404, MESSAGES.CRICKET.BATSMAN_NOT_FOUND)

  await prisma.cricketBatsmanScore.update({
    where: { id: batsmanRecord.id },
    data: {
      runs:  { increment: batRuns },
      balls: isLegal ? { increment: 1 } : undefined,
      fours: batRuns === 4 ? { increment: 1 } : undefined,
      sixes: batRuns === 6 ? { increment: 1 } : undefined,
    },
  })

  // Mark batsman out if wicket
  if (isWicket && dismissedBatsmanName) {
    const outBatsman = await prisma.cricketBatsmanScore.findFirst({
      where: { inningsId: innings.id, playerName: dismissedBatsmanName, isOut: false },
    })
    if (outBatsman) {
      await prisma.cricketBatsmanScore.update({
        where: { id: outBatsman.id },
        data:  { isOut: true, dismissalType },
      })
    }
  }

  // Update bowler stats
  let bowlerRecord = await prisma.cricketBowlerScore.findFirst({
    where: { inningsId: innings.id, playerName: bowlerName },
  })
  if (!bowlerRecord) {
    bowlerRecord = await prisma.cricketBowlerScore.create({
      data: { inningsId: innings.id, playerName: bowlerName },
    })
  }

  await prisma.cricketBowlerScore.update({
    where: { id: bowlerRecord.id },
    data: {
      runs:    { increment: totalRuns },
      balls:   isLegal ? { increment: 1 } : undefined,
      wickets: isWicket ? { increment: 1 } : undefined,
      wides:   isWide   ? { increment: 1 } : undefined,
      noBalls: isNoBall  ? { increment: 1 } : undefined,
    },
  })

  // Update innings totals and state
  const newLegalBalls = innings.currentLegalBallsInOver + (isLegal ? 1 : 0)
  const overComplete  = newLegalBalls >= 6

  // Strike rotation: odd runs on a legal ball XOR end of over (they cancel each other out)
  const isOddRuns = isLegal && !isWicket && (runs % 2 === 1)
  const netRotate = isOddRuns !== overComplete

  const inningsUpdate = {
    totalRuns:    { increment: totalRuns },
    totalBalls:   isLegal ? { increment: 1 } : undefined,
    totalWickets: isWicket ? { increment: 1 } : undefined,
    extrasWides:  isWide   ? { increment: 1 } : undefined,
    extrasNoBalls: isNoBall ? { increment: 1 } : undefined,
    extrasByes:   isBye    ? { increment: runs } : undefined,
    extrasLegByes: isLegBye ? { increment: runs } : undefined,
    currentLegalBallsInOver: overComplete ? 0 : { increment: isLegal ? 1 : 0 },
    currentOverNumber: overComplete ? { increment: 1 } : undefined,
    currentStrikeBatsman:    netRotate ? innings.currentNonStrikeBatsman : undefined,
    currentNonStrikeBatsman: netRotate ? innings.currentStrikeBatsman    : undefined,
  }

  // Check innings end: all out (playersPerSide - 1 wickets) or overs done
  const newWickets  = innings.totalWickets + (isWicket ? 1 : 0)
  const newTotalBalls = innings.totalBalls + (isLegal ? 1 : 0)
  const allOut      = newWickets >= match.playersPerSide - 1
  const oversDone   = newTotalBalls >= match.totalOvers * 6

  if (allOut || oversDone) {
    inningsUpdate.status = 'COMPLETED'
  }

  const updatedInnings = await prisma.cricketInnings.update({
    where: { id: innings.id },
    data:  inningsUpdate,
  })

  // If innings completed, update match status
  if (updatedInnings.status === 'COMPLETED') {
    if (innings.inningsNumber === 1) {
      await prisma.cricketMatch.update({ where: { id: matchId }, data: { status: 'INNINGS_BREAK' } })
    }
  }

  const updatedMatch = await prisma.cricketMatch.findUnique({ where: { id: matchId } })
  const payload = await _buildMatchPayload(updatedMatch)
  await redisCache.setMatch(matchId, payload)
  emitMatchUpdate(matchId, payload)
  return payload
}

const setNextBatsman = async (matchId, userId, { playerName, isOnStrike }) => {
  const match = await prisma.cricketMatch.findFirst({ where: { id: matchId, userId } })
  if (!match)                         throw new ApiError(404, MESSAGES.CRICKET.MATCH_NOT_FOUND)
  if (match.status !== 'IN_PROGRESS') throw new ApiError(400, MESSAGES.CRICKET.MATCH_WRONG_STATUS)

  const innings = await prisma.cricketInnings.findFirst({
    where:   { matchId, status: 'IN_PROGRESS' },
    orderBy: { inningsNumber: 'desc' },
  })
  if (!innings) throw new ApiError(404, MESSAGES.CRICKET.INNINGS_NOT_FOUND)

  const battingOrder = await prisma.cricketBatsmanScore.count({ where: { inningsId: innings.id } })

  await prisma.cricketBatsmanScore.create({
    data: { inningsId: innings.id, playerName, battingOrder: battingOrder + 1 },
  })

  await prisma.cricketInnings.update({
    where: { id: innings.id },
    data: isOnStrike
      ? { currentStrikeBatsman: playerName }
      : { currentNonStrikeBatsman: playerName },
  })

  const payload = await _buildMatchPayload(match)
  await redisCache.setMatch(matchId, payload)
  emitMatchUpdate(matchId, payload)
  return payload
}

const setNextBowler = async (matchId, userId, { bowlerName }) => {
  const match = await prisma.cricketMatch.findFirst({ where: { id: matchId, userId } })
  if (!match)                         throw new ApiError(404, MESSAGES.CRICKET.MATCH_NOT_FOUND)
  if (match.status !== 'IN_PROGRESS') throw new ApiError(400, MESSAGES.CRICKET.MATCH_WRONG_STATUS)

  const innings = await prisma.cricketInnings.findFirst({
    where:   { matchId, status: 'IN_PROGRESS' },
    orderBy: { inningsNumber: 'desc' },
  })
  if (!innings) throw new ApiError(404, MESSAGES.CRICKET.INNINGS_NOT_FOUND)

  // Create bowler record if not seen before in this innings
  const existing = await prisma.cricketBowlerScore.findFirst({
    where: { inningsId: innings.id, playerName: bowlerName },
  })
  if (!existing) {
    await prisma.cricketBowlerScore.create({ data: { inningsId: innings.id, playerName: bowlerName } })
  }

  await prisma.cricketInnings.update({
    where: { id: innings.id },
    data:  { currentBowlerName: bowlerName },
  })

  const payload = await _buildMatchPayload(match)
  await redisCache.setMatch(matchId, payload)
  emitMatchUpdate(matchId, payload)
  return payload
}

const startInnings2 = async (matchId, userId, { opener1, opener2, bowler }) => {
  const match = await prisma.cricketMatch.findFirst({ where: { id: matchId, userId } })
  if (!match)                           throw new ApiError(404, MESSAGES.CRICKET.MATCH_NOT_FOUND)
  if (match.status !== 'INNINGS_BREAK') throw new ApiError(400, MESSAGES.CRICKET.MATCH_WRONG_STATUS)

  const innings1 = await prisma.cricketInnings.findFirst({ where: { matchId, inningsNumber: 1 } })
  const target   = (innings1?.totalRuns ?? 0) + 1

  const battingTeam = match.battingFirst === 'team1' ? 'team2' : 'team1'

  const innings = await prisma.cricketInnings.create({
    data: {
      matchId,
      inningsNumber:          2,
      battingTeam,
      currentBowlerName:      bowler,
      currentStrikeBatsman:   opener1,
      currentNonStrikeBatsman: opener2,
    },
  })

  await Promise.all([
    prisma.cricketBatsmanScore.create({ data: { inningsId: innings.id, playerName: opener1, battingOrder: 1 } }),
    prisma.cricketBatsmanScore.create({ data: { inningsId: innings.id, playerName: opener2, battingOrder: 2 } }),
    prisma.cricketBowlerScore.create({ data: { inningsId: innings.id, playerName: bowler } }),
    prisma.cricketMatch.update({ where: { id: matchId }, data: { status: 'IN_PROGRESS' } }),
  ])

  const updatedMatch = await prisma.cricketMatch.findUnique({ where: { id: matchId } })
  const payload      = await _buildMatchPayload(updatedMatch)
  await redisCache.setMatch(matchId, { ...payload, target })
  emitMatchUpdate(matchId, { ...payload, target })
  return { ...payload, target }
}

const completeMatch = async (matchId, userId) => {
  const match = await prisma.cricketMatch.findFirst({ where: { id: matchId, userId } })
  if (!match) throw new ApiError(404, MESSAGES.CRICKET.MATCH_NOT_FOUND)

  if (match.status === 'COMPLETED') return _buildMatchPayload(match)

  const [innings1, innings2] = await Promise.all([
    prisma.cricketInnings.findFirst({ where: { matchId, inningsNumber: 1 } }),
    prisma.cricketInnings.findFirst({ where: { matchId, inningsNumber: 2 } }),
  ])

  let result = 'Match ended'

  if (innings1 && innings2) {
    const team1 = match.battingFirst === 'team1' ? match.team1Name : match.team2Name
    const team2 = match.battingFirst === 'team1' ? match.team2Name : match.team1Name
    const score1 = innings1.totalRuns
    const score2 = innings2.totalRuns

    if (score2 > score1) {
      const wicketsLeft = (match.playersPerSide - 1) - innings2.totalWickets
      result = `${team2} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`
    } else if (score1 > score2) {
      result = `${team1} won by ${score1 - score2} run${(score1 - score2) !== 1 ? 's' : ''}`
    } else {
      result = 'Match tied'
    }
  }

  await prisma.cricketMatch.update({
    where: { id: matchId },
    data:  { status: 'COMPLETED', result },
  })

  // Mark any in-progress innings as completed
  await prisma.cricketInnings.updateMany({
    where: { matchId, status: 'IN_PROGRESS' },
    data:  { status: 'COMPLETED' },
  })

  const updatedMatch = await prisma.cricketMatch.findUnique({ where: { id: matchId } })
  const payload      = await _buildMatchPayload(updatedMatch)
  await redisCache.setMatch(matchId, payload)
  emitMatchUpdate(matchId, payload)
  return payload
}

module.exports = {
  createMatch,
  listMatches,
  getMatch,
  getMatchByCode,
  startMatch,
  logBall,
  setNextBatsman,
  setNextBowler,
  startInnings2,
  completeMatch,
}
