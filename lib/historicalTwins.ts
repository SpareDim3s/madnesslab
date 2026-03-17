/**
 * MadnessLab — Bracket Twins Feature
 *
 * Finds the most statistically similar teams within the 2026 tournament field
 * for any given team, using weighted Euclidean distance on reliable stats.
 *
 * Reliable features used: seed, adjOE, adjDE, adjEM, efgPct, threePointRate
 * (tempo / turnoverRate / offReboundRate are excluded — they defaulted to league
 *  averages during the Barttorvik fetch and carry no per-team signal)
 */

import type { MockTeam } from './mockData'

export interface BracketTwinMatch {
  team: MockTeam
  similarityScore: number  // 0–100, higher = more similar
  distance: number
  explanation: string
}

// ─── Feature normalization bounds ─────────────────────────────────────────────

const BOUNDS = {
  seed:           { min: 1,    max: 16 },
  adjOE:          { min: 98,   max: 132 },
  adjDE:          { min: 82,   max: 118 },
  adjEM:          { min: -14,  max: 40 },
  efgPct:         { min: 0.42, max: 0.60 },
  threePointRate: { min: 0.24, max: 0.52 },
}

// Feature weights
const WEIGHTS = {
  adjEM:          0.35,
  seed:           0.25,
  adjDE:          0.18,
  adjOE:          0.12,
  efgPct:         0.06,
  threePointRate: 0.04,
}

function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

type FeatureVec = Record<keyof typeof WEIGHTS, number>

function buildFeatureVector(team: MockTeam): FeatureVec {
  return {
    adjEM:          normalize(team.stats.adjEM,          BOUNDS.adjEM.min,          BOUNDS.adjEM.max),
    seed:           normalize(team.seed,                 BOUNDS.seed.min,           BOUNDS.seed.max),
    adjDE:          normalize(team.stats.adjDE,          BOUNDS.adjDE.min,          BOUNDS.adjDE.max),
    adjOE:          normalize(team.stats.adjOE,          BOUNDS.adjOE.min,          BOUNDS.adjOE.max),
    efgPct:         normalize(team.stats.efgPct,         BOUNDS.efgPct.min,         BOUNDS.efgPct.max),
    threePointRate: normalize(team.stats.threePointRate, BOUNDS.threePointRate.min, BOUNDS.threePointRate.max),
  }
}

function weightedEuclideanDistance(a: FeatureVec, b: FeatureVec): number {
  let sum = 0
  for (const key of Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>) {
    const diff = a[key] - b[key]
    sum += WEIGHTS[key] * diff * diff
  }
  return Math.sqrt(sum)
}

function distanceToSimilarity(distance: number): number {
  // Max theoretical weighted distance ≈ 1.0 — clamp and invert
  return Math.max(0, Math.round((1 - Math.min(distance, 1.0)) * 100))
}

function buildExplanation(team: MockTeam, other: MockTeam): string {
  const parts: string[] = []

  if (Math.abs(team.seed - other.seed) <= 1) {
    parts.push(`both seeded ${other.seed}`)
  } else if (Math.abs(team.seed - other.seed) <= 3) {
    parts.push(`similar seedings (${team.seed} vs ${other.seed})`)
  }

  const emDiff = Math.abs(team.stats.adjEM - other.stats.adjEM)
  if (emDiff < 2) {
    parts.push(`nearly identical efficiency margin (${other.stats.adjEM.toFixed(1)})`)
  } else if (emDiff < 5) {
    parts.push(`close efficiency margin (${other.stats.adjEM.toFixed(1)} vs ${team.stats.adjEM.toFixed(1)})`)
  }

  if (team.stats.adjDE < 94 && other.stats.adjDE < 94) {
    parts.push('both anchored by elite defense')
  }

  if (team.stats.adjOE > 118 && other.stats.adjOE > 118) {
    parts.push('both elite offensive teams')
  }

  const efgDiff = Math.abs(team.stats.efgPct - other.stats.efgPct)
  if (efgDiff < 0.02) {
    parts.push(`matching shooting efficiency (~${(other.stats.efgPct * 100).toFixed(0)}% eFG)`)
  }

  if (parts.length === 0) {
    parts.push('similar overall efficiency profile')
  }

  return `${other.name} (${other.conference}, #${other.seed} seed in the ${other.region}) — ${parts.join(', ')}.`
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function findBracketTwins(
  team: MockTeam,
  allTeams: MockTeam[],
  topN = 3
): BracketTwinMatch[] {
  const teamVec = buildFeatureVector(team)

  // Exclude the team itself and its First Four counterpart (same id prefix)
  const candidates = allTeams.filter(
    t => t.id !== team.id && !t.isFirstFour
  )

  const scored = candidates.map(other => {
    const otherVec = buildFeatureVector(other)
    const distance = weightedEuclideanDistance(teamVec, otherVec)
    const similarityScore = distanceToSimilarity(distance)
    const explanation = buildExplanation(team, other)
    return { team: other, similarityScore, distance, explanation }
  })

  return scored
    .sort((a, b) => a.distance - b.distance)
    .slice(0, topN)
}

// ─── Historical Twins (past tournament teams) ──────────────────────────────────

import type { HistoricalTwinCandidate } from './historicalData'

export interface HistoricalBracketMatch {
  candidate: HistoricalTwinCandidate
  similarityScore: number
  distance: number
  explanation: string
}

function buildHistoricalFeatureVector(c: HistoricalTwinCandidate): FeatureVec {
  return {
    adjEM:          normalize(c.adjEM,          BOUNDS.adjEM.min,          BOUNDS.adjEM.max),
    seed:           normalize(c.seed,           BOUNDS.seed.min,           BOUNDS.seed.max),
    adjDE:          normalize(c.adjDE,          BOUNDS.adjDE.min,          BOUNDS.adjDE.max),
    adjOE:          normalize(c.adjOE,          BOUNDS.adjOE.min,          BOUNDS.adjOE.max),
    efgPct:         0.5, // not tracked historically — neutral
    threePointRate: normalize(c.threePointRate, BOUNDS.threePointRate.min, BOUNDS.threePointRate.max),
  }
}

function buildHistoricalExplanation(team: MockTeam, c: HistoricalTwinCandidate): string {
  const parts: string[] = []

  if (Math.abs(team.seed - c.seed) <= 1) {
    parts.push(`both seeded ${c.seed}`)
  } else if (Math.abs(team.seed - c.seed) <= 3) {
    parts.push(`similar seedings (${team.seed} vs ${c.seed})`)
  }

  const emDiff = Math.abs(team.stats.adjEM - c.adjEM)
  if (emDiff < 2) {
    parts.push(`nearly identical efficiency margin (${c.adjEM.toFixed(1)})`)
  } else if (emDiff < 5) {
    parts.push(`close efficiency margin (${c.adjEM.toFixed(1)} vs ${team.stats.adjEM.toFixed(1)})`)
  }

  if (team.stats.adjDE < 94 && c.adjDE < 94) parts.push('both anchored by elite defense')
  if (team.stats.adjOE > 118 && c.adjOE > 118) parts.push('both elite offensive teams')

  const resultLabel: Record<string, string> = {
    Champion: '🏆 Won the title',
    'Runner-up': 'Made the championship game',
    F4: 'Made the Final Four',
    E8: 'Reached the Elite Eight',
    S16: 'Made the Sweet 16',
    R32: 'Won in Round of 64',
    R64: 'Lost in Round of 64',
  }
  parts.push(resultLabel[c.tournamentResult] ?? c.tournamentResult)

  return `${c.teamName} ${c.year} (#${c.seed} seed) — ${parts.join(', ')}.`
}

export function findHistoricalBracketTwins(
  team: MockTeam,
  candidates: HistoricalTwinCandidate[],
  topN = 3
): HistoricalBracketMatch[] {
  const teamVec = buildFeatureVector(team)

  const scored = candidates.map(c => {
    const cVec = buildHistoricalFeatureVector(c)
    const distance = weightedEuclideanDistance(teamVec, cVec)
    const similarityScore = distanceToSimilarity(distance)
    const explanation = buildHistoricalExplanation(team, c)
    return { candidate: c, similarityScore, distance, explanation }
  })

  return scored
    .sort((a, b) => a.distance - b.distance)
    .slice(0, topN)
}

// ─── Legacy alias ──────────────────────────────────────────────────────────────
export function findHistoricalTwins(): BracketTwinMatch[] {
  return []
}

// ─── TwinMatch alias for backwards compat ─────────────────────────────────────
export type TwinMatch = BracketTwinMatch
