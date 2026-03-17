import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ALL_TEAMS, getTeamsByRegion, getTopContenders } from '@/lib/mockData'

const QuerySchema = z.object({
  region: z.enum(['South', 'East', 'West', 'Midwest']).optional(),
  seed: z.coerce.number().min(1).max(16).optional(),
  conference: z.string().optional(),
  topContenders: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(68),
})

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams)
    const query = QuerySchema.parse(params)

    let teams = ALL_TEAMS

    if (query.region) {
      teams = getTeamsByRegion(query.region)
    }

    if (query.seed !== undefined) {
      teams = teams.filter(t => t.seed === query.seed)
    }

    if (query.conference) {
      teams = teams.filter(t => t.conference.toLowerCase().includes(query.conference!.toLowerCase()))
    }

    if (query.topContenders) {
      teams = getTopContenders(query.limit)
    }

    teams = teams.slice(0, query.limit)

    return NextResponse.json({
      teams,
      total: teams.length,
      source: 'mock',
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query params', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
