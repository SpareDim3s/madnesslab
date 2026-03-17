'use client'

import { cn } from '@/lib/utils'
import type { BracketTwinMatch } from '@/lib/historicalTwins'
import { GitMerge } from 'lucide-react'

interface BracketTwinCardProps {
  twin: BracketTwinMatch
  rank?: number
  className?: string
}

// Seed-tier badge (neutral — matches InteractiveBracket)
function seedBadgeClass(seed: number): string {
  if (seed <= 4)  return 'bg-gray-200 text-gray-800'
  if (seed <= 8)  return 'bg-gray-700 text-gray-200'
  if (seed <= 12) return 'bg-gray-600 text-gray-300'
  return 'bg-gray-500 text-gray-300'
}

/** Named export kept for backward compat — same as BracketTwinCard */
export function HistoricalTwinCard(props: BracketTwinCardProps) {
  return <BracketTwinCard {...props} />
}

export function BracketTwinCard({ twin, rank, className }: BracketTwinCardProps) {
  const { team, similarityScore, explanation } = twin

  const logoUrl = (team as { espnId?: number }).espnId
    ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${(team as { espnId?: number }).espnId}.png`
    : null

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

          {/* Logo */}
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          )}

          <div>
            <p className="font-semibold text-white text-sm">{team.name}</p>
            <p className="text-xs text-gray-500">{team.conference} · {team.region} Region</p>
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
            seedBadgeClass(team.seed)
          )}>
            #{team.seed} seed
          </span>
        </div>
      </div>

      {/* Key stats — only reliable ones */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Adj EM',  value: team.stats.adjEM.toFixed(1) },
          { label: 'Off Eff', value: team.stats.adjOE.toFixed(1) },
          { label: 'Def Eff', value: team.stats.adjDE.toFixed(1) },
        ].map(stat => (
          <div key={stat.label} className="rounded bg-gray-800/60 p-1.5 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{stat.label}</p>
            <p className="text-xs font-semibold text-gray-200">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Explanation */}
      <p className="text-xs text-gray-400 leading-relaxed">{explanation}</p>
    </div>
  )
}
