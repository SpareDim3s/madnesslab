import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ALL_TEAMS } from '@/lib/mockData'
import { predictMatchup } from '@/lib/predictionEngine'

const QuerySchema = z.object({
  region: z.enum(['South', 'East', 'West', 'Midwest', 'Final Four']).optional(),
  round: z.coerce.number().min(0).max(6).optional(),
})

const R64_PAIRINGS = [[1,16],[8,9],[5,12],[4,13],[6,11],[3,14],[7,10],[2,15]] as const
const REGIONS = ['South', 'East', 'West', 'Midwest'] as const

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const query = QuerySchema.parse(Object.fromEntries(url.searchParams))

    const games = []

    for (const region of REGIONS) {
      if (query.region && query.region !== region) continue
      if (query.round && query.round !== 1) continue

      const regionTeams = ALL_TEAMS.filter(t => t.region === region && !t.isFirstFour)

      for (const [seed1, seed2] of R64_PAIRINGS) {
        const team1 = regionTeams.find(t => t.seed === seed1)
        const team2 = regionTeams.find(t => t.seed === seed2)

        if (!team1 || !team2) continue

        const prediction = predictMatchup(team1, team2)

        games.push({
          id: `r64_${region}_${seed1}v${seed2}`,
          round: 1,
          roundName: 'Round of 64',
          region,
          team1: { id: team1.id, name: team1.name, seed: team1.seed, slug: team1.slug },
          team2: { id: team2.id, name: team2.name, seed: team2.seed, slug: team2.slug },
          team1WinProb: prediction.team1WinProb,
          team2WinProb: prediction.team2WinProb,
          favoriteId: prediction.favoriteId,
          upsetAlertTier: prediction.upsetAlertTier,
          volatilityScore: prediction.volatilityScore,
          confidenceTier: prediction.confidenceTier,
        })
      }
    }

    return NextResponse.json({ games, total: games.length, source: 'mock' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
