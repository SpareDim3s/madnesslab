import { NextResponse } from 'next/server'
import { ALL_TEAMS, TEAMS_BY_ID } from '@/lib/mockData'
import { predictMatchup } from '@/lib/predictionEngine'
import { getUpsetRateForMatchup } from '@/lib/historicalData'
import { generateFallbackExplanation } from '@/lib/aiExplainer'

export async function GET(
  _request: Request,
  { params }: { params: { gameId: string } }
) {
  const { gameId } = params

  // Parse gameId format: r64_South_1v16
  const parts = gameId.split('_')
  if (parts.length < 3) {
    return NextResponse.json({ error: 'Invalid game ID format' }, { status: 400 })
  }

  const [roundPart, region, seedPart] = parts
  const seeds = seedPart?.split('v').map(Number)

  if (!seeds || seeds.length !== 2) {
    return NextResponse.json({ error: 'Invalid game ID: cannot parse seeds' }, { status: 400 })
  }

  const [seed1, seed2] = seeds

  const regionTeams = ALL_TEAMS.filter(t => t.region === region && !t.isFirstFour)
  const team1 = regionTeams.find(t => t.seed === seed1)
  const team2 = regionTeams.find(t => t.seed === seed2)

  if (!team1 || !team2) {
    return NextResponse.json({ error: `Teams not found for ${region} seeds ${seed1} vs ${seed2}` }, { status: 404 })
  }

  const prediction = predictMatchup(team1, team2)
  const upsetRate = getUpsetRateForMatchup(seed1, seed2)

  const explanation = generateFallbackExplanation({
    team1,
    team2,
    prediction,
    seedMatchupUpsetRate: upsetRate,
  })

  return NextResponse.json({
    gameId,
    round: 1,
    roundName: 'Round of 64',
    region,
    team1,
    team2,
    prediction,
    seedMatchupUpsetRate: upsetRate,
    explanation,
    source: 'mock',
  })
}
