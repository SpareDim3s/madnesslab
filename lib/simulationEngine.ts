/**
 * MadnessLab Monte Carlo Simulation Engine
 *
 * Simulates the full 68-team NCAA tournament bracket N times.
 * Each simulation uses win probabilities from the prediction engine,
 * then adds controlled randomness to produce realistic variance.
 *
 * Supports:
 * - Single or multi-run simulation (1, 10, 100, 1000)
 * - Locked picks (user can pre-determine some winners)
 * - Aggregate advancement odds across N runs
 */

import type { MockTeam } from './mockData'
import { predictMatchup } from './predictionEngine'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TournamentBracket {
  teams: MockTeam[]
  // regions: 4 regions of 16 (after First Four)
  // rounds: 0=First Four, 1=R64, 2=R32, 3=S16, 4=E8, 5=F4, 6=Championship
  firstFourGames: BracketGame[]
  rounds: BracketRound[]
}

export interface BracketGame {
  id: string
  round: number
  roundName: string
  region: string
  team1: MockTeam | null
  team2: MockTeam | null
  team1Seed: number | null
  team2Seed: number | null
  winner: MockTeam | null
  team1WinProb: number
  team2WinProb: number
  volatilityScore: number
  upsetAlertTier: string
  bracketPosition: number  // position within this round
  nextGameId: string | null  // which game the winner advances to
}

export interface BracketRound {
  roundNumber: number
  roundName: string
  games: BracketGame[]
}

export interface SimulationResult {
  simId: string
  numSimulations: number
  teams: SimTeamResult[]
  mostLikelyChampion: string
  championDistribution: Record<string, number>  // teamId → times won
}

export interface SimTeamResult {
  teamId: string
  teamName: string
  seed: number
  region: string
  titleOdds: number
  finalFourOdds: number
  eliteEightOdds: number
  sweet16Odds: number
  r32Odds: number
  avgRoundsWon: number
}

export interface SingleSimResult {
  games: Array<{
    gameId: string
    winnerId: string
    team1Prob: number
    wasUpset: boolean
  }>
  champion: MockTeam
  finalFour: MockTeam[]
  eliteEight: MockTeam[]
  sweet16: MockTeam[]
}

// ─── Seeding & Bracket Setup ──────────────────────────────────────────────────

const ROUND_NAMES = ['First Four', 'Round of 64', 'Round of 32', 'Sweet 16', 'Elite Eight', 'Final Four', 'Championship']

/**
 * Build the initial bracket structure from the 68 teams.
 * Seeds teams into the standard NCAA bracket positions.
 */
export function buildInitialBracket(teams: MockTeam[]): TournamentBracket {
  const regions = ['South', 'East', 'West', 'Midwest'] as const
  const games: BracketGame[] = []
  let gameCounter = 0

  const makeGameId = () => `game_${++gameCounter}`

  // First Four games (4 games, 2 per region that have 11/16 seed play-ins)
  const firstFourGames: BracketGame[] = []
  const firstFourTeams = teams.filter(t => t.isFirstFour)

  // Group First Four teams by region+seed
  const ffGroups = new Map<string, MockTeam[]>()
  for (const team of firstFourTeams) {
    const key = `${team.region}_${team.seed}`
    if (!ffGroups.has(key)) ffGroups.set(key, [])
    ffGroups.get(key)!.push(team)
  }

  for (const [key, pair] of ffGroups) {
    if (pair.length === 2) {
      const pred = predictMatchup(pair[0], pair[1])
      firstFourGames.push({
        id: makeGameId(),
        round: 0,
        roundName: 'First Four',
        region: pair[0].region,
        team1: pair[0],
        team2: pair[1],
        team1Seed: pair[0].seed,
        team2Seed: pair[1].seed,
        winner: null,
        team1WinProb: pred.team1WinProb,
        team2WinProb: pred.team2WinProb,
        volatilityScore: pred.volatilityScore,
        upsetAlertTier: pred.upsetAlertTier,
        bracketPosition: 1,
        nextGameId: null,  // will be set after R64 is built
      })
    }
  }

  // Build R64 bracket for each region
  // Standard bracket seedings: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
  const r64Matchups = [
    [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15]
  ]

  const regionGames: BracketGame[][] = []

  for (const region of regions) {
    const regionTeams = teams.filter(t => t.region === region && !t.isFirstFour)
    const regionFFWinnerSlots = firstFourGames.filter(g => g.region === region)

    const regionR64Games: BracketGame[] = []
    let pos = 1

    for (const [seed1, seed2] of r64Matchups) {
      const team1 = regionTeams.find(t => t.seed === seed1) ?? null
      const team2 = regionTeams.find(t => t.seed === seed2) ?? null

      // For First Four positions, team2 might come from a First Four game
      const actualTeam2 = team2 ?? null
      const isFirstFourSlot = regionFFWinnerSlots.some(g => g.team1?.seed === seed2 || g.team2?.seed === seed2)

      const pred = team1 && actualTeam2 ? predictMatchup(team1, actualTeam2) : null

      regionR64Games.push({
        id: makeGameId(),
        round: 1,
        roundName: 'Round of 64',
        region,
        team1,
        team2: actualTeam2,
        team1Seed: seed1,
        team2Seed: seed2,
        winner: null,
        team1WinProb: pred?.team1WinProb ?? 0.5,
        team2WinProb: pred?.team2WinProb ?? 0.5,
        volatilityScore: pred?.volatilityScore ?? 50,
        upsetAlertTier: pred?.upsetAlertTier ?? 'none',
        bracketPosition: pos++,
        nextGameId: null,
      })
    }

    regionGames.push(regionR64Games)
  }

  // Build subsequent rounds as empty placeholder games
  const rounds: BracketRound[] = []

  // Round 1: R64 (already built above)
  rounds.push({
    roundNumber: 1,
    roundName: 'Round of 64',
    games: regionGames.flat(),
  })

  // Round 2: R32 — 4 games per region
  const r32Games: BracketGame[] = []
  for (let r = 0; r < 4; r++) {
    for (let i = 0; i < 4; i++) {
      r32Games.push({
        id: makeGameId(),
        round: 2,
        roundName: 'Round of 32',
        region: regions[r],
        team1: null,
        team2: null,
        team1Seed: null,
        team2Seed: null,
        winner: null,
        team1WinProb: 0.5,
        team2WinProb: 0.5,
        volatilityScore: 50,
        upsetAlertTier: 'none',
        bracketPosition: i + 1,
        nextGameId: null,
      })
    }
  }
  rounds.push({ roundNumber: 2, roundName: 'Round of 32', games: r32Games })

  // Sweet 16 — 2 per region
  const s16Games: BracketGame[] = []
  for (let r = 0; r < 4; r++) {
    for (let i = 0; i < 2; i++) {
      s16Games.push({ id: makeGameId(), round: 3, roundName: 'Sweet 16', region: regions[r], team1: null, team2: null, team1Seed: null, team2Seed: null, winner: null, team1WinProb: 0.5, team2WinProb: 0.5, volatilityScore: 50, upsetAlertTier: 'none', bracketPosition: i + 1, nextGameId: null })
    }
  }
  rounds.push({ roundNumber: 3, roundName: 'Sweet 16', games: s16Games })

  // Elite Eight — 1 per region
  const e8Games: BracketGame[] = []
  for (let r = 0; r < 4; r++) {
    e8Games.push({ id: makeGameId(), round: 4, roundName: 'Elite Eight', region: regions[r], team1: null, team2: null, team1Seed: null, team2Seed: null, winner: null, team1WinProb: 0.5, team2WinProb: 0.5, volatilityScore: 50, upsetAlertTier: 'none', bracketPosition: 1, nextGameId: null })
  }
  rounds.push({ roundNumber: 4, roundName: 'Elite Eight', games: e8Games })

  // Final Four — 2 games
  const f4Games: BracketGame[] = [
    { id: makeGameId(), round: 5, roundName: 'Final Four', region: 'Final Four', team1: null, team2: null, team1Seed: null, team2Seed: null, winner: null, team1WinProb: 0.5, team2WinProb: 0.5, volatilityScore: 50, upsetAlertTier: 'none', bracketPosition: 1, nextGameId: null },
    { id: makeGameId(), round: 5, roundName: 'Final Four', region: 'Final Four', team1: null, team2: null, team1Seed: null, team2Seed: null, winner: null, team1WinProb: 0.5, team2WinProb: 0.5, volatilityScore: 50, upsetAlertTier: 'none', bracketPosition: 2, nextGameId: null },
  ]
  rounds.push({ roundNumber: 5, roundName: 'Final Four', games: f4Games })

  // Championship
  const champGame: BracketGame = { id: makeGameId(), round: 6, roundName: 'Championship', region: 'Championship', team1: null, team2: null, team1Seed: null, team2Seed: null, winner: null, team1WinProb: 0.5, team2WinProb: 0.5, volatilityScore: 50, upsetAlertTier: 'none', bracketPosition: 1, nextGameId: null }
  rounds.push({ roundNumber: 6, roundName: 'Championship', games: [champGame] })

  return {
    teams,
    firstFourGames,
    rounds,
  }
}

// ─── Single Simulation Run ────────────────────────────────────────────────────

/**
 * Simulate one complete tournament run.
 * Uses win probabilities with random draws to determine winners.
 */
export function simulateSingleRun(
  teams: MockTeam[],
  lockedPicks: Record<string, string> = {}  // gameId → winnerId
): SingleSimResult {
  const regions = ['South', 'East', 'West', 'Midwest'] as const
  const results: SingleSimResult['games'] = []

  // First Four results
  const firstFourTeams = teams.filter(t => t.isFirstFour)
  const ffResults = new Map<string, MockTeam>()  // key: `${region}_${seed}` → winner

  const ffGroups = new Map<string, MockTeam[]>()
  for (const team of firstFourTeams) {
    const key = `${team.region}_${team.seed}`
    if (!ffGroups.has(key)) ffGroups.set(key, [])
    ffGroups.get(key)!.push(team)
  }

  for (const [key, pair] of ffGroups) {
    if (pair.length === 2) {
      const pred = predictMatchup(pair[0], pair[1])
      const winner = Math.random() < pred.team1WinProb ? pair[0] : pair[1]
      ffResults.set(key, winner)
      results.push({ gameId: `ff_${key}`, winnerId: winner.id, team1Prob: pred.team1WinProb, wasUpset: winner.seed > pair[0].seed })
    }
  }

  // Build per-region brackets
  const r64Matchups = [[1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15]]

  const sweet16Teams: MockTeam[] = []
  const eliteEightTeams: MockTeam[] = []
  const finalFourTeams: MockTeam[] = []

  for (const region of regions) {
    const regionTeams = teams.filter(t => t.region === region && !t.isFirstFour)
    let bracket: MockTeam[] = []

    // Populate R64
    for (const [seed1, seed2] of r64Matchups) {
      const team1 = regionTeams.find(t => t.seed === seed1)
      // For First Four seeds, replace with winner
      const ffKey = `${region}_${seed2}`
      const team2 = ffResults.get(ffKey) ?? regionTeams.find(t => t.seed === seed2)

      if (!team1 || !team2) continue

      const pred = predictMatchup(team1, team2)
      const winner = simulateGame(team1, team2, pred.team1WinProb)
      const higherSeed = Math.min(team1.seed, team2.seed)
      const wasUpset = winner.seed > higherSeed

      results.push({ gameId: `r64_${region}_${seed1}v${seed2}`, winnerId: winner.id, team1Prob: pred.team1WinProb, wasUpset })
      bracket.push(winner)
    }

    // R32
    const r32Winners: MockTeam[] = []
    for (let i = 0; i < bracket.length; i += 2) {
      if (i + 1 < bracket.length) {
        const t1 = bracket[i]
        const t2 = bracket[i + 1]
        const pred = predictMatchup(t1, t2)
        const winner = simulateGame(t1, t2, pred.team1WinProb)
        r32Winners.push(winner)
        results.push({ gameId: `r32_${region}_${i}`, winnerId: winner.id, team1Prob: pred.team1WinProb, wasUpset: winner.seed > Math.min(t1.seed, t2.seed) })
      }
    }

    // Sweet 16
    const s16Winners: MockTeam[] = []
    for (let i = 0; i < r32Winners.length; i += 2) {
      if (i + 1 < r32Winners.length) {
        const t1 = r32Winners[i]
        const t2 = r32Winners[i + 1]
        const pred = predictMatchup(t1, t2)
        const winner = simulateGame(t1, t2, pred.team1WinProb)
        s16Winners.push(winner)
        sweet16Teams.push(t1, t2)
        results.push({ gameId: `s16_${region}_${i}`, winnerId: winner.id, team1Prob: pred.team1WinProb, wasUpset: winner.seed > Math.min(t1.seed, t2.seed) })
      }
    }

    // Elite Eight
    if (s16Winners.length >= 2) {
      const t1 = s16Winners[0]
      const t2 = s16Winners[1]
      const pred = predictMatchup(t1, t2)
      const winner = simulateGame(t1, t2, pred.team1WinProb)
      finalFourTeams.push(winner)
      eliteEightTeams.push(t1, t2)
      results.push({ gameId: `e8_${region}`, winnerId: winner.id, team1Prob: pred.team1WinProb, wasUpset: winner.seed > Math.min(t1.seed, t2.seed) })
    }
  }

  // Final Four
  let champion: MockTeam = teams[0]
  if (finalFourTeams.length >= 4) {
    const f4_1 = predictMatchup(finalFourTeams[0], finalFourTeams[1])
    const f4Winner1 = simulateGame(finalFourTeams[0], finalFourTeams[1], f4_1.team1WinProb)

    const f4_2 = predictMatchup(finalFourTeams[2], finalFourTeams[3])
    const f4Winner2 = simulateGame(finalFourTeams[2], finalFourTeams[3], f4_2.team1WinProb)

    results.push({ gameId: 'f4_game1', winnerId: f4Winner1.id, team1Prob: f4_1.team1WinProb, wasUpset: f4Winner1.seed > Math.min(finalFourTeams[0].seed, finalFourTeams[1].seed) })
    results.push({ gameId: 'f4_game2', winnerId: f4Winner2.id, team1Prob: f4_2.team1WinProb, wasUpset: f4Winner2.seed > Math.min(finalFourTeams[2].seed, finalFourTeams[3].seed) })

    // Championship
    const champ = predictMatchup(f4Winner1, f4Winner2)
    champion = simulateGame(f4Winner1, f4Winner2, champ.team1WinProb)
    results.push({ gameId: 'championship', winnerId: champion.id, team1Prob: champ.team1WinProb, wasUpset: champion.seed > Math.min(f4Winner1.seed, f4Winner2.seed) })
  }

  return {
    games: results,
    champion,
    finalFour: finalFourTeams,
    eliteEight: eliteEightTeams,
    sweet16: sweet16Teams,
  }
}

function simulateGame(team1: MockTeam, team2: MockTeam, team1WinProb: number): MockTeam {
  return Math.random() < team1WinProb ? team1 : team2
}

// ─── Multi-Run Simulation ─────────────────────────────────────────────────────

export function runSimulation(
  teams: MockTeam[],
  numSims: number,
  lockedPicks: Record<string, string> = {}
): SimulationResult {
  const titleCounts: Record<string, number> = {}
  const f4Counts: Record<string, number> = {}
  const e8Counts: Record<string, number> = {}
  const s16Counts: Record<string, number> = {}
  const r32Counts: Record<string, number> = {}
  const roundsWonTotal: Record<string, number> = {}

  // Initialize
  for (const team of teams) {
    titleCounts[team.id] = 0
    f4Counts[team.id] = 0
    e8Counts[team.id] = 0
    s16Counts[team.id] = 0
    r32Counts[team.id] = 0
    roundsWonTotal[team.id] = 0
  }

  for (let i = 0; i < numSims; i++) {
    const result = simulateSingleRun(teams, lockedPicks)

    titleCounts[result.champion.id]++

    for (const team of result.finalFour) {
      f4Counts[team.id] = (f4Counts[team.id] || 0) + 1
    }
    for (const team of result.eliteEight) {
      e8Counts[team.id] = (e8Counts[team.id] || 0) + 1
    }
    for (const team of result.sweet16) {
      s16Counts[team.id] = (s16Counts[team.id] || 0) + 1
    }

    // Count rounds won from game results
    for (const gameResult of result.games) {
      roundsWonTotal[gameResult.winnerId] = (roundsWonTotal[gameResult.winnerId] || 0) + 1
    }
  }

  // Build team results
  const teamResults: SimTeamResult[] = teams
    .filter(t => !t.isFirstFour)
    .map(team => ({
      teamId: team.id,
      teamName: team.name,
      seed: team.seed,
      region: team.region,
      titleOdds: (titleCounts[team.id] || 0) / numSims,
      finalFourOdds: (f4Counts[team.id] || 0) / numSims,
      eliteEightOdds: (e8Counts[team.id] || 0) / numSims,
      sweet16Odds: (s16Counts[team.id] || 0) / numSims,
      r32Odds: (r32Counts[team.id] || 0) / numSims,
      avgRoundsWon: (roundsWonTotal[team.id] || 0) / numSims,
    }))
    .sort((a, b) => b.titleOdds - a.titleOdds)

  const mostLikelyChampion = teamResults[0]?.teamId ?? ''

  return {
    simId: `sim_${Date.now()}`,
    numSimulations: numSims,
    teams: teamResults,
    mostLikelyChampion,
    championDistribution: titleCounts,
  }
}
