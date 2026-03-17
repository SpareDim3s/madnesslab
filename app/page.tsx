export const dynamic = 'force-dynamic'

import { MetricCard } from '@/components/MetricCard'
import { TeamProfileCard } from '@/components/TeamProfileCard'
import { UpsetAlertBadge } from '@/components/UpsetAlertBadge'
import { getTopContenders, ALL_TEAMS } from '@/lib/mockData'
import { predictMatchup } from '@/lib/predictionEngine'
import { Trophy, AlertTriangle, Zap, TrendingUp, BarChart2, Users } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const topContenders = getTopContenders(6)

  // Top upset alerts: highest-seeded teams with high upset vulnerability
  const upsetAlerts = ALL_TEAMS
    .filter(t => !t.isFirstFour && t.seed >= 5 && t.seed <= 12 && t.upsetVulnerability > 50)
    .sort((a, b) => b.upsetVulnerability - a.upsetVulnerability)
    .slice(0, 4)

  // Most volatile matchup: find matchup with highest volatility
  const r64Pairings: [number, number][] = [[5,12],[6,11],[7,10],[8,9],[4,13]]
  let mostVolatile: { team1: typeof ALL_TEAMS[0]; team2: typeof ALL_TEAMS[0]; score: number } | null = null

  for (const region of ['South', 'East', 'West', 'Midwest'] as const) {
    const regionTeams = ALL_TEAMS.filter(t => t.region === region && !t.isFirstFour)
    for (const [s1, s2] of r64Pairings) {
      const t1 = regionTeams.find(t => t.seed === s1)
      const t2 = regionTeams.find(t => t.seed === s2)
      if (!t1 || !t2) continue
      const pred = predictMatchup(t1, t2)
      if (!mostVolatile || pred.volatilityScore > mostVolatile.score) {
        mostVolatile = { team1: t1, team2: t2, score: pred.volatilityScore }
      }
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          MadnessLab <span className="text-orange-400">2026</span>
        </h1>
        <p className="mt-2 text-gray-400 text-base">
          Real T-Rank efficiency data · Monte Carlo simulations · 2026 NCAA Tournament
        </p>
      </div>

      {/* Headline metrics */}
      <section className="mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <MetricCard
            label="Top Title Contender"
            value={topContenders[0]?.name ?? '—'}
            subValue={`${topContenders[0]?.titleProfileScore}% title profile match`}
            icon={<Trophy className="h-6 w-6" />}
            accent="orange"
          />
          <MetricCard
            label="Top Upset Alert"
            value={upsetAlerts[0]?.name ?? '—'}
            subValue={`${upsetAlerts[0]?.seed ?? '?'}-seed · ${upsetAlerts[0]?.upsetVulnerability ?? 0}% vulnerability`}
            icon={<AlertTriangle className="h-6 w-6" />}
            accent="red"
          />
          <MetricCard
            label="Most Volatile Matchup"
            value={mostVolatile ? `${mostVolatile.team1.name} vs ${mostVolatile.team2.name}` : '—'}
            subValue={mostVolatile ? `Volatility: ${mostVolatile.score}/100` : ''}
            icon={<Zap className="h-6 w-6" />}
            accent="purple"
          />
        </div>
      </section>

      {/* Top title contenders */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Strongest Title Contenders</h2>
            <p className="text-sm text-gray-500 mt-0.5">Ranked by historical champion profile match score</p>
          </div>
          <Link href="/teams" className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
            All teams →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topContenders.map(team => (
            <TeamProfileCard key={team.id} team={team} />
          ))}
        </div>
      </section>

      {/* Top upset alerts */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Upset Alerts</h2>
            <p className="text-sm text-gray-500 mt-0.5">Favorites showing the most dangerous vulnerabilities</p>
          </div>
          <Link href="/trends" className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
            Historical trends →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {upsetAlerts.map(team => {
            const opp = ALL_TEAMS.find(t =>
              t.region === team.region &&
              !t.isFirstFour &&
              t.id !== team.id &&
              ((team.seed <= 8 && t.seed === 17 - team.seed) || (team.seed > 8 && t.seed === 17 - team.seed))
            )
            const pred = opp ? predictMatchup(team, opp) : null

            return (
              <div key={team.id} className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-red-400">#{team.seed}</span>
                      <span className="font-semibold text-white">{team.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{team.conference} · {team.region} Region</p>
                  </div>
                  <UpsetAlertBadge tier={team.upsetVulnerability > 70 ? 'high' : 'medium'} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded bg-gray-800/60 py-1.5">
                    <p className="text-xs text-gray-500">adjEM</p>
                    <p className="text-sm font-bold text-yellow-400">{team.stats.adjEM.toFixed(1)}</p>
                  </div>
                  <div className="rounded bg-gray-800/60 py-1.5">
                    <p className="text-xs text-gray-500">3P Rate</p>
                    <p className="text-sm font-bold text-orange-400">{Math.round(team.stats.threePointRate * 100)}%</p>
                  </div>
                  <div className="rounded bg-gray-800/60 py-1.5">
                    <p className="text-xs text-gray-500">Vuln.</p>
                    <p className="text-sm font-bold text-red-400">{team.upsetVulnerability}</p>
                  </div>
                </div>
                {pred && (
                  <p className="mt-2 text-xs text-gray-500">
                    Win prob vs {opp?.name}: <span className={pred.team1WinProb < 0.65 ? 'text-orange-400 font-semibold' : 'text-gray-300 font-semibold'}>{Math.round(pred.team1WinProb * 100)}%</span>
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Feature cards */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">Explore MadnessLab</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/bracket" className="group rounded-xl border border-orange-500/20 bg-orange-500/5 p-5 hover:border-orange-500/40 hover:bg-orange-500/10 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
                <BarChart2 className="h-5 w-5 text-orange-400" />
              </div>
              <h3 className="font-semibold text-white">Bracket Simulator</h3>
            </div>
            <p className="text-sm text-gray-400">Run Monte Carlo simulations to compute true championship odds for all 64 teams.</p>
            <p className="mt-3 text-sm text-orange-400 group-hover:text-orange-300">Run simulation →</p>
          </Link>

          <Link href="/trends" className="group rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white">Trends Explorer</h3>
            </div>
            <p className="text-sm text-gray-400">Seed upset history, champion archetypes, conference trends, and historical twin finder.</p>
            <p className="mt-3 text-sm text-blue-400 group-hover:text-blue-300">Explore trends →</p>
          </Link>

          <Link href="/teams" className="group rounded-xl border border-purple-500/20 bg-purple-500/5 p-5 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white">Team Analytics</h3>
            </div>
            <p className="text-sm text-gray-400">Deep stats, historical twins, path difficulty, and AI-powered matchup analysis for all 68 teams.</p>
            <p className="mt-3 text-sm text-purple-400 group-hover:text-purple-300">Browse teams →</p>
          </Link>
        </div>
      </section>

      {/* Data source info */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-800/30 px-5 py-4">
        <p className="text-sm text-gray-400">
          <strong className="text-gray-300">Data source:</strong> Adjusted efficiency stats (adjOE, adjDE, adjEM) are real 2025–26 season data from{' '}
          <span className="text-orange-400">Barttorvik / T-Rank</span>. Shooting stats, seed matchup priors, and tournament history sourced from public NCAA data.
        </p>
      </div>
    </div>
  )
}
