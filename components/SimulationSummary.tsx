import { cn, formatOdds, seedColor } from '@/lib/utils'
import type { SimulationResult } from '@/lib/simulationEngine'
import { Trophy, Target, Layers, Star } from 'lucide-react'
import Link from 'next/link'

interface SimulationSummaryProps {
  result: SimulationResult
  className?: string
}

export function SimulationSummary({ result, className }: SimulationSummaryProps) {
  const topTeams = result.teams.slice(0, 10)
  const { numSimulations } = result

  return (
    <div className={cn('rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-orange-400" />
          <h3 className="font-semibold text-white">Simulation Results</h3>
          <span className="text-xs text-gray-500 font-mono">n={numSimulations}</span>
        </div>
      </div>

      {/* Title odds table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500">
              <th className="text-left px-5 py-2.5 font-medium">Team</th>
              <th className="text-right px-3 py-2.5 font-medium">
                <span className="flex items-center justify-end gap-1">
                  <Trophy className="h-3 w-3 text-yellow-400" />
                  Title
                </span>
              </th>
              <th className="text-right px-3 py-2.5 font-medium hidden sm:table-cell">
                <span className="flex items-center justify-end gap-1">
                  <Star className="h-3 w-3 text-purple-400" />
                  F4
                </span>
              </th>
              <th className="text-right px-3 py-2.5 font-medium hidden md:table-cell">
                <span className="flex items-center justify-end gap-1">
                  <Target className="h-3 w-3 text-blue-400" />
                  E8
                </span>
              </th>
              <th className="text-right px-5 py-2.5 font-medium hidden lg:table-cell">
                <span className="flex items-center justify-end gap-1">
                  <Layers className="h-3 w-3 text-sky-400" />
                  S16
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {topTeams.map((team, i) => (
              <tr
                key={team.teamId}
                className={cn(
                  'border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors',
                  i === 0 && 'bg-orange-500/5'
                )}
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-gray-600 w-4">#{i + 1}</span>
                    <span className={cn('text-xs font-semibold w-5 text-center', seedColor(team.seed))}>
                      {team.seed}
                    </span>
                    <div>
                      <Link
                        href={`/teams/${team.teamId}`}
                        className="font-medium text-white hover:text-orange-400 transition-colors"
                      >
                        {team.teamName}
                      </Link>
                      <p className="text-xs text-gray-500">{team.region}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-right">
                  <span className={cn(
                    'font-bold tabular-nums',
                    team.titleOdds > 0.15 ? 'text-yellow-400' : team.titleOdds > 0.08 ? 'text-orange-400' : 'text-gray-300'
                  )}>
                    {formatOdds(team.titleOdds)}
                  </span>
                </td>
                <td className="px-3 py-3 text-right hidden sm:table-cell">
                  <span className="text-gray-300 tabular-nums">{formatOdds(team.finalFourOdds)}</span>
                </td>
                <td className="px-3 py-3 text-right hidden md:table-cell">
                  <span className="text-gray-400 tabular-nums">{formatOdds(team.eliteEightOdds)}</span>
                </td>
                <td className="px-5 py-3 text-right hidden lg:table-cell">
                  <span className="text-gray-500 tabular-nums">{formatOdds(team.sweet16Odds)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result.teams.length > 10 && (
        <div className="px-5 py-3 text-xs text-gray-500 border-t border-gray-800">
          Showing top 10 of {result.teams.length} teams
        </div>
      )}
    </div>
  )
}
