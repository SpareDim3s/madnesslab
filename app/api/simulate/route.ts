import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ALL_TEAMS } from '@/lib/mockData'
import { runSimulation } from '@/lib/simulationEngine'

const SimulateSchema = z.object({
  numSims: z.number().min(1).max(1000).default(1),
  lockedPicks: z.record(z.string()).optional().default({}),
})

export async function POST(request: Request) {
  try {
    const body = await request.json() as unknown
    const { numSims, lockedPicks } = SimulateSchema.parse(body)

    // Run simulation with all non-First-Four teams
    const teams = ALL_TEAMS.filter(t => !t.isFirstFour)

    // For large sim counts, cap at 1000 to prevent timeout
    const clampedSims = Math.min(numSims, 1000)

    const result = runSimulation(teams, clampedSims, lockedPicks)

    return NextResponse.json({
      result,
      numSimulations: clampedSims,
      source: 'mock',
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: err.errors }, { status: 400 })
    }
    console.error('[/api/simulate]', err)
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
}

export async function GET() {
  // Quick single-run simulation for testing
  const teams = ALL_TEAMS.filter(t => !t.isFirstFour)
  const result = runSimulation(teams, 1)
  return NextResponse.json({ result, source: 'mock' })
}
