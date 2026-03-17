'use client'

import Link from 'next/link'
import { cn, formatOdds, programTierBadge, seedColor } from '@/lib/utils'
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

  // Top key player
  const starPlayer = team.keyPlayers?.[0] ?? null

  const card = (
    <div className={cn(
      'rounded-xl border border-gray-800 bg-gray-900/60 hover:border-gray-700 transition-all duration-200',
      compact ? 'p-3' : 'p-5',
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo or seed badge */}
          {logoUrl ? (
            <div className={cn(
              'shrink-0 flex items-center justify-center rounded-lg bg-white/5 border border-gray-800',
              compact ? 'h-8 w-8' : 'h-11 w-11'
            )}>
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
            <div className={cn(
              'shrink-0 flex items-center justify-center rounded font-bold text-sm',
              compact ? 'h-7 w-7' : 'h-9 w-9',
              'bg-gray-800 border border-gray-700',
              seedColor(team.seed)
            )}>
              {team.seed}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className={cn('font-bold text-white truncate', compact ? 'text-sm' : 'text-base')}>
                {team.name}
              </h3>
              {/* Seed badge when logo is shown */}
              {logoUrl && (
                <span className={cn(
                  'shrink-0 inline-flex items-center justify-center rounded text-xs font-bold bg-gray-800 border border-gray-700',
                  compact ? 'h-4 w-4 text-[10px]' : 'h-5 w-5 text-[11px]',
                  seedColor(team.seed)
                )}>
                  {team.seed}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {team.conference} · {team.region}
            </p>
          </div>
        </div>

        {/* Tier badge */}
        {!compact && (
          <span className={cn('shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', tierBadge.color)}>
            {tierBadge.label}
          </span>
        )}
      </div>

      {!compact && (
        <>
          {/* Key stats row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center rounded-lg bg-gray-800/60 py-2">
              <p className="text-xs text-gray-500 mb-0.5">adjEM</p>
              <p className={cn('text-base font-bold', team.stats.adjEM > 25 ? 'text-emerald-400' : team.stats.adjEM > 15 ? 'text-green-400' : 'text-yellow-400')}>
                {team.stats.adjEM.toFixed(1)}
              </p>
            </div>
            <div className="text-center rounded-lg bg-gray-800/60 py-2">
              <p className="text-xs text-gray-500 mb-0.5">adjOE</p>
              <p className="text-base font-bold text-blue-400">{team.stats.adjOE.toFixed(1)}</p>
            </div>
            <div className="text-center rounded-lg bg-gray-800/60 py-2">
              <p className="text-xs text-gray-500 mb-0.5">Record</p>
              <p className={cn('text-base font-bold', (team.winsTotal ?? 0) / Math.max(1, (team.winsTotal ?? 0) + (team.lossesTotal ?? 0)) > 0.7 ? 'text-emerald-400' : 'text-yellow-400')}>
                {record ?? '—'}
              </p>
            </div>
          </div>

          {/* Star player row */}
          {starPlayer && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-gray-800/60 bg-gray-800/30 px-3 py-2">
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-500 mr-1.5">⭐</span>
                <span className="text-xs font-semibold text-gray-200 truncate">{starPlayer.name}</span>
                {starPlayer.position && (
                  <span className="ml-1.5 text-[10px] text-gray-600">{starPlayer.position}</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 text-[11px] tabular-nums">
                <span className="text-orange-400 font-bold">{starPlayer.ppg.toFixed(1)} ppg</span>
                {starPlayer.rpg != null && starPlayer.rpg > 0 && (
                  <span className="text-blue-400">{starPlayer.rpg.toFixed(1)} rpg</span>
                )}
                {starPlayer.apg != null && starPlayer.apg > 0 && (
                  <span className="text-purple-400">{starPlayer.apg.toFixed(1)} apg</span>
                )}
              </div>
            </div>
          )}

          {/* Title profile + upset vuln */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs text-gray-400">Title match:</span>
              <span className="text-xs font-semibold text-orange-400">{team.titleProfileScore}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs text-gray-400">Upset vuln:</span>
              <span className={cn('text-xs font-semibold', team.upsetVulnerability > 60 ? 'text-red-400' : team.upsetVulnerability > 40 ? 'text-orange-400' : 'text-green-400')}>
                {team.upsetVulnerability}%
              </span>
            </div>
          </div>

          {/* Win% + upset alert */}
          <div className="flex items-center justify-between">
            {hasRecord ? (
              <div className="flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-400">Win%:</span>
                <span className={cn('text-xs font-medium', (team.winsTotal! / (team.winsTotal! + team.lossesTotal!)) > 0.7 ? 'text-emerald-400' : 'text-yellow-400')}>
                  {Math.round((team.winsTotal! / (team.winsTotal! + team.lossesTotal!)) * 100)}%
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-gray-500" />
                <span className={cn('text-xs font-medium', streakType === 'W' ? 'text-emerald-400' : 'text-red-400')}>
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
        <p className="text-xs text-gray-500 truncate mt-0.5">{team.conference}</p>
      )}
    </div>
  )

  if (showLink) {
    return (
      <Link href={`/teams/${team.slug}`} className="block hover:opacity-90 transition-opacity">
        {card}
      </Link>
    )
  }

  return card
}
