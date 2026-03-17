import {
  TrendChartCard, SeedUpsetRatesChart, ChampionAdjEMChart, ConferenceChampionshipChart
} from '@/components/TrendChartCard'
import { HistoricalTwinCard } from '@/components/HistoricalTwinCard'
import { MetricCard } from '@/components/MetricCard'
import { HISTORICAL_CHAMPIONS, ARCHETYPE_PERFORMANCES, CONFERENCE_TOURNAMENT_STATS } from '@/lib/historicalData'
import { ALL_TEAMS } from '@/lib/mockData'
import { findBracketTwins } from '@/lib/historicalTwins'
import { cn } from '@/lib/utils'
import { TrendingUp, Trophy, Users, BarChart2, GitMerge } from 'lucide-react'

export const metadata = {
  title: 'Trends Explorer — MadnessLab',
  description: 'Historical NCAA Tournament trends: seed upset rates, champion profiles, conference performance, and archetype analysis.',
}

export default function TrendsPage() {
  // Find bracket twins for the top 2026 contenders (by adjEM)
  const topTeams = [...ALL_TEAMS]
    .filter(t => !t.isFirstFour)
    .sort((a, b) => b.stats.adjEM - a.stats.adjEM)
    .slice(0, 3)
  const twinSpotlights = topTeams.map(team => ({
    team,
    twins: findBracketTwins(team, ALL_TEAMS, 2),
  }))

  const recentChampion = HISTORICAL_CHAMPIONS[0]

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20">
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Trends Explorer</h1>
        </div>
        <p className="text-gray-400">
          Historical NCAA Tournament patterns from 1985–2025. Upset frequencies, champion profiles, conference analysis, and team archetype performance.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <MetricCard label="1-Seed Title Rate" value="49.4%" subValue="Most common champion seed" accent="orange" icon={<Trophy className="h-5 w-5" />} />
        <MetricCard label="12-Seed Upset Rate" value="36%" subValue="vs 5-seed in R64" accent="red" icon={<BarChart2 className="h-5 w-5" />} />
        <MetricCard label="8v9 Toss-Up" value="47.5%" subValue="9-seed win rate" accent="purple" icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Avg Champ adjEM" value="29.5" subValue="2012-2025 average" accent="blue" icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      {/* Seed upset rates */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Seed Matchup Upset Rates (1985-2025)</h2>
        <TrendChartCard
          title="R64 Upset Frequency by Seed Matchup"
          subtitle="Lower seed (underdog) win percentage — orange = danger zone"
        >
          <SeedUpsetRatesChart />
        </TrendChartCard>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { matchup: '5 vs 12', rate: '36%', note: 'Most popular upset pick — statistically justified', color: 'orange' },
            { matchup: '8 vs 9', rate: '47.5%', note: 'Pure coin flip. Bracket analytics barely help here', color: 'purple' },
            { matchup: '1 vs 16', rate: '1.25%', note: 'Two upsets in 40 years — UMBC (2018), FDU (2023)', color: 'green' },
          ].map(item => (
            <div key={item.matchup} className={cn(
              'rounded-xl border p-4',
              item.color === 'orange' ? 'border-orange-500/20 bg-orange-500/5' :
              item.color === 'purple' ? 'border-purple-500/20 bg-purple-500/5' :
              'border-green-500/20 bg-green-500/5'
            )}>
              <p className={cn(
                'text-lg font-bold',
                item.color === 'orange' ? 'text-orange-400' : item.color === 'purple' ? 'text-purple-400' : 'text-green-400'
              )}>
                {item.matchup} → {item.rate}
              </p>
              <p className="text-xs text-gray-400 mt-1">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Champion profile */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Champion adjEM Trend (2012-2025)</h2>
        <TrendChartCard
          title="National Champion Efficiency Margin"
          subtitle="Adjusted efficiency margin of each year's champion — most winners are top-5 nationally"
        >
          <ChampionAdjEMChart />
        </TrendChartCard>

        <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h3 className="font-semibold text-white mb-3">What champions look like</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {[
              { label: 'Avg adjEM', value: '29.5+', desc: 'Elite efficiency margin' },
              { label: 'adjDE', value: '< 92', desc: 'Top-20 national defense' },
              { label: 'Tempo', value: '64-74', desc: 'Controlled to moderate pace' },
              { label: 'Seed', value: '1 (49%)', desc: '1-seeds win half the time' },
            ].map(item => (
              <div key={item.label} className="rounded-lg border border-gray-800 p-3">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-base font-bold text-orange-400">{item.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conference performance */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Conference Championship Performance (2012-2025)</h2>
        <TrendChartCard
          title="Titles by Conference"
          subtitle="Number of national championships won per conference — 2012 to 2025"
        >
          <ConferenceChampionshipChart />
        </TrendChartCard>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500">
                <th className="text-left py-2 px-3">Conference</th>
                <th className="text-right py-2 px-3">Avg Teams</th>
                <th className="text-right py-2 px-3">Final Fours</th>
                <th className="text-right py-2 px-3">Titles</th>
                <th className="text-right py-2 px-3">R64 Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {CONFERENCE_TOURNAMENT_STATS.sort((a, b) => b.championships - a.championships).map(c => (
                <tr key={c.conference} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-2.5 px-3 font-medium text-gray-200">{c.conference}</td>
                  <td className="py-2.5 px-3 text-right text-gray-400">{c.avgTeamsInTournament.toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-right text-purple-400">{c.finalFourAppearances}</td>
                  <td className="py-2.5 px-3 text-right text-yellow-400 font-semibold">{c.championships}</td>
                  <td className="py-2.5 px-3 text-right text-gray-300">{Math.round(c.winRateR64 * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Team archetypes */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Team Archetypes — Tournament Performance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ARCHETYPE_PERFORMANCES.map(arch => (
            <div key={arch.archetype} className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
              <h3 className="font-semibold text-white capitalize mb-1">
                {arch.archetype.replace(/-/g, ' ')}
              </h3>
              <p className="text-xs text-gray-500 mb-3">{arch.description}</p>

              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div className="rounded bg-gray-800/60 py-1.5">
                  <p className="text-xs text-gray-500">Avg Wins</p>
                  <p className="text-sm font-bold text-blue-400">{arch.avgRoundsWon.toFixed(1)}</p>
                </div>
                <div className="rounded bg-gray-800/60 py-1.5">
                  <p className="text-xs text-gray-500">F4 Rate</p>
                  <p className="text-sm font-bold text-purple-400">{Math.round(arch.finalFourRate * 100)}%</p>
                </div>
                <div className="rounded bg-gray-800/60 py-1.5">
                  <p className="text-xs text-gray-500">Title Rate</p>
                  <p className="text-sm font-bold text-yellow-400">{Math.round(arch.titleRate * 100)}%</p>
                </div>
              </div>

              <div className="space-y-1 mb-3">
                <p className="text-xs text-emerald-400 font-medium">Strengths</p>
                {arch.strengths.map(s => (
                  <p key={s} className="text-xs text-gray-400">+ {s}</p>
                ))}
              </div>
              <div className="space-y-1 mb-3">
                <p className="text-xs text-red-400 font-medium">Weaknesses</p>
                {arch.weaknesses.map(w => (
                  <p key={w} className="text-xs text-gray-400">− {w}</p>
                ))}
              </div>

              <div className="border-t border-gray-800 pt-2">
                <p className="text-xs text-gray-600">Notable: {arch.notableTeams.slice(0, 2).join(', ')}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bracket Twins spotlight */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <GitMerge className="h-5 w-5 text-orange-400" />
          <h2 className="text-xl font-bold text-white">2026 Bracket Twins — Top Contenders</h2>
        </div>
        <p className="text-sm text-gray-400 mb-6">
          For each top 2026 contender, the most statistically similar teams in this year&apos;s field — their potential mirror matchups.
        </p>

        {twinSpotlights.map(({ team, twins }) => (
          <div key={team.id} className="mb-8">
            <h3 className="font-semibold text-white mb-3">
              <span className="text-orange-400">#{team.seed}</span> {team.name} — Bracket Twins
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {twins.map((twin, i) => (
                <HistoricalTwinCard key={twin.team.id} twin={twin} rank={i + 1} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
