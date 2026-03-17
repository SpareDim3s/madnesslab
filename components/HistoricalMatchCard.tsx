'use client'

import { cn } from '@/lib/utils'
import type { HistoricalBracketMatch } from '@/lib/historicalTwins'
import { GitMerge, Trophy } from 'lucide-react'

interface HistoricalMatchCardProps {
  match: HistoricalBracketMatch
  rank?: number
  className?: string
}

function seedBadgeClass(seed: number): string {
  if (seed <= 4)  return 'bg-gray-200 text-gray-800'
  if (seed <= 8)  return 'bg-gray-700 text-gray-200'
  if (seed <= 12) return 'bg-gray-600 text-gray-300'
  return 'bg-gray-500 text-gray-300'
}

function resultColor(result: string): string {
  if (result === 'Champion')   return 'text-yellow-400'
  if (result === 'Runner-up')  return 'text-orange-400'
  if (result === 'F4')         return 'text-blue-400'
  if (result === 'E8')         return 'text-purple-400'
  return 'text-gray-400'
}

function resultLabel(result: string): string {
  const labels: Record<string, string> = {
    Champion: '🏆 Champion',
    'Runner-up': 'Runner-up',
    F4: 'Final Four',
    E8: 'Elite Eight',
    S16: 'Sweet 16',
    R32: 'Round of 32',
    R64: 'Round of 64',
  }
  return labels[result] ?? result
}

export function HistoricalMatchCard({ match, rank, className }: HistoricalMatchCardProps) {
  const { candidate: c, similarityScore, explanation } = match

  return (
    <div className={cn(
      'rounded-xl border border-gray-800 bg-gray-900/60 p-4 hover:border-gray-700 transition-colors',
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          {rank && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-gray-400">
              {rank}
            </span>
          )}
          <div>
            <p className="font-semibold text-white text-sm">{c.teamName} <span className="text-gray-500 font-normal">'{String(c.year).slice(2)}</span></p>
            <p className="text-xs text-gray-500">{c.region} Region · KenPom #{c.kenpomRank}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-1">
            <GitMerge className="h-3 w-3 text-orange-400" />
            <span className="text-xs font-bold text-orange-400">{similarityScore}%</span>
            <span className="text-xs text-gray-500">match</span>
          </div>
          <span className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
            seedBadgeClass(c.seed)
          )}>
            #{c.seed} seed
          </span>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Adj EM',  value: c.adjEM.toFixed(1) },
          { label: 'Off Eff', value: c.adjOE.toFixed(1) },
          { label: 'Def Eff', value: c.adjDE.toFixed(1) },
        ].map(stat => (
          <div key={stat.label} className="rounded bg-gray-800/60 p-1.5 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{stat.label}</p>
            <p className="text-xs font-semibold text-gray-200">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tournament result */}
      <div className="flex items-center gap-1.5 mb-2">
        <Trophy className="h-3 w-3 text-gray-500" />
        <span className={cn('text-xs font-semibold', resultColor(c.tournamentResult))}>
          {resultLabel(c.tournamentResult)}
        </span>
      </div>

      {/* Explanation */}
      <p className="text-xs text-gray-400 leading-relaxed">{explanation}</p>
    </div>
  )
}
