import { NextResponse } from 'next/server'
import { TEAMS_BY_ID, TEAMS_BY_SLUG } from '@/lib/mockData'
import { findBracketTwins } from '@/lib/historicalTwins'
import { predictMatchup } from '@/lib/predictionEngine'
import { ALL_TEAMS } from '@/lib/mockData'

export async function GET(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  const { teamId } = params

  // Try ID first, then slug
  const team = TEAMS_BY_ID.get(teamId) ?? TEAMS_BY_SLUG.get(teamId)

  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamId}` }, { status: 404 })
  }

  // Find bracket twins — most similar teams in the 2026 field
  const twins = findBracketTwins(team, ALL_TEAMS, 3)

  // Find first-round matchup opponent
  const r64Pairings: Record<number, number> = { 1: 16, 2: 15, 3: 14, 4: 13, 5: 12, 6: 11, 7: 10, 8: 9, 9: 8, 10: 7, 11: 6, 12: 5, 13: 4, 14: 3, 15: 2, 16: 1 }
  const opponentSeed = r64Pairings[team.seed]
  const opponent = ALL_TEAMS.find(t => t.region === team.region && t.seed === opponentSeed && !t.isFirstFour)

  const matchupPrediction = opponent ? predictMatchup(team, opponent) : null

  // Path difficulty: sum of predicted opponents' adjEM
  const pathTeams = ALL_TEAMS.filter(t =>
    t.region === team.region &&
    !t.isFirstFour &&
    t.id !== team.id
  ).slice(0, 3) // Top 3 potential opponents
  const pathDifficulty = pathTeams.reduce((sum, t) => sum + t.stats.adjEM, 0) / pathTeams.length

  return NextResponse.json({
    team,
    historicalTwins: twins,
    firstRoundOpponent: opponent ?? null,
    firstRoundPrediction: matchupPrediction,
    pathDifficulty: Math.round(pathDifficulty * 10) / 10,
    source: 'mock',
  })
}
