'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftRight, TrendingUp, Shield, Zap, ChevronDown, Trophy } from 'lucide-react'
import { predictMatchup } from '@/lib/predictionEngine'
import type { MockTeam } from '@/lib/mockData'

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  parchment: '#f5f0e6',
  navy:      '#1a1625',
  navyMuted: '#4a4560',
  gold:      '#a0832a',
  goldLight: '#c4a84a',
  goldSubtle:'#f0e8d0',
  border:    '#e8e0d0',
  blue:      '#2563eb',
  blueMuted: '#3b82f6',
  amber:     '#b45309',
  amberMuted:'#d97706',
  white:     '#ffffff',
  muted:     '#8b7d6b',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number) {
  return `${Math.round(n * 100)}%`
}

function TeamLogo({ team, size = 40 }: { team: MockTeam; size?: number }) {
  if (!team.espnId) {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: T.goldSubtle,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: size * 0.4,
          color: T.navy,
        }}
      >
        {team.seed}
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://a.espncdn.com/i/teamlogos/ncaa/500/${team.espnId}.png`}
      alt={`${team.name} logo`}
      width={size}
      height={size}
      className="object-contain"
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement
        img.style.display = 'none'
      }}
    />
  )
}

// ─── Stat bar (side by side) ──────────────────────────────────────────────────

function StatBar({
  label,
  v1,
  v2,
  higherIsBetter = true,
  format = (n: number) => n.toFixed(1),
}: {
  label: string
  v1: number
  v2: number
  higherIsBetter?: boolean
  format?: (n: number) => string
}) {
  const max = Math.max(Math.abs(v1), Math.abs(v2), 1)
  const bar1 = Math.min(100, (Math.abs(v1) / max) * 100)
  const bar2 = Math.min(100, (Math.abs(v2) / max) * 100)

  const t1Wins = higherIsBetter ? v1 > v2 : v1 < v2
  const t2Wins = higherIsBetter ? v2 > v1 : v2 < v1

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 0',
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      {/* Team 1 bar (right-aligned) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        <span style={{
          fontSize: 13,
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 600,
          color: t1Wins ? T.navy : T.muted,
        }}>
          {format(v1)}
        </span>
        <div style={{
          width: 96,
          height: 8,
          borderRadius: 4,
          background: T.goldSubtle,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <div style={{
            height: 8,
            borderRadius: 4,
            background: t1Wins ? T.blue : T.border,
            width: `${bar1}%`,
          }} />
        </div>
      </div>

      {/* Label */}
      <span style={{
        fontSize: 11,
        color: T.muted,
        textAlign: 'center',
        width: 96,
        flexShrink: 0,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {label}
      </span>

      {/* Team 2 bar (left-aligned) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 96,
          height: 8,
          borderRadius: 4,
          background: T.goldSubtle,
          overflow: 'hidden',
        }}>
          <div style={{
            height: 8,
            borderRadius: 4,
            background: t2Wins ? T.amber : T.border,
            width: `${bar2}%`,
          }} />
        </div>
        <span style={{
          fontSize: 13,
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 600,
          color: t2Wins ? T.navy : T.muted,
        }}>
          {format(v2)}
        </span>
      </div>
    </div>
  )
}

// ─── Win probability bar ──────────────────────────────────────────────────────

function WinProbBar({
  team1,
  team2,
  prob1,
}: {
  team1: MockTeam
  team2: MockTeam
  prob1: number
}) {
  const p1 = Math.round(prob1 * 100)
  const p2 = 100 - p1

  const tier =
    p1 >= 80 ? 'Dominant favorite' :
    p1 >= 65 ? 'Clear favorite' :
    p1 >= 55 ? 'Slight edge' :
    p1 >= 45 ? 'Toss-up' :
    p1 >= 35 ? 'Slight edge' :
    p1 >= 20 ? 'Clear favorite' : 'Dominant favorite'

  return (
    <div style={{
      borderRadius: 16,
      border: `1px solid ${T.border}`,
      background: T.white,
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: T.gold,
        fontWeight: 600,
        marginBottom: 20,
      }}>
        Win Probability
      </div>

      {/* Teams */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <TeamLogo team={team1} size={52} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{team1.abbreviation ?? team1.name}</div>
          <div style={{
            fontSize: 36,
            fontWeight: 900,
            color: T.blue,
            fontFamily: '"Playfair Display", Georgia, serif',
            marginTop: 4,
          }}>
            {p1}%
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '0 16px' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: T.border }}>vs</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 4, fontStyle: 'italic' }}>{tier}</div>
        </div>

        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <TeamLogo team={team2} size={52} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{team2.abbreviation ?? team2.name}</div>
          <div style={{
            fontSize: 36,
            fontWeight: 900,
            color: T.amber,
            fontFamily: '"Playfair Display", Georgia, serif',
            marginTop: 4,
          }}>
            {p2}%
          </div>
        </div>
      </div>

      {/* Bar */}
      <div style={{ height: 12, borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
        <div
          style={{
            height: 12,
            background: T.blue,
            transition: 'width 0.5s ease',
            width: `${p1}%`,
          }}
        />
        <div
          style={{
            height: 12,
            background: T.amber,
            transition: 'width 0.5s ease',
            width: `${p2}%`,
          }}
        />
      </div>

      {/* Favorite label */}
      {p1 !== 50 && (
        <p style={{ marginTop: 12, fontSize: 12, color: T.muted }}>
          <span style={{ color: p1 > 50 ? T.blue : T.amber, fontWeight: 600 }}>
            {p1 > 50 ? team1.name : team2.name}
          </span>
          {' '}projected to win
          {(() => {
            const emDiff = Math.abs(team1.stats.adjEM - team2.stats.adjEM)
            const avgTempo = (team1.stats.tempo + team2.stats.tempo) / 2
            const spread = Math.round(emDiff * 0.45 * (avgTempo / 68) * 10) / 10
            return spread > 0.5 ? ` · by ${spread} pts` : ''
          })()}
        </p>
      )}
    </div>
  )
}

// ─── Deciding factors ─────────────────────────────────────────────────────────

function FactorsPanel({
  prediction,
  team1,
  team2,
}: {
  prediction: ReturnType<typeof predictMatchup>
  team1: MockTeam
  team2: MockTeam
}) {
  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${T.border}`,
      background: T.white,
      padding: 20,
    }}>
      <h3 style={{
        fontSize: 13,
        fontWeight: 700,
        color: T.navy,
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: '"Playfair Display", Georgia, serif',
      }}>
        <Zap style={{ width: 16, height: 16, color: T.gold }} />
        Matchup Factors
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {prediction.decidingFactors.map((factor, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: T.navyMuted }}>
            <span style={{ color: T.gold, flexShrink: 0, marginTop: 2 }}>→</span>
            {factor}
          </div>
        ))}
      </div>

      {prediction.layer2Adjustments.length > 0 && (
        <>
          <div style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: T.muted,
            marginBottom: 8,
          }}>
            Style Adjustments
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {prediction.layer2Adjustments.slice(0, 4).map((adj, i) => {
              const favoring = adj.favoringTeam === team1.id
                ? team1.abbreviation ?? team1.name
                : team2.abbreviation ?? team2.name
              const color = adj.favoringTeam === team1.id ? T.blue : T.amber
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: T.muted }}>{adj.label}</span>
                  <span style={{ fontWeight: 600, color }}>
                    +{adj.magnitude.toFixed(1)} {favoring}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {prediction.upsetAlertTier !== 'none' && (
        <div style={{
          marginTop: 16,
          borderRadius: 8,
          border: `1px solid #fca5a5`,
          background: '#fef2f2',
          padding: '8px 12px',
          fontSize: 12,
          color: '#dc2626',
        }}>
          ⚠️ {prediction.upsetAlertReasons[0]}
        </div>
      )}
    </div>
  )
}

// ─── Player comparison ────────────────────────────────────────────────────────

function PlayersPanel({ team1, team2 }: { team1: MockTeam; team2: MockTeam }) {
  const p1 = team1.keyPlayers ?? []
  const p2 = team2.keyPlayers ?? []

  if (p1.length === 0 && p2.length === 0) return null

  const maxRows = Math.max(p1.length, p2.length, 1)

  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${T.border}`,
      background: T.white,
      padding: 20,
    }}>
      <h3 style={{
        fontSize: 13,
        fontWeight: 700,
        color: T.navy,
        marginBottom: 16,
        fontFamily: '"Playfair Display", Georgia, serif',
      }}>
        Key Players
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Team 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {p1.slice(0, maxRows).map(p => (
            <div key={p.name} style={{
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              background: T.parchment,
              padding: '8px 12px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{p.name}</div>
              {p.position && <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>{p.position}</div>}
              <div style={{ display: 'flex', gap: 8, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ color: T.blue, fontWeight: 700 }}>{p.ppg.toFixed(1)} ppg</span>
                {p.rpg != null && p.rpg > 0 && <span style={{ color: T.gold }}>{p.rpg.toFixed(1)} rpg</span>}
                {p.apg != null && p.apg > 0 && <span style={{ color: T.amber }}>{p.apg.toFixed(1)} apg</span>}
              </div>
            </div>
          ))}
          {p1.length === 0 && (
            <div style={{ fontSize: 12, color: T.muted, fontStyle: 'italic', padding: '8px 0' }}>
              No player data for {team1.name}
            </div>
          )}
        </div>
        {/* Team 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {p2.slice(0, maxRows).map(p => (
            <div key={p.name} style={{
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              background: T.parchment,
              padding: '8px 12px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{p.name}</div>
              {p.position && <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>{p.position}</div>}
              <div style={{ display: 'flex', gap: 8, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ color: T.blue, fontWeight: 700 }}>{p.ppg.toFixed(1)} ppg</span>
                {p.rpg != null && p.rpg > 0 && <span style={{ color: T.gold }}>{p.rpg.toFixed(1)} rpg</span>}
                {p.apg != null && p.apg > 0 && <span style={{ color: T.amber }}>{p.apg.toFixed(1)} apg</span>}
              </div>
            </div>
          ))}
          {p2.length === 0 && (
            <div style={{ fontSize: 12, color: T.muted, fontStyle: 'italic', padding: '8px 0' }}>
              No player data for {team2.name}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Team selector ────────────────────────────────────────────────────────────

function TeamSelector({
  teams,
  value,
  onChange,
  label,
  accentColor,
}: {
  teams: MockTeam[]
  value: string
  onChange: (id: string) => void
  label: string
  accentColor: string
}) {
  const sorted = [...teams].sort((a, b) => {
    const regionOrder: Record<string, number> = { South: 0, East: 1, West: 2, Midwest: 3 }
    const rDiff = (regionOrder[a.region] ?? 0) - (regionOrder[b.region] ?? 0)
    return rDiff !== 0 ? rDiff : a.seed - b.seed
  })

  const selected = teams.find(t => t.id === value)

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={{
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 600,
        color: accentColor,
        display: 'block',
        marginBottom: 8,
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%',
            appearance: 'none',
            borderRadius: 10,
            border: `1px solid ${T.border}`,
            background: T.white,
            padding: '10px 36px 10px 14px',
            fontSize: 14,
            fontWeight: 500,
            color: T.navy,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {sorted.map(t => (
            <option key={t.id} value={t.id}>
              #{t.seed} {t.name} ({t.region})
            </option>
          ))}
        </select>
        <ChevronDown
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 16,
            height: 16,
            color: T.muted,
          }}
        />
      </div>
      {selected && (
        <div style={{
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 4px',
        }}>
          <TeamLogo team={selected} size={20} />
          <span style={{ fontSize: 12, color: T.muted }}>{selected.conference} · {selected.winsTotal}-{selected.lossesTotal}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: T.gold, fontWeight: 600 }}>
            adjEM {selected.stats.adjEM.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${T.border}`,
      background: T.white,
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: 14,
      fontWeight: 700,
      color: T.navy,
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontFamily: '"Playfair Display", Georgia, serif',
    }}>
      {icon}
      {children}
    </h3>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ComparePage({ teams }: { teams: MockTeam[] }) {
  const nonFF = useMemo(() => teams.filter(t => !t.isFirstFour), [teams])

  const [team1Id, setTeam1Id] = useState(nonFF[0]?.id ?? '')
  const [team2Id, setTeam2Id] = useState(nonFF[1]?.id ?? '')

  const team1 = nonFF.find(t => t.id === team1Id) ?? nonFF[0]
  const team2 = nonFF.find(t => t.id === team2Id) ?? nonFF[1]

  const prediction = useMemo(() => {
    if (!team1 || !team2 || team1.id === team2.id) return null
    return predictMatchup(team1, team2)
  }, [team1, team2])

  const swap = () => {
    setTeam1Id(team2Id)
    setTeam2Id(team1Id)
  }

  if (!team1 || !team2) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <Link
          href="/"
          style={{
            fontSize: 12,
            color: T.muted,
            textDecoration: 'none',
            display: 'inline-block',
            marginBottom: 16,
          }}
        >
          ← Back
        </Link>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: T.navy,
          fontFamily: '"Playfair Display", Georgia, serif',
          marginBottom: 6,
        }}>
          Head-to-Head
        </h1>
        <p style={{ fontSize: 14, color: T.muted }}>
          Pick any two 2026 tournament teams for a data-driven matchup breakdown.
        </p>
      </div>

      {/* Selectors */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <TeamSelector
            teams={nonFF}
            value={team1Id}
            onChange={setTeam1Id}
            label="Team 1"
            accentColor={T.blue}
          />
          <button
            onClick={swap}
            style={{
              flexShrink: 0,
              marginBottom: 2,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              background: T.parchment,
              color: T.navyMuted,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            title="Swap teams"
          >
            <ArrowLeftRight style={{ width: 16, height: 16 }} />
          </button>
          <TeamSelector
            teams={nonFF}
            value={team2Id}
            onChange={setTeam2Id}
            label="Team 2"
            accentColor={T.amber}
          />
        </div>
      </Card>

      {/* Same team warning */}
      {team1.id === team2.id && (
        <div style={{
          borderRadius: 10,
          border: `1px solid #fde68a`,
          background: '#fffbeb',
          padding: 16,
          textAlign: 'center',
          fontSize: 14,
          color: '#92400e',
        }}>
          Select two different teams to compare.
        </div>
      )}

      {prediction && team1.id !== team2.id && (
        <>
          {/* Win probability */}
          <WinProbBar team1={team1} team2={team2} prob1={prediction.team1WinProb} />

          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: 12,
            alignItems: 'center',
            padding: '0 4px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TeamLogo team={team1} size={32} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{team1.name}</div>
                <div style={{ fontSize: 12, color: T.muted }}>#{team1.seed} · {team1.region}</div>
              </div>
            </div>
            <div style={{
              fontSize: 11,
              color: T.muted,
              textAlign: 'center',
              width: 96,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Stat
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{team2.name}</div>
                <div style={{ fontSize: 12, color: T.muted }}>#{team2.seed} · {team2.region}</div>
              </div>
              <TeamLogo team={team2} size={32} />
            </div>
          </div>

          {/* Efficiency stats */}
          <Card>
            <SectionHeading icon={<TrendingUp style={{ width: 16, height: 16, color: T.gold }} />}>
              Efficiency Stats
            </SectionHeading>
            <StatBar label="adjEM" v1={team1.stats.adjEM} v2={team2.stats.adjEM} higherIsBetter />
            <StatBar
              label="Off Eff"
              v1={team1.stats.adjOE}
              v2={team2.stats.adjOE}
              higherIsBetter
              format={(n) => n.toFixed(1)}
            />
            <StatBar
              label="Def Eff"
              v1={team1.stats.adjDE}
              v2={team2.stats.adjDE}
              higherIsBetter={false}
              format={(n) => n.toFixed(1)}
            />
            <StatBar
              label="Tempo"
              v1={team1.stats.tempo}
              v2={team2.stats.tempo}
              higherIsBetter
              format={(n) => n.toFixed(1)}
            />
            <StatBar
              label="eFG%"
              v1={team1.stats.efgPct}
              v2={team2.stats.efgPct}
              higherIsBetter
              format={(n) => `${(n * 100).toFixed(1)}%`}
            />
            <StatBar
              label="TO Rate"
              v1={team1.stats.turnoverRate}
              v2={team2.stats.turnoverRate}
              higherIsBetter={false}
              format={(n) => `${n.toFixed(1)}%`}
            />
            <StatBar
              label="3PT%"
              v1={team1.stats.threePointPct}
              v2={team2.stats.threePointPct}
              higherIsBetter
              format={(n) => `${(n * 100).toFixed(1)}%`}
            />
          </Card>

          {/* Tournament profile */}
          <Card>
            <SectionHeading icon={<Trophy style={{ width: 16, height: 16, color: T.gold }} />}>
              Tournament Profile
            </SectionHeading>
            <StatBar
              label="Title Profile"
              v1={team1.titleProfileScore}
              v2={team2.titleProfileScore}
              higherIsBetter
              format={(n) => `${n}%`}
            />
            <StatBar
              label="Upset Vuln."
              v1={team1.upsetVulnerability}
              v2={team2.upsetVulnerability}
              higherIsBetter={false}
              format={(n) => `${n}%`}
            />
            <StatBar
              label="W-L %"
              v1={(team1.winsTotal ?? 0) / Math.max(1, (team1.winsTotal ?? 0) + (team1.lossesTotal ?? 0))}
              v2={(team2.winsTotal ?? 0) / Math.max(1, (team2.winsTotal ?? 0) + (team2.lossesTotal ?? 0))}
              higherIsBetter
              format={pct}
            />
            <StatBar
              label="T-Rank"
              v1={team1.stats.kenpomRank}
              v2={team2.stats.kenpomRank}
              higherIsBetter={false}
              format={(n) => `#${n}`}
            />
          </Card>

          {/* Deciding factors + key players */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <FactorsPanel prediction={prediction} team1={team1} team2={team2} />
            <PlayersPanel team1={team1} team2={team2} />
          </div>

          {/* Quick links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link
              href={`/teams/${team1.slug}`}
              style={{
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                background: T.white,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 500,
                color: T.navyMuted,
                textDecoration: 'none',
              }}
            >
              Full {team1.name} profile →
            </Link>
            <Link
              href={`/teams/${team2.slug}`}
              style={{
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                background: T.white,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 500,
                color: T.navyMuted,
                textDecoration: 'none',
              }}
            >
              Full {team2.name} profile →
            </Link>
            <Link
              href="/bracket"
              style={{
                borderRadius: 8,
                border: `1px solid ${T.blue}`,
                background: T.blue,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
                color: T.white,
                textDecoration: 'none',
                marginLeft: 'auto',
              }}
            >
              Simulate the bracket →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
