export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { TEAMS_BY_SLUG, TEAMS_BY_ID, ALL_TEAMS } from '@/lib/mockData'
import { predictMatchup } from '@/lib/predictionEngine'
import { findHistoricalBracketTwins } from '@/lib/historicalTwins'
import { getUpsetRateForMatchup, HISTORICAL_TWIN_CANDIDATES } from '@/lib/historicalData'
import { generateFallbackExplanation } from '@/lib/aiExplainer'
import { TeamStatGrid } from '@/components/TeamStatGrid'
import { HistoricalMatchCard } from '@/components/HistoricalMatchCard'
import { UpsetAlertBadge } from '@/components/UpsetAlertBadge'
import { AIExplanationCard } from '@/components/AIExplanationCard'
import { MatchupCard } from '@/components/MatchupCard'
import { cn, programTierBadge, getVolatilityLabel, getVolatilityColor } from '@/lib/utils'
import { ArrowLeft, TrendingUp, Shield, Zap, GitMerge, Target } from 'lucide-react'
import Link from 'next/link'
import { TeamLogoImg } from '@/components/TeamLogoImg'

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

  const opponentSeed = R64_PAIRINGS[team.seed]
  const opponent = ALL_TEAMS.find(t =>
    t.region === team.region && t.seed === opponentSeed && !t.isFirstFour
  )
  const prediction = opponent ? predictMatchup(team, opponent) : null
  const upsetRate = opponent ? getUpsetRateForMatchup(team.seed, opponent.seed) : 0

  const explanation = prediction && opponent ? generateFallbackExplanation({
    team1: team,
    team2: opponent,
    prediction,
    seedMatchupUpsetRate: upsetRate,
  }) : ''

  const twins = findHistoricalBracketTwins(team, HISTORICAL_TWIN_CANDIDATES, 3)

  const regionTeams = ALL_TEAMS.filter(t => t.region === team.region && !t.isFirstFour && t.id !== team.id)
  const potentialLaterOpponents = regionTeams.filter(t => t.seed !== opponentSeed).slice(0, 4)
  const pathDifficulty = potentialLaterOpponents.reduce((sum, t) => sum + t.stats.adjEM, 0) / potentialLaterOpponents.length

  const seedAccent = team.seed <= 4 ? '#a0832a' : team.seed <= 8 ? '#2563eb' : '#8b7d6b'

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Back */}
      <Link
        href="/teams"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#8b7d6b', textDecoration: 'none', marginBottom: 24 }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} />
        All Teams
      </Link>

      {/* Team header */}
      <div style={{
        borderRadius: 16,
        border: '1px solid #e8e0d0',
        background: '#ffffff',
        padding: 24,
        marginBottom: 24,
      }}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Logo + seed + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
            <div style={{
              flexShrink: 0,
              display: 'flex',
              width: 64,
              height: 64,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              border: `2px solid ${seedAccent}40`,
              background: team.espnId ? 'transparent' : '#f0e8d0',
            }}>
              {team.espnId ? (
                <TeamLogoImg espnId={team.espnId} name={team.name} size={52} fallbackSeed={team.seed} />
              ) : (
                <span style={{ fontSize: 24, fontWeight: 800, color: seedAccent }}>{team.seed}</span>
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#1a1625',
                  fontFamily: '"Playfair Display", Georgia, serif',
                }}>
                  {team.name}
                </h1>
                <span style={{
                  display: 'inline-flex',
                  width: 28,
                  height: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  background: '#f0e8d0',
                  border: '1px solid #e8e0d0',
                  fontSize: 13,
                  fontWeight: 700,
                  color: seedAccent,
                }}>
                  {team.seed}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 13, color: '#8b7d6b' }}>{team.conference}</span>
                <span style={{ color: '#e8e0d0' }}>·</span>
                <span style={{ fontSize: 13, color: '#8b7d6b' }}>{team.region} Region</span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: 20,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  background: '#f0e8d0',
                  color: '#a0832a',
                  border: '1px solid #e8d5a3',
                }}>
                  {tierBadge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Key scores */}
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#8b7d6b', marginBottom: 4 }}>Title Profile</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#b45309', fontFamily: '"Playfair Display", Georgia, serif' }}>
                {team.titleProfileScore}%
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#8b7d6b', marginBottom: 4 }}>Off Eff</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#2563eb', fontFamily: '"Playfair Display", Georgia, serif' }}>
                {s.adjOE.toFixed(1)}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#8b7d6b', marginBottom: 4 }}>adjEM</p>
              <p style={{
                fontSize: 24,
                fontWeight: 700,
                fontFamily: '"Playfair Display", Georgia, serif',
                color: s.adjEM > 25 ? '#16a34a' : s.adjEM > 15 ? '#15803d' : '#a0832a',
              }}>
                {s.adjEM.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Score bars */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#b45309' }}>
                <TrendingUp style={{ width: 12, height: 12 }} />Title Match
              </span>
              <span style={{ color: '#b45309', fontWeight: 600 }}>{team.titleProfileScore}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: '#f0e8d0' }}>
              <div style={{ height: 8, borderRadius: 4, background: '#b45309', width: `${team.titleProfileScore}%` }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                color: team.upsetVulnerability > 60 ? '#dc2626' : '#16a34a',
              }}>
                <Shield style={{ width: 12, height: 12 }} />Upset Vuln.
              </span>
              <span style={{
                fontWeight: 600,
                color: team.upsetVulnerability > 60 ? '#dc2626' : '#16a34a',
              }}>
                {team.upsetVulnerability}%
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: '#f0e8d0' }}>
              <div style={{
                height: 8, borderRadius: 4, width: `${team.upsetVulnerability}%`,
                background: team.upsetVulnerability > 60 ? '#dc2626' : team.upsetVulnerability > 40 ? '#f97316' : '#16a34a',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Key Players */}
      {team.keyPlayers && team.keyPlayers.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif', marginBottom: 12 }}>
            Key Players
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {team.keyPlayers.map(player => (
              <div key={player.name} style={{
                borderRadius: 12,
                border: '1px solid #e8e0d0',
                background: '#ffffff',
                padding: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1625' }}>{player.name}</p>
                    <p style={{ fontSize: 11, color: '#8b7d6b' }}>{player.year} · {player.position}</p>
                  </div>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 20,
                    background: '#f0e8d0',
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#a0832a',
                  }}>
                    {player.position}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2" style={{ marginTop: 12 }}>
                  {[
                    { label: 'PPG', value: player.ppg.toFixed(1) },
                    { label: 'RPG', value: player.rpg.toFixed(1) },
                    { label: 'APG', value: player.apg.toFixed(1) },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      borderRadius: 6,
                      background: '#f5f0e6',
                      padding: '6px 4px',
                      textAlign: 'center',
                    }}>
                      <p style={{ fontSize: 10, color: '#8b7d6b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1625' }}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Full stat grid */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif', marginBottom: 8 }}>
          Season Statistics
        </h2>
        <p style={{ fontSize: 12, color: '#8b7d6b', marginBottom: 12 }}>
          adjOE, adjDE, adjEM and shooting stats are real 2025–26 data from Barttorvik/T-Rank.
        </p>
        <TeamStatGrid team={team} />
      </section>

      {/* Season record */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif', marginBottom: 12 }}>
          Season Record
        </h2>
        {(() => {
          const w = team.winsTotal ?? 0
          const l = team.lossesTotal ?? 0
          const g = w + l
          const winPct = g > 0 ? w / g : 0
          const hasRecord = g > 0
          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: 'Season Record',
                  value: hasRecord ? `${w}-${l}` : '—',
                  color: hasRecord ? (winPct > 0.7 ? '#16a34a' : '#a0832a') : '#8b7d6b',
                },
                {
                  label: 'Win %',
                  value: hasRecord ? `${Math.round(winPct * 100)}%` : '—',
                  color: winPct > 0.75 ? '#16a34a' : winPct > 0.6 ? '#a0832a' : '#dc2626',
                },
                {
                  label: 'Games Played',
                  value: hasRecord ? g : '—',
                  color: '#1a1625',
                },
                {
                  label: 'Luck Factor',
                  value: team.stats.luckFactor > 0 ? `+${team.stats.luckFactor.toFixed(3)}` : team.stats.luckFactor.toFixed(3),
                  color: team.stats.luckFactor > 0.03 ? '#b45309' : team.stats.luckFactor < -0.03 ? '#16a34a' : '#a0832a',
                },
              ].map(stat => (
                <div key={stat.label} style={{
                  borderRadius: 8,
                  border: '1px solid #e8e0d0',
                  background: '#ffffff',
                  padding: 12,
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 11, color: '#8b7d6b', marginBottom: 4 }}>{stat.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: stat.color, fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          )
        })()}
      </section>

      {/* First round matchup */}
      {prediction && opponent && (
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif' }}>
              First Round Matchup
            </h2>
            <Link
              href={`/matchups/r64_${team.region}_${Math.min(team.seed, opponent.seed)}v${Math.max(team.seed, opponent.seed)}`}
              style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                {
                  label: 'Confidence',
                  value: prediction.confidenceTier.replace('_', ' '),
                  color: prediction.confidenceTier === 'coin_flip' ? '#b45309' : prediction.confidenceTier === 'clear_favorite' ? '#16a34a' : '#2563eb',
                },
                {
                  label: 'Volatility',
                  value: `${getVolatilityLabel(prediction.volatilityScore)} (${prediction.volatilityScore}/100)`,
                  color: prediction.volatilityScore > 60 ? '#dc2626' : prediction.volatilityScore > 40 ? '#b45309' : '#16a34a',
                },
                {
                  label: 'Seed upset rate',
                  value: `${Math.round(upsetRate * 100)}%`,
                  color: '#4a4560',
                },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 8,
                  border: '1px solid #e8e0d0',
                  background: '#ffffff',
                  padding: '10px 16px',
                }}>
                  <span style={{ fontSize: 13, color: '#4a4560' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: item.color, textTransform: 'capitalize' }}>
                    {item.value}
                  </span>
                </div>
              ))}
              {prediction.upsetAlertTier !== 'none' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 8,
                  border: '1px solid #fca5a5',
                  background: '#fef2f2',
                  padding: '10px 16px',
                }}>
                  <span style={{ fontSize: 13, color: '#4a4560' }}>Upset alert</span>
                  <UpsetAlertBadge tier={prediction.upsetAlertTier} />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* AI explanation */}
      {explanation && opponent && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif', marginBottom: 12 }}>
            Matchup Analysis
          </h2>
          <AIExplanationCard
            gameId={`r64_${team.region}_${Math.min(team.seed, opponent?.seed ?? 0)}v${Math.max(team.seed, opponent?.seed ?? 0)}`}
            initialExplanation={explanation}
            source="fallback"
          />
        </section>
      )}

      {/* Bracket twins */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <GitMerge style={{ width: 18, height: 18, color: '#a0832a' }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif' }}>
            Historical Twins
          </h2>
          <span style={{ fontSize: 12, color: '#8b7d6b' }}>Most statistically similar past tournament teams</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {twins.map((match, i) => (
            <HistoricalMatchCard key={match.candidate.id} match={match} rank={i + 1} />
          ))}
        </div>
      </section>

      {/* Path difficulty */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Target style={{ width: 18, height: 18, color: '#2563eb' }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif' }}>
            Path Difficulty
          </h2>
        </div>
        <div style={{
          borderRadius: 12,
          border: '1px solid #e8e0d0',
          background: '#ffffff',
          padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#4a4560' }}>Average potential opponent adjEM</span>
            <span style={{
              fontSize: 20,
              fontWeight: 700,
              fontFamily: '"Playfair Display", Georgia, serif',
              color: pathDifficulty > 22 ? '#dc2626' : pathDifficulty > 16 ? '#b45309' : '#a0832a',
            }}>
              {pathDifficulty.toFixed(1)}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: '#f0e8d0', marginBottom: 12 }}>
            <div style={{
              height: 8,
              borderRadius: 4,
              width: `${Math.min(100, (pathDifficulty / 35) * 100)}%`,
              background: pathDifficulty > 22 ? '#dc2626' : pathDifficulty > 16 ? '#b45309' : '#a0832a',
            }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {potentialLaterOpponents.slice(0, 4).map(opp => (
              <div key={opp.id} style={{
                borderRadius: 6,
                background: '#f5f0e6',
                padding: '8px 6px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 11, color: '#8b7d6b' }}>#{opp.seed} {opp.name}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1625' }}>{opp.stats.adjEM.toFixed(1)} EM</p>
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
