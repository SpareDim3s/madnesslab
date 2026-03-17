import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ALL_TEAMS } from '@/lib/mockData'
import { predictMatchup } from '@/lib/predictionEngine'
import { getUpsetRateForMatchup } from '@/lib/historicalData'
import { explainMatchup } from '@/lib/aiExplainer'

const QuerySchema = z.object({
  gameId: z.string(),
})

const BodySchema = z.object({
  team1Id: z.string(),
  team2Id: z.string(),
})

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const { gameId } = QuerySchema.parse(Object.fromEntries(url.searchParams))

    // Parse gameId: r64_South_1v16
    const parts = gameId.split('_')
    const region = parts[1]
    const seeds = parts[2]?.split('v').map(Number)

    if (!seeds || seeds.length !== 2) {
      return NextResponse.json({ error: 'Invalid gameId' }, { status: 400 })
    }

    const regionTeams = ALL_TEAMS.filter(t => t.region === region && !t.isFirstFour)
    const team1 = regionTeams.find(t => t.seed === seeds[0])
    const team2 = regionTeams.find(t => t.seed === seeds[1])

    if (!team1 || !team2) {
      return NextResponse.json({ error: 'Teams not found' }, { status: 404 })
    }

    const prediction = predictMatchup(team1, team2)
    const upsetRate = getUpsetRateForMatchup(seeds[0], seeds[1])

    const output = await explainMatchup({
      team1,
      team2,
      prediction,
      seedMatchupUpsetRate: upsetRate,
    })

    return NextResponse.json(output)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as unknown
    const { team1Id, team2Id } = BodySchema.parse(body)

    const team1 = ALL_TEAMS.find(t => t.id === team1Id || t.slug === team1Id)
    const team2 = ALL_TEAMS.find(t => t.id === team2Id || t.slug === team2Id)

    if (!team1 || !team2) {
      return NextResponse.json({ error: 'One or both teams not found' }, { status: 404 })
    }

    const prediction = predictMatchup(team1, team2)
    const upsetRate = getUpsetRateForMatchup(team1.seed, team2.seed)

    const output = await explainMatchup({
      team1,
      team2,
      prediction,
      seedMatchupUpsetRate: upsetRate,
    })

    return NextResponse.json(output)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 })
  }
}
