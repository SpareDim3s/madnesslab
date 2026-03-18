export const dynamic = 'force-dynamic'

import {
  TrendChartCard, SeedUpsetRatesChart, ChampionAdjEMChart, ConferenceChampionshipChart
} from '@/components/TrendChartCard'
import { HistoricalMatchCard } from '@/components/HistoricalMatchCard'
import { MetricCard } from '@/components/MetricCard'
import { HISTORICAL_CHAMPIONS, ARCHETYPE_PERFORMANCES, CONFERENCE_TOURNAMENT_STATS, HISTORICAL_TWIN_CANDIDATES } from '@/lib/historicalData'
import { ALL_TEAMS } from '@/lib/mockData'
import { findHistoricalBracketTwins } from '@/lib/historicalTwins'
import { TrendingUp, Trophy, Users, BarChart2, GitMerge } from 'lucide-react'

export const metadata = {
  title: 'Trends Explorer — MadnessLab',
  description: 'Historical NCAA Tournament trends: seed upset rates, champion profiles, conference performance, and archetype analysis.',
}

export default function TrendsPage() {
  const topTeams = [...ALL_TEAMS]
    .filter(t => !t.isFirstFour)
    .sort((a, b) => b.stats.adjEM - a.stats.adjEM)
    .slice(0, 3)
  const twinSpotlights = topTeams.map(team => ({
    team,
    twins: findHistoricalBracketTwins(team, HISTORICAL_TWIN_CANDIDATES, 2),
  }))

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            display: 'flex', width: 36, height: 36, alignItems: 'center',
            justifyContent: 'center', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe',
          }}>
            <TrendingUp style={{ width: 18, height: 18, color: '#2563eb' }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif' }}>
            Trends Explorer
          </h1>
        </div>
        <p style={{ fontSize: 14, color: '#8b7d6b' }}>
          Historical NCAA Tournament patterns from 1985–2025. Upset frequencies, champion profiles, conference analysis, and team archetype performance.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" style={{ marginBottom: 40 }}>
        <MetricCard label="1-Seed Title Rate" value="49.4%" subValue="Most common champion seed" accent="orange" icon={<Trophy className="h-5 w-5" />} />
        <MetricCard label="12-Seed Upset Rate" value="36%" subValue="vs 5-seed in R64" accent="red" icon={<BarChart2 className="h-5 w-5" />} />
        <MetricCard label="8v9 Toss-Up" value="47.5%" subValue="9-seed win rate" accent="purple" icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Avg Champ adjEM" value="29.5" subValue="2012-2025 average" accent="blue" icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      {/* Seed upset rates */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif', marginBottom: 16 }}>
          Seed Matchup Upset Rates (1985–2025)
        </h2>
        <TrendChartCard
          title="R64 Upset Frequency by Seed Matchup"
          subtitle="Lower seed (underdog) win percentage — amber = danger zone"
        >
          <SeedUpsetRatesChart />
        </TrendChartCard>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { matchup: '5 vs 12', rate: '36%', note: 'Most popular upset pick — statistically justified', bg: '#fffbeb', border: '#fde68a', color: '#b45309' },
            { matchup: '8 vs 9',  rate: '47.5%', note: 'Pure coin flip. Bracket analytics barely help here', bg: '#faf5ff', border: '#e9d5ff', color: '#7c3aed' },
            { matchup: '1 vs 16', rate: '1.25%', note: 'Two upsets in 40 years — UMBC (2018), FDU (2023)', bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a' },
          ].map(item => (
            <div key={item.matchup} style={{
              borderRadius: 10,
              border: `1px solid ${item.border}`,
              background: item.bg,
              padding: 16,
            }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: item.color, fontFamily: '"Playfair Display", Georgia, serif' }}>
                {item.matchup} → {item.rate}
              </p>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Champion profile */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif', marginBottom: 16 }}>
          Champion adjEM Trend (2012–2025)
        </h2>
        <TrendChartCard
          title="National Champion Efficiency Margin"
          subtitle="Adjusted efficiency margin of each year's champion — most winners are top-5 nationally"
        >
          <ChampionAdjEMChart />
        </TrendChartCard>

        <div style={{
          marginTop: 16,
          borderRadius: 12,
          border: '1px solid #e8e0d0',
          background: '#ffffff',
          padding: 20,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif', marginBottom: 12 }}>
            What champions look like
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Avg adjEM', value: '29.5+', desc: 'Elite efficiency margin' },
              { label: 'adjDE', value: '< 92', desc: 'Top-20 national defense' },
              { label: 'Tempo', value: '64-74', desc: 'Controlled to moderate pace' },
              { label: 'Seed', value: '1 (49%)', desc: '1-seeds win half the time' },
            ].map(item => (
              <div key={item.label} style={{
                borderRadius: 8,
                border: '1px solid #e8e0d0',
                background: '#fdfcf8',
                padding: 12,
              }}>
                <p style={{ fontSize: 11, color: '#8b7d6b' }}>{item.label}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#b45309', fontFamily: '"Playfair Display", Georgia, serif' }}>{item.value}</p>
                <p style={{ fontSize: 11, color: '#8b7d6b', marginTop: 2 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conference performance */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif', marginBottom: 16 }}>
          Conference Championship Performance (2012–2025)
        </h2>
        <TrendChartCard
          title="Titles by Conference"
          subtitle="Number of national championships won per conference — 2012 to 2025"
        >
          <ConferenceChampionshipChart />
        </TrendChartCard>

        <div style={{ marginTop: 16, overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e8e0d0' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#8b7d6b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Conference</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 11, color: '#8b7d6b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Avg Teams</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 11, color: '#8b7d6b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Final Fours</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 11, color: '#8b7d6b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Titles</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 11, color: '#8b7d6b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>R64 Win %</th>
              </tr>
            </thead>
            <tbody>
              {CONFERENCE_TOURNAMENT_STATS.sort((a, b) => b.championships - a.championships).map((c, i) => (
                <tr key={c.conference} style={{
                  borderBottom: '1px solid #f0e8d0',
                  background: i % 2 === 0 ? '#ffffff' : '#fdfcf8',
                }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500, color: '#1a1625' }}>{c.conference}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#4a4560' }}>{c.avgTeamsInTournament.toFixed(1)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#7c3aed', fontWeight: 600 }}>{c.finalFourAppearances}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#a0832a', fontWeight: 700 }}>{c.championships}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#4a4560' }}>{Math.round(c.winRateR64 * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Team archetypes */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif', marginBottom: 16 }}>
          Team Archetypes — Tournament Performance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ARCHETYPE_PERFORMANCES.map(arch => (
            <div key={arch.archetype} style={{
              borderRadius: 12,
              border: '1px solid #e8e0d0',
              background: '#ffffff',
              padding: 20,
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#1a1625',
                fontFamily: '"Playfair Display", Georgia, serif',
                textTransform: 'capitalize',
                marginBottom: 4,
              }}>
                {arch.archetype.replace(/-/g, ' ')}
              </h3>
              <p style={{ fontSize: 12, color: '#8b7d6b', marginBottom: 12 }}>{arch.description}</p>

              <div className="grid grid-cols-3 gap-2" style={{ marginBottom: 12, textAlign: 'center' }}>
                <div style={{ borderRadius: 6, background: '#eff6ff', padding: '6px 4px' }}>
                  <p style={{ fontSize: 10, color: '#8b7d6b' }}>Avg Wins</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>{arch.avgRoundsWon.toFixed(1)}</p>
                </div>
                <div style={{ borderRadius: 6, background: '#faf5ff', padding: '6px 4px' }}>
                  <p style={{ fontSize: 10, color: '#8b7d6b' }}>F4 Rate</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>{Math.round(arch.finalFourRate * 100)}%</p>
                </div>
                <div style={{ borderRadius: 6, background: '#fdf8ed', padding: '6px 4px' }}>
                  <p style={{ fontSize: 10, color: '#8b7d6b' }}>Title Rate</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#a0832a' }}>{Math.round(arch.titleRate * 100)}%</p>
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginBottom: 4 }}>Strengths</p>
                {arch.strengths.map(s => (
                  <p key={s} style={{ fontSize: 12, color: '#4a4560' }}>+ {s}</p>
                ))}
              </div>
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginBottom: 4 }}>Weaknesses</p>
                {arch.weaknesses.map(w => (
                  <p key={w} style={{ fontSize: 12, color: '#4a4560' }}>− {w}</p>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #e8e0d0', paddingTop: 8 }}>
                <p style={{ fontSize: 11, color: '#8b7d6b' }}>Notable: {arch.notableTeams.slice(0, 2).join(', ')}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bracket Twins spotlight */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <GitMerge style={{ width: 20, height: 20, color: '#a0832a' }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif' }}>
            2026 Bracket Twins — Top Contenders
          </h2>
        </div>
        <p style={{ fontSize: 14, color: '#8b7d6b', marginBottom: 24 }}>
          For each top 2026 contender, the most statistically similar past tournament teams — and how far they went.
        </p>

        {twinSpotlights.map(({ team, twins }) => (
          <div key={team.id} style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a1625', marginBottom: 12 }}>
              <span style={{ color: '#a0832a' }}>#{team.seed}</span> {team.name} — Historical Twins
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {twins.map((match, i) => (
                <HistoricalMatchCard key={match.candidate.id} match={match} rank={i + 1} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
