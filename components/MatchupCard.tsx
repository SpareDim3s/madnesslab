'use client'

import Link from 'next/link'
import { cn, formatOdds, seedColor, winProbColor, getUpsetTierColor } from '@/lib/utils'
import { UpsetAlertBadge } from './UpsetAlertBadge'
import type { MockTeam } from '@/lib/mockData'
import type { MatchupPrediction } from '@/lib/predictionEngine'
import { Lock } from 'lucide-react'

interface MatchupCardProps {
  gameId: string
  team1: MockTeam | null
  team2: MockTeam | null
  prediction?: MatchupPrediction | null
  winner?: MockTeam | null
  round: number
  isLocked?: boolean
  onSelectWinner?: (team: MockTeam) => void
  compact?: boolean
  className?: string
}

function TeamRow({
  team,
  prob,
  isWinner,
  isLoser,
  isClickable,
  onClick,
  compact,
}: {
  team: MockTeam | null
  prob: number
  isWinner: boolean
  isLoser: boolean
  isClickable: boolean
  onClick?: () => void
  compact?: boolean
}) {
  if (!team) {
    return (
      <div className={cn('flex items-center gap-2 py-2 px-3 rounded-md', compact ? 'min-h-[36px]' : 'min-h-[44px]', 'bg-gray-800/30 border border-dashed border-gray-700/50')}>
        <div className="h-5 w-5 rounded bg-gray-700/50" />
        <span className="text-xs text-gray-600 italic">TBD</span>
      </div>
    )
  }

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={cn(
        'flex items-center justify-between gap-2 rounded-md px-3 transition-all',
        compact ? 'py-2' : 'py-2.5',
        isClickable && 'cursor-pointer',
        isWinner && 'bg-emerald-500/10 border border-emerald-500/30',
        isLoser && 'opacity-40',
        !isWinner && !isLoser && isClickable && 'hover:bg-gray-700/40 border border-gray-700/30',
        !isWinner && !isLoser && !isClickable && 'border border-gray-800/50',
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn('shrink-0 text-xs font-bold w-5 text-center', seedColor(team.seed))}>
          {team.seed}
        </span>
        <span className={cn('font-medium truncate', compact ? 'text-sm' : 'text-sm', isWinner ? 'text-white' : 'text-gray-200')}>
          {team.name}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {prob > 0 && (
          <span className={cn('text-xs font-bold tabular-nums', winProbColor(prob))}>
            {formatOdds(prob)}
          </span>
        )}
        {isWinner && (
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
        )}
      </div>
    </div>
  )
}

export function MatchupCard({
  gameId,
  team1,
  team2,
  prediction,
  winner,
  round,
  isLocked = false,
  onSelectWinner,
  compact = false,
  className,
}: MatchupCardProps) {
  const team1Prob = prediction?.team1WinProb ?? 0.5
  const team2Prob = prediction?.team2WinProb ?? 0.5
  const upsetTier = prediction?.upsetAlertTier ?? 'none'
  const volatility = prediction?.volatilityScore ?? 0

  const isClickable = !!onSelectWinner && !isLocked && !!team1 && !!team2

  return (
    <div className={cn(
      'rounded-lg border bg-gray-900/80 overflow-hidden transition-all duration-150',
      upsetTier === 'high' ? 'border-red-500/30' : upsetTier === 'medium' ? 'border-orange-500/30' : 'border-gray-800',
      className
    )}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800 bg-gray-900/50">
          <span className="text-xs text-gray-500 font-mono">
            {upsetTier !== 'none' && <UpsetAlertBadge tier={upsetTier} />}
          </span>
          <div className="flex items-center gap-2">
            {isLocked && <Lock className="h-3 w-3 text-gray-500" />}
            {volatility > 0 && (
              <span className={cn('text-xs', volatility > 60 ? 'text-red-400' : volatility > 40 ? 'text-orange-400' : 'text-gray-500')}>
                {volatility > 60 ? '🌪️' : volatility > 40 ? '⚡' : ''} vol {volatility}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Teams */}
      <div className={cn('space-y-1', compact ? 'p-2' : 'p-3')}>
        <TeamRow
          team={team1}
          prob={team1Prob}
          isWinner={!!winner && winner.id === team1?.id}
          isLoser={!!winner && winner.id === team2?.id}
          isClickable={isClickable}
          onClick={() => team1 && onSelectWinner?.(team1)}
          compact={compact}
        />

        {/* Divider with seed matchup odds */}
        {!compact && team1 && team2 && prediction && (
          <div className="flex items-center gap-2 px-1">
            <div className="h-px flex-1 bg-gray-800" />
            <span className="text-xs text-gray-600">
              {Math.round(prediction.team2WinProb * 100)}% upset
            </span>
            <div className="h-px flex-1 bg-gray-800" />
          </div>
        )}
        {compact && <div className="h-px bg-gray-800" />}

        <TeamRow
          team={team2}
          prob={team2Prob}
          isWinner={!!winner && winner.id === team2?.id}
          isLoser={!!winner && winner.id === team1?.id}
          isClickable={isClickable}
          onClick={() => team2 && onSelectWinner?.(team2)}
          compact={compact}
        />
      </div>

      {/* Footer with detail link */}
      {!compact && team1 && team2 && (
        <div className="border-t border-gray-800 px-3 py-1.5">
          <Link
            href={`/matchups/${gameId}`}
            className="text-xs text-gray-500 hover:text-orange-400 transition-colors"
          >
            Matchup details →
          </Link>
        </div>
      )}
    </div>
  )
}
