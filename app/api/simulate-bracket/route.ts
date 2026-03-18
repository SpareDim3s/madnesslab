import { NextResponse } from 'next/server'
import { ALL_TEAMS } from '@/lib/mockData'
import { simulateSingleRun, runSimulation } from '@/lib/simulationEngine'

export async function POST() {
  try {
    const teams = ALL_TEAMS

    // Single deterministic run for the actual bracket path
    const single = simulateSingleRun(teams)

    // 200 runs for stable championship odds
    const odds = runSimulation(teams, 200)

    // Extract R64 winners (32 teams that won their first-round game)
    const r32WinnerIds = new Set<string>()
    for (const game of single.games) {
      if (game.gameId.startsWith('r64_')) {
        r32WinnerIds.add(game.winnerId)
      }
    }
    const r32Winners = teams.filter(t => r32WinnerIds.has(t.id))

    // Extract R64 upsets (game IDs like r64_South_1v16)
    const r64Upsets: Array<{
      region: string
      winnerSeed: number
      loserSeed: number
      winner: (typeof teams)[0]
    }> = []

    for (const game of single.games) {
      if (!game.wasUpset) continue
      if (!game.gameId.startsWith('r64_')) continue

      const parts = game.gameId.split('_')
      if (parts.length < 3) continue
      const region = parts[1]
      const seedMatch = parts[2].match(/(\d+)v(\d+)/)
      if (!seedMatch) continue

      const winner = teams.find(t => t.id === game.winnerId)
      if (!winner) continue

      const higherSeed = Math.min(parseInt(seedMatch[1]), parseInt(seedMatch[2]))
      const lowerSeed = Math.max(parseInt(seedMatch[1]), parseInt(seedMatch[2]))

      r64Upsets.push({
        region,
        winnerSeed: winner.seed,
        loserSeed: higherSeed,
        winner,
      })

      void lowerSeed // suppress unused warning
    }

    // Also flag any Elite Eight or Final Four upsets
    const lateUpsets: Array<{
      round: string
      winnerId: string
      winnerSeed: number
    }> = []

    for (const game of single.games) {
      if (!game.wasUpset) continue
      const winner = teams.find(t => t.id === game.winnerId)
      if (!winner) continue

      if (game.gameId.startsWith('e8_') || game.gameId.startsWith('f4_') || game.gameId === 'championship') {
        const round = game.gameId.startsWith('e8_')
          ? 'Elite Eight'
          : game.gameId.startsWith('f4_')
          ? 'Final Four'
          : 'Championship'
        lateUpsets.push({ round, winnerId: winner.id, winnerSeed: winner.seed })
      }
    }

    return NextResponse.json({
      champion: single.champion,
      finalFour: single.finalFour,
      eliteEight: single.eliteEight,
      sweet16: single.sweet16,
      r32Winners,
      r64Upsets,
      lateUpsets,
      titleOdds: odds.teams.slice(0, 12),
    })
  } catch (err) {
    console.error('[/api/simulate-bracket]', err)
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
}
