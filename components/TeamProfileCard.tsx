'use client'

import Link from 'next/link'
import { cn, programTierBadge, seedColor } from '@/lib/utils'
import { UpsetAlertBadge } from './UpsetAlertBadge'
import type { MockTeam } from '@/lib/mockData'
import { TrendingUp, Shield, Zap } from 'lucide-react'

interface TeamProfileCardProps {
  team: MockTeam
  className?: string
  compact?: boolean
  showLink?: boolean
}

export function TeamProfileCard({ team, className, compact = false, showLink = true }: TeamProfileCardProps) {
  const tierBadge = programTierBadge(team.programTier)
  const { streakType, streakLength } = team.recentForm
  const hasRecord = (team.winsTotal ?? 0) + (team.lossesTotal ?? 0) > 0
  const record = hasRecord ? `${team.winsTotal}-${team.lossesTotal}` : null
  const logoUrl = team.espnId
    ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.espnId}.png`
    : null

  const starPlayer = team.keyPlayers?.[0] ?? null

  const card = (
    <div
      className={cn('rounded-xl transition-all duration-200', compact ? 'p-3' : 'p-5', className)}
      style={{
        background: 'white',
        border: '1px solid #e8e0d0',
        boxShadow: '0 1px 4px rgba(26,22,37,0.04)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#a0832a60' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e8e0d0' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo or seed badge */}
          {logoUrl ? (
            <div
              className={cn('shrink-0 flex items-center justify-center rounded-lg', compact ? 'h-8 w-8' : 'h-11 w-11')}
              style={{ background: '#faf7f0', border: '1px solid #e8e0d0' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={`${team.name} logo`}
                width={compact ? 28 : 36}
                height={compact ? 28 : 36}
                className="object-contain"
                onError={(e) => {
                  const parent = (e.currentTarget as HTMLImageElement).parentElement
                  if (parent) {
                    parent.innerHTML = `<span class="text-sm font-bold ${seedColor(team.seed)}">${team.seed}</span>`
                  }
                }}
              />
            </div>
          ) : (
            <div
              className={cn('shrink-0 flex items-center justify-center rounded font-bold text-sm', compact ? 'h-7 w-7' : 'h-9 w-9')}
              style={{ background: '#1a1625', color: 'white' }}
            >
              {team.seed}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3
                className={cn('font-bold truncate', compact ? 'text-sm' : 'text-base')}
                style={{ color: '#1a1625', fontFamily: compact ? undefined : '"Playfair Display", serif' }}
              >
                {team.name}
              </h3>
              {/* Seed badge when logo is shown */}
              {logoUrl && (
                <span
                  className={cn('shrink-0 inline-flex items-center justify-center rounded text-xs font-bold', compact ? 'h-4 w-4 text-[10px]' : 'h-5 w-5 text-[11px]')}
                  style={{ background: '#1a1625', color: 'white' }}
                >
                  {team.seed}
                </span>
              )}
            </div>
            <p className="text-xs truncate" style={{ color: '#9ca3af' }}>
              {team.conference} · {team.region}
            </p>
          </div>
        </div>

        {/* Tier badge */}
        {!compact && (
          <span
            className={cn('shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', tierBadge.color)}
          >
            {tierBadge.label}
          </span>
        )}
      </div>

      {!compact && (
        <>
          {/* Key stats row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center rounded-lg py-2" style={{ background: '#faf7f0', border: '1px solid #ede5d0' }}>
              <p className="text-xs mb-0.5" style={{ color: '#9ca3af' }}>adjEM</p>
              <p
                className="text-base font-bold"
                style={{ color: team.stats.adjEM > 25 ? '#16a34a' : team.stats.adjEM > 15 ? '#2563eb' : '#a0832a' }}
              >
                {team.stats.adjEM.toFixed(1)}
              </p>
            </div>
            <div className="text-center rounded-lg py-2" style={{ background: '#faf7f0', border: '1px solid #ede5d0' }}>
              <p className="text-xs mb-0.5" style={{ color: '#9ca3af' }}>adjOE</p>
              <p className="text-base font-bold" style={{ color: '#2563eb' }}>{team.stats.adjOE.toFixed(1)}</p>
            </div>
            <div className="text-center rounded-lg py-2" style={{ background: '#faf7f0', border: '1px solid #ede5d0' }}>
              <p className="text-xs mb-0.5" style={{ color: '#9ca3af' }}>Record</p>
              <p
                className="text-base font-bold"
                style={{ color: (team.winsTotal ?? 0) / Math.max(1, (team.winsTotal ?? 0) + (team.lossesTotal ?? 0)) > 0.7 ? '#16a34a' : '#a0832a' }}
              >
                {record ?? '—'}
              </p>
            </div>
          </div>

          {/* Star player row */}
          {starPlayer && (
            <div
              className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: '#faf7f0', border: '1px solid #ede5d0' }}
            >
              <div className="flex-1 min-w-0">
                <span className="text-xs mr-1.5">⭐</span>
                <span className="text-xs font-semibold truncate" style={{ color: '#1a1625' }}>{starPlayer.name}</span>
                {starPlayer.position && (
                  <span className="ml-1.5 text-[10px]" style={{ color: '#9ca3af' }}>{starPlayer.position}</span>
                )}
                {starPlayer.injuryStatus && (
                  <span className={cn(
                    'ml-1.5 inline-flex items-center rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                    starPlayer.injuryStatus === 'Out'
                      ? 'bg-red-100 text-red-600 border border-red-200'
                      : starPlayer.injuryStatus === 'Doubtful'
                      ? 'bg-orange-100 text-orange-600 border border-orange-200'
                      : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  )}>
                    {starPlayer.injuryStatus === 'Day-To-Day' ? 'DTD' : starPlayer.injuryStatus}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 text-[11px] tabular-nums">
                <span
                  className="font-bold"
                  style={{
                    color: starPlayer.injuryStatus === 'Out' ? '#dc2626' : '#a0832a',
                    textDecoration: starPlayer.injuryStatus === 'Out' ? 'line-through' : 'none',
                  }}
                >
                  {starPlayer.ppg.toFixed(1)} ppg
                </span>
                {starPlayer.rpg != null && starPlayer.rpg > 0 && (
                  <span style={{ color: '#2563eb' }}>{starPlayer.rpg.toFixed(1)} rpg</span>
                )}
                {starPlayer.apg != null && starPlayer.apg > 0 && (
                  <span style={{ color: '#7c3aed' }}>{starPlayer.apg.toFixed(1)} apg</span>
                )}
              </div>
            </div>
          )}

          {/* Injury report */}
          {team.injuredPlayers && team.injuredPlayers.length > 0 && (
            <div
              className="mb-3 rounded-lg px-3 py-2"
              style={{ background: '#fff5f5', border: '1px solid #fecaca' }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#dc2626' }}>
                🏥 Injury Report
              </p>
              <div className="space-y-1">
                {team.injuredPlayers.slice(0, 3).map(inj => (
                  <div key={inj.name} className="flex items-center justify-between gap-2">
                    <span className="text-xs truncate" style={{ color: '#374151' }}>{inj.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px]" style={{ color: '#9ca3af' }}>{inj.injury}</span>
                      <span className={cn(
                        'inline-flex items-center rounded px-1 py-0.5 text-[9px] font-bold uppercase',
                        inj.status === 'Out' ? 'bg-red-100 text-red-600'
                          : inj.status === 'Doubtful' ? 'bg-orange-100 text-orange-600'
                          : 'bg-yellow-100 text-yellow-700'
                      )}>
                        {inj.status === 'Day-To-Day' ? 'DTD' : inj.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Title profile + upset vulnerability */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" style={{ color: '#a0832a' }} />
              <span className="text-xs" style={{ color: '#9ca3af' }}>Title match:</span>
              <span className="text-xs font-semibold" style={{ color: '#a0832a' }}>{team.titleProfileScore}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" style={{ color: '#2563eb' }} />
              <span className="text-xs" style={{ color: '#9ca3af' }}>Upset vuln:</span>
              <span
                className="text-xs font-semibold"
                style={{ color: team.upsetVulnerability > 60 ? '#dc2626' : team.upsetVulnerability > 40 ? '#ea580c' : '#16a34a' }}
              >
                {team.upsetVulnerability}%
              </span>
            </div>
          </div>

          {/* Win% + upset alert */}
          <div className="flex items-center justify-between">
            {hasRecord ? (
              <div className="flex items-center gap-1.5">
                <Zap className="h-3 w-3" style={{ color: '#9ca3af' }} />
                <span className="text-xs" style={{ color: '#9ca3af' }}>Win%:</span>
                <span
                  className="text-xs font-medium"
                  style={{ color: (team.winsTotal! / (team.winsTotal! + team.lossesTotal!)) > 0.7 ? '#16a34a' : '#a0832a' }}
                >
                  {Math.round((team.winsTotal! / (team.winsTotal! + team.lossesTotal!)) * 100)}%
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Zap className="h-3 w-3" style={{ color: '#9ca3af' }} />
                <span
                  className="text-xs font-medium"
                  style={{ color: streakType === 'W' ? '#16a34a' : '#dc2626' }}
                >
                  {streakType}{streakLength} streak
                </span>
              </div>
            )}
            {team.upsetVulnerability > 50 && (
              <UpsetAlertBadge tier={team.upsetVulnerability > 70 ? 'high' : 'medium'} />
            )}
          </div>
        </>
      )}

      {compact && logoUrl && (
        <p className="text-xs truncate mt-0.5" style={{ color: '#9ca3af' }}>{team.conference}</p>
      )}
    </div>
  )

  if (showLink) {
    return (
      <Link href={`/teams/${team.slug}`} className="block hover:opacity-95 transition-opacity">
        {card}
      </Link>
    )
  }

  return card
}
