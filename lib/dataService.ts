/**
 * MadnessLab — Data Service
 *
 * Single import point for team data. Respects USE_MOCK_DATA env var.
 * All app code should import from here instead of mockData or realData directly.
 *
 * Usage:
 *   import { ALL_TEAMS, getTeamBySlug, getTeamsByRegion } from '@/lib/dataService'
 */

import { ALL_TEAMS as MOCK_TEAMS } from './mockData'
import type { MockTeam } from './mockData'

// Dynamically load real data if available and USE_MOCK_DATA is false
let REAL_TEAMS: MockTeam[] | null = null
let realDataSource = 'mock'

try {
  if (process.env.USE_MOCK_DATA !== 'true') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const realData = require('./realData')
    if (realData.ALL_TEAMS && Array.isArray(realData.ALL_TEAMS)) {
      REAL_TEAMS = realData.ALL_TEAMS
      realDataSource = realData.DATA_SOURCE || 'real'
    }
  }
} catch {
  // realData.ts doesn't exist yet — fall back to mock data silently
  // Run: npx tsx scripts/fetchTRankData.ts to generate it
}

/**
 * All 68 tournament teams.
 * Source depends on USE_MOCK_DATA env var and whether realData.ts has been generated.
 */
export const ALL_TEAMS: MockTeam[] = REAL_TEAMS ?? MOCK_TEAMS

/**
 * Whether we're using real Barttorvik data or mock data.
 */
export const DATA_SOURCE: 'barttorvik-live' | 'estimated' | 'mock' = realDataSource as 'barttorvik-live' | 'estimated' | 'mock'
export const IS_MOCK_DATA = DATA_SOURCE === 'mock'

/**
 * Get a single team by slug.
 */
export function getTeamBySlug(slug: string): MockTeam | undefined {
  return ALL_TEAMS.find(t => t.slug === slug)
}

/**
 * Get teams filtered by region.
 */
export function getTeamsByRegion(region: 'South' | 'East' | 'West' | 'Midwest'): MockTeam[] {
  return ALL_TEAMS.filter(t => t.region === region && !t.isFirstFour)
}

/**
 * Get top N teams by KenPom rank.
 */
export function getTopTeams(n: number): MockTeam[] {
  return [...ALL_TEAMS]
    .filter(t => !t.isFirstFour)
    .sort((a, b) => a.stats.kenpomRank - b.stats.kenpomRank)
    .slice(0, n)
}

/**
 * Get teams with highest upset vulnerability (potential upsets to watch).
 */
export function getUpsetAlerts(minSeed = 8, maxVulnerability = 100): MockTeam[] {
  return ALL_TEAMS
    .filter(t => !t.isFirstFour && t.seed >= minSeed && t.upsetVulnerability <= maxVulnerability)
    .sort((a, b) => a.upsetVulnerability - b.upsetVulnerability)
}

// Re-export the type for convenience
export type { MockTeam }
