import { notFound } from 'next/navigation'
import { TEAMS_BY_SLUG, TEAMS_BY_ID, ALL_TEAMS } from '@/lib/mockData'
import { predictMatchup } from '@/lib/predictionEngine'
import { findBracketTwins } from '@/lib/historicalTwins'
import { getUpsetRateForMatchup } from '@/lib/historicalData'
import { generateFallbackExplanation } from '@/lib/aiExplainer'
import { TeamStatGrid } from '@/components/TeamStatGrid'
import { HistoricalTwinCard } from '@/components/HistoricalTwinCard'
import { UpsetAlertBadge } from '@/components/UpsetAlertBadge'
import { AIExplanationCard } from '@/components/AIExplanationCard'
import { MatchupCard } from '@/components/MatchupCard'
import {
  cn, seedColor, programTierBadge, winProbColor, formatOdds, getVolatilityLabel, getVolatilityColor
} from '@/lib/utils'
import { ArrowLeft, TrendingUp, Shield, Zap, GitMerge, Target } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: { teamSlug: string }
}

const R64_PAIRINGS: Record<number, number> = {
  1: 16, 2: 15, 3: 14, 4: 13, 5: 12, 6: 11, 7: 10, 8: 9,
  9: 8, 10: 7, 11: 6, 12: 5, 13: 4, 14: 3, 15: 2, 16: 1
}

export default function TeamPage({ params }: PageProps) {
  const team = TEAMS_BY_SLUG.get(params.teamSlug) ?? TEAMS_BY_ID.get(params.teamSlug)

  if (!team) {
    notFound()
  }

  const tierBadge = programTierBadge(team.programTier)
  const s = team.stats

  // First round matchup
  const opponentSeed = R64_PAIRINGS[team.seed]
  const opponent = ALL_TEAMS.find(t =>
    t.region === team.region && t.seed === opponentSeed && !t.isFirstFour
  )
  const prediction = opponent ? predictMatchup(team, opponent) : null
  const upsetRate = opponent ? getUpsetRateForMatchup(team.seed, opponent.seed) : 0

  // AI explanation
  const explanation = prediction && opponent ? generateFallbackExplanation({
    team1: team,
    team2: opponent,
    prediction,
    seedMatchupUpsetRate: upsetRate,
  }) : ''

  // Bracket twins — most similar teams in the 2026 field
  const twins = findBracketTwins(team, ALL_TEAMS, 3)

  // Path difficulty
  const regionTeams = ALL_TEAMS.filter(t => t.region === team.region && !t.isFirstFour && t.id !== team.id)
  const potentialLaterOpponents = regionTeams.filter(t => t.seed !== opponentSeed).slice(0, 4)
  const pathDifficulty = potentialLaterOpponents.reduce((sum, t) => sum + t.stats.adjEM, 0) / potentialLaterOpponents.length

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Back */}
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Teams
      </Link>

      {/* Team header */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Seed + name */}
          <div className="flex items-center gap-4 flex-1">
            <div className={cn(
              'flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-extrabold border-2',
              'bg-gray-800',
              seedColor(team.seed),
              team.seed <= 4 ? 'border-yellow-400/40' : team.seed <= 8 ? 'border-blue-400/30' : 'border-gray-700'
            )}>
              {team.seed}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white">{team.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-gray-400 text-sm">{team.conference}</span>
                <span className="text-gray-600">·</span>
                <span className="text-gray-400 text-sm">{team.region} Region</span>
                <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', tierBadge.color)}>
                  {tierBadge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="flex gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Title Profile</p>
              <p className="text-2xl font-bold text-orange-400">{team.titleProfileScore}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Off Eff</p>
              <p className="text-2xl font-bold text-blue-400">{s.adjOE.toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">adjEM</p>
              <p className={cn('text-2xl font-bold', s.adjEM > 25 ? 'text-emerald-400' : s.adjEM > 15 ? 'text-green-400' : 'text-yellow-400')}>
                {s.adjEM.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Score bars */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="flex items-center gap-1 text-orange-400"><TrendingUp className="h-3 w-3" />Title Match</span>
              <span className="text-orange-400">{team.titleProfileScore}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-800">
              <div className="h-2 rounded-full bg-orange-500" style={{ width: `${team.titleProfileScore}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={cn('flex items-center gap-1', team.upsetVulnerability > 60 ? 'text-red-400' : 'text-green-400')}>
                <Shield className="h-3 w-3" />Upset Vuln.
              </span>
              <span className={team.upsetVulnerability > 60 ? 'text-red-400' : 'text-green-400'}>{team.upsetVulnerability}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-800">
              <div
                className={cn('h-2 rounded-full', team.upsetVulnerability > 60 ? 'bg-red-500' : team.upsetVulnerability > 40 ? 'bg-orange-500' : 'bg-green-500')}
                style={{ width: `${team.upsetVulnerability}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Full stat grid */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-white mb-3">Season Statistics</h2>
        <p className="text-xs text-gray-500 mb-3">adjOE, adjDE, adjEM and shooting stats are real 2025–26 data from Barttorvik/T-Rank. Run <code className="text-orange-400/80">npm run data:espn</code> to refresh tempo and rebound stats from ESPN.</p>
        <TeamStatGrid team={team} />
      </section>

      {/* Season record */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-white mb-3">Season Record</h2>
        {(() => {
          const w = team.winsTotal ?? 0
          const l = team.lossesTotal ?? 0
          const g = w + l
          const winPct = g > 0 ? w / g : 0
          const hasRecord = g > 0
          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Season Record</p>
                <p className={cn('text-xl font-bold', hasRecord ? (winPct > 0.7 ? 'text-emerald-400' : 'text-yellow-400') : 'text-gray-500')}>
                  {hasRecord ? `${w}-${l}` : '—'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Win %</p>
                <p className={cn('text-xl font-bold', winPct > 0.75 ? 'text-emerald-400' : winPct > 0.6 ? 'text-yellow-400' : 'text-red-400')}>
                  {hasRecord ? `${Math.round(winPct * 100)}%` : '—'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Games Played</p>
                <p className="text-xl font-bold text-gray-300">{hasRecord ? g : '—'}</p>
              </div>
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Luck Factor</p>
                <p className={cn('text-xl font-bold', team.stats.luckFactor > 0.03 ? 'text-emerald-400' : team.stats.luckFactor < -0.03 ? 'text-red-400' : 'text-yellow-400')}>
                  {team.stats.luckFactor > 0 ? '+' : ''}{(team.stats.luckFactor * 100).toFixed(1)}
                </p>
              </div>
            </div>
          )
        })()}
      </section>

      {/* First round matchup */}
      {prediction && opponent && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">First Round Matchup</h2>
            <Link
              href={`/matchups/r64_${team.region}_${Math.min(team.seed, opponent.seed)}v${Math.max(team.seed, opponent.seed)}`}
              className="text-sm text-orange-400 hover:text-orange-300"
            >
              Full analysis →
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MatchupCard
              gameId={`r64_${team.region}_${Math.min(team.seed, opponent.seed)}v${Math.max(team.seed, opponent.seed)}`}
              team1={team}
              team2={opponent}
              prediction={prediction}
              round={1}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-2.5">
                <span className="text-sm text-gray-400">Confidence</span>
                <span className={cn('text-sm font-semibold', prediction.confidenceTier === 'coin_flip' ? 'text-orange-400' : prediction.confidenceTier === 'clear_favorite' ? 'text-emerald-400' : 'text-blue-400')}>
                  {prediction.confidenceTier.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-2.5">
                <span className="text-sm text-gray-400">Volatility</span>
                <span className={cn('text-sm font-semibold', getVolatilityColor(prediction.volatilityScore))}>
                  {getVolatilityLabel(prediction.volatilityScore)} ({prediction.volatilityScore}/100)
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-2.5">
                <span className="text-sm text-gray-400">Seed upset rate</span>
                <span className="text-sm font-semibold text-gray-300">
                  {Math.round(upsetRate * 100)}%
                </span>
              </div>
              {prediction.upsetAlertTier !== 'none' && (
                <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-2.5">
                  <span className="text-sm text-gray-400">Upset alert</span>
                  <UpsetAlertBadge tier={prediction.upsetAlertTier} />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* AI explanation */}
      {explanation && opponent && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-3">Matchup Analysis</h2>
          <AIExplanationCard
            gameId={`r64_${team.region}_${Math.min(team.seed, opponent?.seed ?? 0)}v${Math.max(team.seed, opponent?.seed ?? 0)}`}
            initialExplanation={explanation}
            source="fallback"
          />
        </section>
      )}

      {/* Bracket twins */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <GitMerge className="h-5 w-5 text-orange-400" />
          <h2 className="text-lg font-bold text-white">2026 Bracket Twins</h2>
          <span className="text-xs text-gray-500">Most statistically similar teams in this year&apos;s field</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {twins.map((twin, i) => (
            <HistoricalTwinCard key={twin.team.id} twin={twin} rank={i + 1} />
          ))}
        </div>
      </section>

      {/* Path difficulty */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Path Difficulty</h2>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Average potential opponent adjEM</span>
            <span className={cn('text-lg font-bold', pathDifficulty > 22 ? 'text-red-400' : pathDifficulty > 16 ? 'text-orange-400' : 'text-yellow-400')}>
              {pathDifficulty.toFixed(1)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-800 mb-3">
            <div
              className={cn('h-2 rounded-full', pathDifficulty > 22 ? 'bg-red-500' : pathDifficulty > 16 ? 'bg-orange-500' : 'bg-yellow-500')}
              style={{ width: `${Math.min(100, (pathDifficulty / 35) * 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {potentialLaterOpponents.slice(0, 4).map(opp => (
              <div key={opp.id} className="rounded bg-gray-800/60 p-2 text-center">
                <p className="text-xs text-gray-500">#{opp.seed} {opp.name}</p>
                <p className="text-sm font-semibold text-gray-300">{opp.stats.adjEM.toFixed(1)} EM</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export async function generateStaticParams() {
  return ALL_TEAMS.map(team => ({ teamSlug: team.slug }))
}
