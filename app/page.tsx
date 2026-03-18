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

  const upsetAlerts = ALL_TEAMS
    .filter(t => !t.isFirstFour && t.seed >= 5 && t.seed <= 12 && t.upsetVulnerability > 50)
    .sort((a, b) => b.upsetVulnerability - a.upsetVulnerability)
    .slice(0, 4)

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
      <div className="mb-10">
        {/* Ornamental divider */}
        <div className="flex items-center gap-3 mb-6" style={{ color: '#a0832a' }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #a0832a40)' }} />
          <span style={{ fontSize: 12, letterSpacing: 4, fontWeight: 600, textTransform: 'uppercase' }}>2026 NCAA Tournament</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, #a0832a40)' }} />
        </div>

        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight"
          style={{ fontFamily: '"Playfair Display", serif', color: '#1a1625' }}
        >
          Madness<span style={{ color: '#a0832a' }}>Lab</span>
        </h1>
        <p className="mt-2 text-base" style={{ color: '#6b7280' }}>
          Real T-Rank efficiency data · Monte Carlo simulations · Advanced analytics
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
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: '"Playfair Display", serif', color: '#1a1625' }}
            >
              Strongest Title Contenders
            </h2>
            <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>Ranked by historical champion profile match score</p>
          </div>
          <Link href="/teams" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: '#2563eb' }}>
            All teams →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topContenders.map(team => (
            <TeamProfileCard key={team.id} team={team} />
          ))}
        </div>
      </section>

      {/* Upset alerts */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: '"Playfair Display", serif', color: '#1a1625' }}
            >
              Upset Alerts
            </h2>
            <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>Favorites showing the most dangerous vulnerabilities</p>
          </div>
          <Link href="/trends" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: '#2563eb' }}>
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
              <div
                key={team.id}
                className="rounded-xl p-4"
                style={{ background: 'white', border: '1px solid #fecaca' }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: '#dc2626' }}>#{team.seed}</span>
                      <span
                        className="font-semibold"
                        style={{ color: '#1a1625', fontFamily: '"Playfair Display", serif' }}
                      >
                        {team.name}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{team.conference} · {team.region} Region</p>
                  </div>
                  <UpsetAlertBadge tier={team.upsetVulnerability > 70 ? 'high' : 'medium'} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded py-1.5" style={{ background: '#faf7f0', border: '1px solid #ede5d0' }}>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>adjEM</p>
                    <p className="text-sm font-bold" style={{ color: '#a0832a' }}>{team.stats.adjEM.toFixed(1)}</p>
                  </div>
                  <div className="rounded py-1.5" style={{ background: '#faf7f0', border: '1px solid #ede5d0' }}>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>3P Rate</p>
                    <p className="text-sm font-bold" style={{ color: '#2563eb' }}>{Math.round(team.stats.threePointRate * 100)}%</p>
                  </div>
                  <div className="rounded py-1.5" style={{ background: '#faf7f0', border: '1px solid #ede5d0' }}>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>Vuln.</p>
                    <p className="text-sm font-bold" style={{ color: '#dc2626' }}>{team.upsetVulnerability}</p>
                  </div>
                </div>
                {pred && (
                  <p className="mt-2 text-xs" style={{ color: '#9ca3af' }}>
                    Win prob vs {opp?.name}:{' '}
                    <span
                      className="font-semibold"
                      style={{ color: pred.team1WinProb < 0.65 ? '#ea580c' : '#374151' }}
                    >
                      {Math.round(pred.team1WinProb * 100)}%
                    </span>
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Feature cards */}
      <section className="mb-12">
        <h2
          className="text-2xl font-bold mb-5"
          style={{ fontFamily: '"Playfair Display", serif', color: '#1a1625' }}
        >
          Explore MadnessLab
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/bracket"
            className="group rounded-xl p-5 transition-all hover:shadow-md hover:border-blue-200"
            style={{ background: 'white', border: '1px solid #e8e0d0' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: '#eff6ff' }}>
                <BarChart2 className="h-5 w-5" style={{ color: '#2563eb' }} />
              </div>
              <h3 className="font-semibold" style={{ color: '#1a1625', fontFamily: '"Playfair Display", serif' }}>Bracket Simulator</h3>
            </div>
            <p className="text-sm" style={{ color: '#6b7280' }}>Run Monte Carlo simulations to compute true championship odds for all 64 teams.</p>
            <p className="mt-3 text-sm font-medium" style={{ color: '#2563eb' }}>Run simulation →</p>
          </Link>

          <Link
            href="/trends"
            className="group rounded-xl p-5 transition-all hover:shadow-md"
            style={{ background: 'white', border: '1px solid #e8e0d0' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: '#f0fdf4' }}>
                <TrendingUp className="h-5 w-5" style={{ color: '#16a34a' }} />
              </div>
              <h3 className="font-semibold" style={{ color: '#1a1625', fontFamily: '"Playfair Display", serif' }}>Trends Explorer</h3>
            </div>
            <p className="text-sm" style={{ color: '#6b7280' }}>Seed upset history, champion archetypes, conference trends, and historical twin finder.</p>
            <p className="mt-3 text-sm font-medium" style={{ color: '#16a34a' }}>Explore trends →</p>
          </Link>

          <Link
            href="/teams"
            className="group rounded-xl p-5 transition-all hover:shadow-md"
            style={{ background: 'white', border: '1px solid #e8e0d0' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: '#faf5ff' }}>
                <Users className="h-5 w-5" style={{ color: '#7c3aed' }} />
              </div>
              <h3 className="font-semibold" style={{ color: '#1a1625', fontFamily: '"Playfair Display", serif' }}>Team Analytics</h3>
            </div>
            <p className="text-sm" style={{ color: '#6b7280' }}>Deep stats, historical twins, path difficulty, and AI-powered matchup analysis for all 68 teams.</p>
            <p className="mt-3 text-sm font-medium" style={{ color: '#7c3aed' }}>Browse teams →</p>
          </Link>
        </div>
      </section>

      {/* Data source info */}
      <div className="rounded-xl px-5 py-4" style={{ background: 'white', border: '1px solid #e8e0d0' }}>
        <p className="text-sm" style={{ color: '#6b7280' }}>
          <strong style={{ color: '#1a1625' }}>Data source:</strong> Adjusted efficiency stats (adjOE, adjDE, adjEM) are real 2025–26 season data from{' '}
          <span style={{ color: '#a0832a', fontWeight: 600 }}>Barttorvik / T-Rank</span>. Shooting stats, seed matchup priors, and tournament history sourced from public NCAA data.
        </p>
      </div>
    </div>
  )
}
