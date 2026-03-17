'use client'

import { useState, useCallback } from 'react'
import { cn, roundName } from '@/lib/utils'
import { MatchupCard } from './MatchupCard'
import { SimulationControls } from './SimulationControls'
import { SimulationSummary } from './SimulationSummary'
import type { MockTeam } from '@/lib/mockData'
import type { SimulationResult } from '@/lib/simulationEngine'

interface BracketGame {
  id: string
  round: number
  region: string
  team1: MockTeam | null
  team2: MockTeam | null
  team1WinProb: number
  team2WinProb: number
  volatilityScore: number
  upsetAlertTier: string
  winner: MockTeam | null
}

interface BracketViewProps {
  teams: MockTeam[]
  initialGames?: BracketGame[]
}

const REGIONS = ['South', 'East', 'West', 'Midwest'] as const
const SEED_MATCHUPS = [[1,16],[8,9],[5,12],[4,13],[6,11],[3,14],[7,10],[2,15]] as const

export function BracketView({ teams }: BracketViewProps) {
  const [numSims, setNumSims] = useState(1)
  const [isRunning, setIsRunning] = useState(false)
  const [simResult, setSimResult] = useState<SimulationResult | null>(null)
  const [winners, setWinners] = useState<Record<string, string>>({})  // gameId → winnerId
  const [lockedPicks, setLockedPicks] = useState<Set<string>>(new Set())
  const [activeRegion, setActiveRegion] = useState<string>('South')
  const [viewMode, setViewMode] = useState<'bracket' | 'odds'>('bracket')

  const handleRun = useCallback(async () => {
    setIsRunning(true)
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numSims, lockedPicks: Object.fromEntries([...lockedPicks].map(id => [id, winners[id]])) }),
      })
      if (res.ok) {
        const data = await res.json() as { result: SimulationResult }
        setSimResult(data.result)
        // Populate winners from the first sim run
        if (data.result.teams.length > 0) {
          // populate a synthetic bracket from most-likely outcomes
          const newWinners: Record<string, string> = {}
          setWinners(newWinners)
        }
      }
    } catch (err) {
      console.error('Sim failed:', err)
    } finally {
      setIsRunning(false)
    }
  }, [numSims, lockedPicks, winners])

  const handleReset = useCallback(() => {
    setSimResult(null)
    setWinners({})
    setLockedPicks(new Set())
  }, [])

  // Build region brackets
  const getRegionTeams = (region: string) =>
    teams.filter(t => t.region === region && !t.isFirstFour)
      .sort((a, b) => a.seed - b.seed)

  const getMatchupTeams = (region: string, seed1: number, seed2: number) => {
    const regionTeams = getRegionTeams(region)
    return {
      team1: regionTeams.find(t => t.seed === seed1) ?? null,
      team2: regionTeams.find(t => t.seed === seed2) ?? null,
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SimulationControls
          numSims={numSims}
          onNumSimsChange={setNumSims}
          onRun={handleRun}
          onReset={handleReset}
          isRunning={isRunning}
          hasResults={!!simResult}
        />

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('bracket')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              viewMode === 'bracket' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            )}
          >
            Bracket
          </button>
          <button
            onClick={() => setViewMode('odds')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              viewMode === 'odds' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            )}
          >
            Odds Table
          </button>
        </div>
      </div>

      {/* Running indicator */}
      {isRunning && (
        <div className="flex items-center justify-center py-8 gap-3">
          <div className="h-2 w-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-2 w-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-2 w-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="text-gray-400 text-sm ml-2">
            Running {numSims} simulation{numSims > 1 ? 's' : ''}...
          </span>
        </div>
      )}

      {/* Simulation results */}
      {simResult && viewMode === 'odds' && (
        <SimulationSummary result={simResult} />
      )}

      {viewMode === 'bracket' && !isRunning && (
        <>
          {/* Region tabs */}
          <div className="flex overflow-x-auto gap-2 pb-1">
            {[...REGIONS, 'Final Four'].map(region => (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeRegion === region
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                {region}
              </button>
            ))}
          </div>

          {/* Region bracket */}
          {REGIONS.includes(activeRegion as typeof REGIONS[number]) && (
            <RegionBracket
              region={activeRegion as typeof REGIONS[number]}
              teams={teams}
              simResult={simResult}
            />
          )}

          {activeRegion === 'Final Four' && (
            <FinalFourView teams={teams} simResult={simResult} />
          )}
        </>
      )}
    </div>
  )
}

function RegionBracket({
  region,
  teams,
  simResult,
}: {
  region: string
  teams: MockTeam[]
  simResult: SimulationResult | null
}) {
  const regionTeams = teams.filter(t => t.region === region && !t.isFirstFour)
  const ffTeams = teams.filter(t => t.region === region && t.isFirstFour)

  // Build R64 matchups
  const r64Games = SEED_MATCHUPS.map(([s1, s2], i) => {
    const team1 = regionTeams.find(t => t.seed === s1) ?? null
    const team2 = regionTeams.find(t => t.seed === s2) ?? null
    const gameId = `r64_${region}_${s1}v${s2}`

    // Get win prob from prediction
    let team1Prob = 0.5
    let upsetTier = 'none'

    if (team1 && team2) {
      // Simple logistic from adjEM diff
      const emDiff = team1.stats.adjEM - team2.stats.adjEM
      team1Prob = Math.min(0.95, Math.max(0.05, 1 / (1 + Math.pow(10, -emDiff / 15))))
      const seedGap = s2 - s1
      if (seedGap === 4 && team1Prob < 0.70) upsetTier = 'medium'
      if (seedGap === 5 && team1Prob < 0.65) upsetTier = 'high'
      if (seedGap === 3 && team1Prob < 0.72) upsetTier = 'low'
    }

    return { id: gameId, team1, team2, team1Prob, team2Prob: 1 - team1Prob, upsetTier, round: 1, region }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="font-semibold text-white">{region} Region</h3>
        <span className="text-xs text-gray-500">
          {regionTeams.length} teams · R64 → E8
        </span>
      </div>

      {/* First Four if applicable */}
      {ffTeams.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">First Four</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
            {ffTeams.slice(0, 2).map((team, i) => {
              const opp = ffTeams[i + 1] ?? null
              if (i % 2 !== 0) return null
              return (
                <MatchupCard
                  key={`ff_${team.id}`}
                  gameId={`ff_${region}_${team.seed}`}
                  team1={team}
                  team2={opp}
                  round={0}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* R64 matchups in 2-column grid */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Round of 64</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {r64Games.map(game => (
            <MatchupCard
              key={game.id}
              gameId={game.id}
              team1={game.team1}
              team2={game.team2}
              prediction={game.team1 && game.team2 ? {
                team1Id: game.team1.id,
                team2Id: game.team2.id,
                team1WinProb: game.team1Prob,
                team2WinProb: game.team2Prob,
                favoriteId: game.team1Prob >= 0.5 ? game.team1.id : game.team2!.id,
                underdogId: game.team1Prob >= 0.5 ? game.team2!.id : game.team1.id,
                confidenceTier: game.team1Prob > 0.78 ? 'clear_favorite' : game.team1Prob > 0.65 ? 'favored' : game.team1Prob > 0.55 ? 'slight_edge' : 'coin_flip',
                volatilityScore: Math.round(Math.abs(0.5 - game.team1Prob) < 0.1 ? 75 : Math.abs(0.5 - game.team1Prob) < 0.2 ? 55 : 35),
                upsetAlertTier: game.upsetTier as 'none' | 'low' | 'medium' | 'high',
                upsetAlertScore: game.upsetTier === 'high' ? 75 : game.upsetTier === 'medium' ? 55 : game.upsetTier === 'low' ? 30 : 0,
                upsetAlertReasons: [],
                decidingFactors: [],
                layer1Score: { team1: 0, team2: 0 },
                layer2Adjustments: [],
                layer3Prior: game.team1Prob,
                layer4Volatility: 1,
              } : null}
              round={1}
            />
          ))}
        </div>
      </div>

      {/* Simulation advancement odds */}
      {simResult && (
        <div>
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Advancement Odds (from simulation)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500">
                  <th className="text-left py-2 px-3">Team</th>
                  <th className="text-right py-2 px-3">S16</th>
                  <th className="text-right py-2 px-3">E8</th>
                  <th className="text-right py-2 px-3">F4</th>
                  <th className="text-right py-2 px-3">Title</th>
                </tr>
              </thead>
              <tbody>
                {regionTeams
                  .map(team => simResult.teams.find(r => r.teamId === team.id))
                  .filter(Boolean)
                  .sort((a, b) => (b?.titleOdds ?? 0) - (a?.titleOdds ?? 0))
                  .slice(0, 8)
                  .map(r => r && (
                    <tr key={r.teamId} className="border-b border-gray-800/50">
                      <td className="py-2 px-3 text-gray-300">{r.teamName} ({r.seed})</td>
                      <td className="py-2 px-3 text-right text-gray-400">{Math.round(r.sweet16Odds * 100)}%</td>
                      <td className="py-2 px-3 text-right text-blue-400">{Math.round(r.eliteEightOdds * 100)}%</td>
                      <td className="py-2 px-3 text-right text-purple-400">{Math.round(r.finalFourOdds * 100)}%</td>
                      <td className="py-2 px-3 text-right text-orange-400">{Math.round(r.titleOdds * 100)}%</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function FinalFourView({ teams, simResult }: { teams: MockTeam[]; simResult: SimulationResult | null }) {
  const top4 = simResult
    ? simResult.teams.slice(0, 4).map(r => teams.find(t => t.id === r.teamId)).filter(Boolean) as MockTeam[]
    : []

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-white">Final Four & Championship</h3>

      {simResult && top4.length >= 2 ? (
        <div className="max-w-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {top4.slice(0, 2).map((team, i) => (
              <div key={team.id} className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                <p className="text-xs text-gray-500 mb-2">Final Four #{i + 1} (by sim odds)</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-orange-400">#{team.seed}</span>
                  <span className="font-semibold text-white">{team.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{team.region} Region · {team.conference}</p>
                <p className="text-xs text-purple-400 mt-2">
                  F4 odds: {Math.round((simResult.teams.find(r => r.teamId === team.id)?.finalFourOdds ?? 0) * 100)}%
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-5">
            <p className="text-sm font-semibold text-orange-400 mb-1">Projected Champion</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold text-white">
                {teams.find(t => t.id === simResult.mostLikelyChampion)?.name ?? '?'}
              </span>
              <span className="text-sm text-gray-400">
                {Math.round((simResult.teams[0]?.titleOdds ?? 0) * 100)}% title odds in {simResult.numSimulations} sims
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-8 text-center">
          <p className="text-gray-500 text-sm">Run a simulation to see projected Final Four teams</p>
        </div>
      )}
    </div>
  )
}
