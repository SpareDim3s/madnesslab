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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: compact ? '6px 10px' : '8px 12px',
        minHeight: compact ? 36 : 44,
        borderRadius: 6,
        background: '#f5f0e6',
        border: '1px dashed #e8e0d0',
      }}>
        <div style={{ width: 20, height: 20, borderRadius: 4, background: '#e8e0d0' }} />
        <span style={{ fontSize: 12, color: '#8b7d6b', fontStyle: 'italic' }}>TBD</span>
      </div>
    )
  }

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        borderRadius: 6,
        padding: compact ? '6px 10px' : '8px 12px',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.15s',
        background: isWinner ? '#f0fdf4' : 'transparent',
        border: isWinner ? '1px solid #86efac' : '1px solid #e8e0d0',
        opacity: isLoser ? 0.4 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 700,
          width: 20,
          textAlign: 'center',
          color: team.seed <= 4 ? '#a0832a' : team.seed <= 8 ? '#2563eb' : '#8b7d6b',
        }}>
          {team.seed}
        </span>
        <span style={{
          fontWeight: 500,
          fontSize: compact ? 13 : 13,
          color: isWinner ? '#166534' : '#1a1625',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {team.name}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {prob > 0 && (
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: prob >= 0.65 ? '#2563eb' : prob >= 0.5 ? '#a0832a' : '#8b7d6b',
          }}>
            {formatOdds(prob)}
          </span>
        )}
        {isWinner && (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
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

  const borderColor = upsetTier === 'high' ? '#fca5a5' : upsetTier === 'medium' ? '#fed7aa' : '#e8e0d0'

  return (
    <div style={{
      borderRadius: 8,
      border: `1px solid ${borderColor}`,
      background: '#ffffff',
      overflow: 'hidden',
      transition: 'all 0.15s',
    }} className={className}>
      {/* Header */}
      {!compact && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          borderBottom: '1px solid #e8e0d0',
          background: '#fdfcf8',
        }}>
          <span style={{ fontSize: 11 }}>
            {upsetTier !== 'none' && <UpsetAlertBadge tier={upsetTier} />}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isLocked && <Lock style={{ width: 12, height: 12, color: '#8b7d6b' }} />}
            {volatility > 0 && (
              <span style={{
                fontSize: 11,
                color: volatility > 60 ? '#dc2626' : volatility > 40 ? '#b45309' : '#8b7d6b',
              }}>
                {volatility > 60 ? '🌪️' : volatility > 40 ? '⚡' : ''} vol {volatility}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Teams */}
      <div style={{ padding: compact ? 8 : 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <TeamRow
          team={team1}
          prob={team1Prob}
          isWinner={!!winner && winner.id === team1?.id}
          isLoser={!!winner && winner.id === team2?.id}
          isClickable={isClickable}
          onClick={() => team1 && onSelectWinner?.(team1)}
          compact={compact}
        />

        {/* Divider */}
        {!compact && team1 && team2 && prediction && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
            <div style={{ flex: 1, height: 1, background: '#e8e0d0' }} />
            <span style={{ fontSize: 11, color: '#8b7d6b' }}>
              {Math.round(prediction.team2WinProb * 100)}% upset
            </span>
            <div style={{ flex: 1, height: 1, background: '#e8e0d0' }} />
          </div>
        )}
        {compact && <div style={{ height: 1, background: '#e8e0d0' }} />}

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

      {/* Footer */}
      {!compact && team1 && team2 && (
        <div style={{ borderTop: '1px solid #e8e0d0', padding: '6px 12px' }}>
          <Link
            href={`/matchups/${gameId}`}
            style={{ fontSize: 11, color: '#8b7d6b', textDecoration: 'none' }}
          >
            Matchup details →
          </Link>
        </div>
      )}
    </div>
  )
}
