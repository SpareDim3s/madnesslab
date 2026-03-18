'use client'

import { useState } from 'react'
import { Trophy, Zap, AlertTriangle, TrendingUp, RefreshCw, BarChart2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamStats {
  adjEM?: number
  adjOE?: number
  adjDE?: number
  tempo?: number
  kenpomRank?: number
  threePointRate?: number
  turnoverRate?: number
}

interface KeyPlayer {
  name: string
  ppg: number
  rpg?: number
  apg?: number
  position?: string
}

interface Team {
  id: string
  name: string
  seed: number
  region: string
  abbreviation?: string
  conference?: string
  espnId?: number
  primaryColor?: string
  isFirstFour?: boolean
  stats?: TeamStats
  titleProfileScore?: number
  upsetVulnerability?: number
  keyPlayers?: KeyPlayer[]
}

interface UpsetInfo {
  region: string
  winnerSeed: number
  loserSeed: number
  winner: Team
}

interface LateUpset {
  round: string
  winnerId: string
  winnerSeed: number
}

interface TitleOddsEntry {
  teamId: string
  teamName: string
  seed: number
  region: string
  titleOdds: number
  finalFourOdds: number
  eliteEightOdds: number
}

interface SimResult {
  champion: Team
  finalFour: Team[]
  eliteEight: Team[]
  sweet16: Team[]
  r32Winners: Team[]
  r64Upsets: UpsetInfo[]
  lateUpsets: LateUpset[]
  titleOdds: TitleOddsEntry[]
}

interface SimulateBracketProps {
  allTeams?: Team[]
}

// Standard seed pairings in bracket order (top → bottom within each region)
const BRACKET_SEED_PAIRS: [number, number][] = [
  [1, 16], [8, 9], [5, 12], [4, 13],
  [6, 11], [3, 14], [7, 10], [2, 15],
]

// ─── Narrative Generator ──────────────────────────────────────────────────────

function buildChampionNarrative(champion: Team): string {
  const { stats, seed, titleProfileScore, keyPlayers } = champion
  const adjEM = stats?.adjEM ?? 0
  const adjOE = stats?.adjOE ?? 0
  const adjDE = stats?.adjDE ?? 0
  const tempo = stats?.tempo ?? 70
  const kenpomRank = stats?.kenpomRank

  const lines: string[] = []

  if (seed === 1) {
    lines.push(`${champion.name} lived up to their #1 seed, validating what the efficiency metrics have said all season.`)
  } else if (seed <= 3) {
    lines.push(`${champion.name} was a heavy pre-tournament favorite, and the stats backed it up all the way.`)
  } else if (seed <= 5) {
    lines.push(`${champion.name} was expected to make a deep run, and they delivered — cutting down the nets as a #${seed} seed.`)
  } else {
    lines.push(`${champion.name} pulled off the run of the tournament, winning it all as a #${seed} seed — a result the variance model flagged as possible.`)
  }

  if (kenpomRank && kenpomRank <= 5) {
    lines.push(`Their adjusted efficiency margin of +${adjEM.toFixed(1)} ranked them among the top 5 teams nationally — a level where champions are almost always found.`)
  } else if (adjEM >= 28) {
    lines.push(`An elite efficiency margin of +${adjEM.toFixed(1)} separated them from the field all the way to the championship.`)
  } else if (adjEM >= 22) {
    lines.push(`A strong efficiency margin of +${adjEM.toFixed(1)} gave them a meaningful edge in every round.`)
  }

  const offRank = adjOE >= 124 ? 'historic' : adjOE >= 120 ? 'elite' : adjOE >= 116 ? 'very good' : 'solid'
  const defRank = adjDE <= 89 ? 'historically stingy' : adjDE <= 92 ? 'elite' : adjDE <= 95 ? 'very good' : 'solid'

  if (adjDE < 93 && adjOE > 118) {
    lines.push(`They were lethal on both ends — ${offRank} offense (adjOE ${adjOE.toFixed(1)}) paired with ${defRank} defense (adjDE ${adjDE.toFixed(1)}). Two-way excellence is the hallmark of almost every champion.`)
  } else if (adjDE < 93) {
    lines.push(`Defense wins championships — and ${champion.name}'s ${defRank} defense (adjDE ${adjDE.toFixed(1)}) was the engine.`)
  } else {
    lines.push(`Their ${offRank} offense (adjOE ${adjOE.toFixed(1)}) was unstoppable at key moments, creating separation when it mattered most.`)
  }

  if (tempo < 66) {
    lines.push(`Their slow, deliberate pace (${tempo.toFixed(1)} possessions/game) neutralized opponents who relied on fast-break points, reducing the variance that causes upsets.`)
  } else if (tempo > 74) {
    lines.push(`Their fast-paced attack (${tempo.toFixed(1)} possessions/game) overwhelmed teams that tried to keep up.`)
  }

  if (titleProfileScore && titleProfileScore >= 70) {
    lines.push(`Their title profile score of ${titleProfileScore} matches the historical fingerprint of champions — elite defense, controlled tempo, and top-tier efficiency.`)
  }

  if (keyPlayers && keyPlayers.length > 0) {
    const names = keyPlayers.slice(0, 2).map(p => p.name).join(' and ')
    const topScorer = keyPlayers[0]
    lines.push(`${names} were crucial — ${topScorer.name} (${topScorer.ppg} ppg) provided the scoring punch that kept the offense humming in tight moments.`)
  }

  return lines.join(' ')
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TeamLogo({ team, size = 32 }: { team: Team; size?: number }) {
  if (!team.espnId) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://a.espncdn.com/i/teamlogos/ncaa/500/${team.espnId}.png`}
      alt=""
      width={size}
      height={size}
      className="object-contain"
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
    />
  )
}

function SeedPill({ seed, large }: { seed: number; large?: boolean }) {
  const bg =
    seed === 1 ? '#a0832a' :
    seed <= 3 ? '#2563eb' :
    seed <= 5 ? '#4b5563' :
    '#9ca3af'

  return (
    <span
      className="inline-flex items-center justify-center rounded font-bold text-white"
      style={{
        backgroundColor: bg,
        width: large ? 28 : 22,
        height: large ? 28 : 22,
        fontSize: large ? 13 : 10,
        flexShrink: 0,
      }}
    >
      {seed}
    </span>
  )
}

// ─── Hero (pre-simulate) ──────────────────────────────────────────────────────

function SimulateHero({ onSimulate, loading }: { onSimulate: () => void; loading: boolean }) {
  return (
    <div
      className="rounded-2xl p-8 text-center shadow-sm"
      style={{ background: 'white', border: '1px solid #e8e0d0' }}
    >
      {/* Ornamental heading */}
      <div className="ornament-divider mb-6">
        <span>✦</span>
        <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#a0832a', fontFamily: '"Playfair Display", serif' }}>
          MadnessLab Simulation Engine
        </span>
        <span>✦</span>
      </div>

      <h2
        className="mb-2 text-3xl font-bold"
        style={{ fontFamily: '"Playfair Display", serif', color: '#1a1625' }}
      >
        Run the Tournament
      </h2>
      <p className="mx-auto mb-2 max-w-lg text-sm leading-relaxed" style={{ color: '#6b7280' }}>
        Our 4-layer prediction engine simulates all 67 games using real T-Rank efficiency stats,
        matchup adjustments, historical upset rates, and variance modeling.
      </p>
      <p className="mx-auto mb-8 max-w-lg text-xs leading-relaxed" style={{ color: '#9ca3af' }}>
        Each click runs a fresh simulation. Favorites win most of the time — but the model accounts for the chaos.
      </p>

      <button
        onClick={onSimulate}
        disabled={loading}
        className="inline-flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: '#2563eb', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
      >
        {loading ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin" />
            Simulating…
          </>
        ) : (
          <>
            <Zap className="h-5 w-5" />
            Simulate Tournament
          </>
        )}
      </button>

      <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: '📊', label: 'Layer 1', desc: 'Efficiency margin' },
          { icon: '⚡', label: 'Layer 2', desc: 'Matchup adjustments' },
          { icon: '🗂️', label: 'Layer 3', desc: 'Historical upset rates' },
          { icon: '🎲', label: 'Layer 4', desc: 'Chaos & variance' },
        ].map(l => (
          <div
            key={l.label}
            className="rounded-xl p-3"
            style={{ background: '#faf7f0', border: '1px solid #e8e0d0' }}
          >
            <div className="text-lg mb-1">{l.icon}</div>
            <div className="text-xs font-semibold" style={{ color: '#a0832a' }}>{l.label}</div>
            <div className="text-xs" style={{ color: '#9ca3af' }}>{l.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Champion Card ────────────────────────────────────────────────────────────

function ChampionCard({ champion, narrative }: { champion: Team; narrative: string }) {
  const stats = champion.stats

  return (
    <div
      className="rounded-2xl p-6 shadow-sm"
      style={{
        background: 'linear-gradient(135deg, #fffdf5 0%, #fff 60%, #f0f4ff 100%)',
        border: '1px solid #e8e0d0',
        borderLeft: '4px solid #a0832a',
      }}
    >
      {/* Crown banner */}
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5" style={{ color: '#a0832a' }} />
        <span
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: '#a0832a', fontFamily: '"Playfair Display", serif' }}
        >
          2026 Champion
        </span>
        <div className="ml-auto ornament-divider" style={{ width: 80 }}>
          <span style={{ fontSize: 10 }}>✦</span>
        </div>
      </div>

      {/* Team identity */}
      <div className="flex items-center gap-4 mb-5">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl"
          style={{ background: '#faf7f0', border: '1px solid #e8e0d0' }}
        >
          {champion.espnId ? (
            <TeamLogo team={champion} size={48} />
          ) : (
            <span
              className="text-2xl font-black"
              style={{ color: '#1a1625', fontFamily: '"Playfair Display", serif' }}
            >
              {champion.abbreviation?.slice(0, 2)}
            </span>
          )}
        </div>
        <div>
          <h2
            className="text-3xl font-black leading-none"
            style={{ fontFamily: '"Playfair Display", serif', color: '#1a1625' }}
          >
            {champion.name}
          </h2>
          <div className="mt-1.5 flex items-center gap-2">
            <SeedPill seed={champion.seed} large />
            <span className="text-sm" style={{ color: '#6b7280' }}>{champion.region} Region</span>
            {champion.conference && (
              <span className="text-xs" style={{ color: '#9ca3af' }}>· {champion.conference}</span>
            )}
          </div>
        </div>
      </div>

      {/* Key stats row */}
      {stats && (
        <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {[
            { label: 'adjEM', value: stats.adjEM?.toFixed(1) ?? '—', color: '#a0832a' },
            { label: 'adjOE', value: stats.adjOE?.toFixed(1) ?? '—', color: '#2563eb' },
            { label: 'adjDE', value: stats.adjDE?.toFixed(1) ?? '—', color: '#16a34a' },
            { label: 'Tempo', value: stats.tempo?.toFixed(1) ?? '—', color: '#7c3aed' },
            { label: 'T-Rank', value: stats.kenpomRank ? `#${stats.kenpomRank}` : '—', color: '#a0832a' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-lg p-2.5 text-center"
              style={{ background: '#faf7f0', border: '1px solid #e8e0d0' }}
            >
              <div className="text-base font-bold tabular-nums" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Narrative */}
      <div className="rounded-xl p-4" style={{ background: '#faf7f0', border: '1px solid #ede5d0' }}>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4" style={{ color: '#2563eb' }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#2563eb' }}>Why they won</span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{narrative}</p>
      </div>

      {/* Key players */}
      {champion.keyPlayers && champion.keyPlayers.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9ca3af' }}>Key Players</div>
          <div className="flex flex-wrap gap-2">
            {champion.keyPlayers.slice(0, 3).map(p => (
              <div
                key={p.name}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
                style={{ background: '#faf7f0', border: '1px solid #e8e0d0' }}
              >
                <span className="font-medium" style={{ color: '#1a1625' }}>{p.name}</span>
                <span style={{ color: '#9ca3af' }}>{p.ppg} ppg</span>
                {p.position && <span style={{ color: '#d1d5db' }}>· {p.position}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Full Printed Bracket ─────────────────────────────────────────────────────

interface BracketState {
  advancedR32: Set<string>   // won R64
  advancedS16: Set<string>   // won R32 (made Sweet 16)
  advancedE8: Set<string>    // won S16 (made Elite Eight)
  advancedF4: Set<string>    // won E8 (made Final Four)
  championId: string
}

function BracketTeamSlot({
  team,
  won,
  eliminated,
  flip,
}: {
  team: Team | null
  won?: boolean
  eliminated?: boolean
  flip?: boolean // for right-side (seed on right, name on left)
}) {
  if (!team) {
    return (
      <div
        className="flex items-center h-[26px] px-1.5"
        style={{ borderBottom: '1px solid #ede5d0', background: '#faf7f0' }}
      />
    )
  }

  const nameStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: won ? 700 : 400,
    color: eliminated ? '#d1d5db' : won ? '#1a1625' : '#4b5563',
    textDecoration: eliminated ? 'line-through' : 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  }

  const seedStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    color: won ? '#a0832a' : '#9ca3af',
    width: 16,
    textAlign: 'center',
    flexShrink: 0,
  }

  const displayName = team.abbreviation || team.name.split(' ').slice(-1)[0]

  return (
    <div
      className="flex items-center h-[26px] px-1.5 gap-1"
      style={{
        borderBottom: '1px solid #ede5d0',
        background: won ? '#fff' : '#faf7f0',
        flexDirection: flip ? 'row-reverse' : 'row',
      }}
    >
      <span style={seedStyle}>{team.seed}</span>
      <span style={nameStyle}>{displayName}</span>
      {won && (
        <span style={{ fontSize: 7, color: '#a0832a', flexShrink: 0 }}>✦</span>
      )}
    </div>
  )
}

function BracketRound({
  games,
  bracketState,
  round,
  flip,
}: {
  games: (Team | null)[][]  // array of matchups, each matchup = [topTeam, bottomTeam]
  bracketState: BracketState
  round: 'r64' | 'r32' | 's16' | 'e8'
  flip?: boolean
}) {
  const gameHeightMap = { r64: 52, r32: 104, s16: 208, e8: 416 }
  const gameHeight = gameHeightMap[round]

  function didAdvance(team: Team | null): boolean {
    if (!team) return false
    if (round === 'r64') return bracketState.advancedR32.has(team.id)
    if (round === 'r32') return bracketState.advancedS16.has(team.id)
    if (round === 's16') return bracketState.advancedE8.has(team.id)
    if (round === 'e8') return bracketState.advancedF4.has(team.id)
    return false
  }

  function isEliminated(team: Team | null, matchup: (Team | null)[]): boolean {
    if (!team) return false
    const opponent = matchup.find(t => t && t.id !== team.id)
    if (!opponent) return false
    return didAdvance(opponent) && !didAdvance(team)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: 100 }}>
      {games.map((matchup, i) => (
        <div
          key={i}
          style={{
            height: gameHeight,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ border: '1px solid #e8e0d0', borderRadius: 4, overflow: 'hidden', background: 'white' }}>
            <BracketTeamSlot
              team={matchup[0]}
              won={didAdvance(matchup[0])}
              eliminated={isEliminated(matchup[0], matchup)}
              flip={flip}
            />
            <BracketTeamSlot
              team={matchup[1]}
              won={didAdvance(matchup[1])}
              eliminated={isEliminated(matchup[1], matchup)}
              flip={flip}
            />
          </div>
          {/* Connector line (right side for left bracket, left side for right bracket) */}
          {round !== 'e8' && (
            <div
              style={{
                position: 'absolute',
                top: '25%',
                bottom: '25%',
                [flip ? 'left' : 'right']: -8,
                width: 8,
                borderTop: `1px solid #a0832a40`,
                borderBottom: `1px solid #a0832a40`,
                [flip ? 'borderLeft' : 'borderRight']: `1px solid #a0832a40`,
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function buildRegionRounds(
  allTeams: Team[],
  region: string,
  bracketState: BracketState,
): {
  r64Games: (Team | null)[][]
  r32Games: (Team | null)[][]
  s16Games: (Team | null)[][]
  e8Games: (Team | null)[][]
} {
  const regionTeams = allTeams.filter(t => t.region === region && !t.isFirstFour)

  // R64 matchups in bracket order
  const r64Games: (Team | null)[][] = BRACKET_SEED_PAIRS.map(([s1, s2]) => [
    regionTeams.find(t => t.seed === s1) ?? null,
    regionTeams.find(t => t.seed === s2) ?? null,
  ])

  // R32: winner of games 1-2, 3-4, 5-6, 7-8 play each other
  const r32Games: (Team | null)[][] = []
  for (let i = 0; i < 8; i += 2) {
    const g1 = r64Games[i]
    const g2 = r64Games[i + 1]
    const w1 = g1.find(t => t && bracketState.advancedR32.has(t.id)) ?? g1[0]
    const w2 = g2.find(t => t && bracketState.advancedR32.has(t.id)) ?? g2[0]
    r32Games.push([w1 ?? null, w2 ?? null])
  }

  // S16: winners of R32 games 1-2 and 3-4
  const s16Games: (Team | null)[][] = []
  for (let i = 0; i < 4; i += 2) {
    const g1 = r32Games[i]
    const g2 = r32Games[i + 1]
    const w1 = g1.find(t => t && bracketState.advancedS16.has(t.id)) ?? g1[0]
    const w2 = g2.find(t => t && bracketState.advancedS16.has(t.id)) ?? g2[0]
    s16Games.push([w1 ?? null, w2 ?? null])
  }

  // E8: winners of S16 games 1-2
  const e8Winner1 = s16Games[0]?.find(t => t && bracketState.advancedE8.has(t.id)) ?? s16Games[0]?.[0]
  const e8Winner2 = s16Games[1]?.find(t => t && bracketState.advancedE8.has(t.id)) ?? s16Games[1]?.[0]
  const e8Games: (Team | null)[][] = [[e8Winner1 ?? null, e8Winner2 ?? null]]

  return { r64Games, r32Games, s16Games, e8Games }
}

function RegionBracket({
  allTeams,
  region,
  bracketState,
  flip,
}: {
  allTeams: Team[]
  region: string
  bracketState: BracketState
  flip?: boolean
}) {
  const { r64Games, r32Games, s16Games, e8Games } = buildRegionRounds(allTeams, region, bracketState)

  const rounds = flip
    ? [
        { games: e8Games, round: 'e8' as const },
        { games: s16Games, round: 's16' as const },
        { games: r32Games, round: 'r32' as const },
        { games: r64Games, round: 'r64' as const },
      ]
    : [
        { games: r64Games, round: 'r64' as const },
        { games: r32Games, round: 'r32' as const },
        { games: s16Games, round: 's16' as const },
        { games: e8Games, round: 'e8' as const },
      ]

  return (
    <div>
      <div
        className="text-center text-[10px] font-bold uppercase tracking-widest mb-2 py-1 rounded"
        style={{ color: '#a0832a', background: '#f0e8d0' }}
      >
        {region}
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'stretch' }}>
        {rounds.map(({ games, round }) => (
          <BracketRound
            key={round}
            games={games}
            bracketState={bracketState}
            round={round}
            flip={flip}
          />
        ))}
      </div>
    </div>
  )
}

function CenterColumn({ result }: { result: SimResult }) {
  const { finalFour, champion } = result

  // Split F4: left teams are South+East winners, right teams are West+Midwest winners
  const leftF4 = finalFour.filter(t => t.region === 'South' || t.region === 'East')
  const rightF4 = finalFour.filter(t => t.region === 'West' || t.region === 'Midwest')

  function F4Slot({ team, side }: { team: Team | undefined; side: 'left' | 'right' }) {
    if (!team) return <div style={{ height: 40 }} />
    const isChamp = team.id === champion.id
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
        style={{
          background: isChamp ? '#fffdf0' : 'white',
          border: `1px solid ${isChamp ? '#a0832a' : '#e8e0d0'}`,
          flexDirection: side === 'right' ? 'row-reverse' : 'row',
          marginBottom: 4,
        }}
      >
        <SeedPill seed={team.seed} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#1a1625', flex: 1, textAlign: 'center' }}>
          {team.abbreviation || team.name.split(' ').slice(-1)[0]}
        </span>
        {isChamp && <Trophy style={{ width: 12, height: 12, color: '#a0832a' }} />}
      </div>
    )
  }

  return (
    <div style={{ width: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
      {/* Round label */}
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#a0832a', marginBottom: 8, textTransform: 'uppercase' }}>
        Final Four
      </div>

      {/* Left F4 teams */}
      <div style={{ width: '100%', marginBottom: 8 }}>
        {leftF4.map(t => <F4Slot key={t.id} team={t} side="left" />)}
      </div>

      {/* Champion */}
      <div
        className="w-full rounded-xl p-3 text-center mb-8"
        style={{
          background: 'linear-gradient(135deg, #fffdf0, #fff)',
          border: '2px solid #a0832a',
          boxShadow: '0 4px 16px rgba(160,131,42,0.15)',
        }}
      >
        <Trophy className="mx-auto mb-1" style={{ width: 20, height: 20, color: '#a0832a' }} />
        <div style={{ fontSize: 8, letterSpacing: 2, color: '#a0832a', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
          Champion
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <SeedPill seed={champion.seed} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", serif' }}>
          {champion.name}
        </div>
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{champion.region}</div>
      </div>

      {/* Right F4 teams */}
      <div style={{ width: '100%' }}>
        {rightF4.map(t => <F4Slot key={t.id} team={t} side="right" />)}
      </div>
    </div>
  )
}

function PrintedBracket({ result, allTeams }: { result: SimResult; allTeams: Team[] }) {
  const bracketState: BracketState = {
    advancedR32: new Set(result.r32Winners?.map(t => t.id) ?? []),
    advancedS16: new Set(result.sweet16.map(t => t.id)),
    advancedE8: new Set(result.eliteEight.map(t => t.id)),
    advancedF4: new Set(result.finalFour.map(t => t.id)),
    championId: result.champion.id,
  }

  if (allTeams.length === 0) return null

  return (
    <div
      className="rounded-2xl p-4 shadow-sm"
      style={{ background: 'white', border: '1px solid #e8e0d0' }}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <h3
          className="text-xl font-bold"
          style={{ fontFamily: '"Playfair Display", serif', color: '#1a1625' }}
        >
          2026 NCAA Tournament Bracket
        </h3>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
          ✦ Winners highlighted · Losers dimmed ✦
        </p>
      </div>

      {/* Bracket */}
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 900 }}>
          {/* Left side: South (top) + East (bottom) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <RegionBracket allTeams={allTeams} region="South" bracketState={bracketState} />
            <RegionBracket allTeams={allTeams} region="East" bracketState={bracketState} />
          </div>

          {/* Round labels between left and center */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 8, color: '#9ca3af', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', writingMode: 'vertical-rl' }}>
            <span>R64</span>
            <span>R32</span>
            <span>S16</span>
            <span>E8</span>
          </div>

          {/* Center: F4 + Champion */}
          <CenterColumn result={result} />

          {/* Round labels between center and right */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 8, color: '#9ca3af', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', writingMode: 'vertical-rl' }}>
            <span>E8</span>
            <span>S16</span>
            <span>R32</span>
            <span>R64</span>
          </div>

          {/* Right side: West + Midwest (flipped direction) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <RegionBracket allTeams={allTeams} region="West" bracketState={bracketState} flip />
            <RegionBracket allTeams={allTeams} region="Midwest" bracketState={bracketState} flip />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Elite Eight (4 Regional Matchups) ────────────────────────────────────────

function EliteEightSection({ eliteEight }: { eliteEight: Team[] }) {
  if (eliteEight.length < 8) return null

  // eliteEight array: [South1, South2, East1, East2, West1, West2, Midwest1, Midwest2]
  const matchups: Array<{ region: string; team1: Team; team2: Team }> = [
    { region: 'South', team1: eliteEight[0], team2: eliteEight[1] },
    { region: 'East', team1: eliteEight[2], team2: eliteEight[3] },
    { region: 'West', team1: eliteEight[4], team2: eliteEight[5] },
    { region: 'Midwest', team1: eliteEight[6], team2: eliteEight[7] },
  ].filter(m => m.team1 && m.team2)

  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ background: 'white', border: '1px solid #e8e0d0' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <h3
          className="text-lg font-bold"
          style={{ fontFamily: '"Playfair Display", serif', color: '#1a1625' }}
        >
          Elite Eight Matchups
        </h3>
        <span
          className="ml-auto text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{ color: '#a0832a', background: '#f0e8d0' }}
        >
          4 Regional Finals
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {matchups.map(({ region, team1, team2 }) => (
          <div
            key={region}
            className="rounded-xl p-4"
            style={{ background: '#faf7f0', border: '1px solid #ede5d0' }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-3 text-center"
              style={{ color: '#a0832a' }}
            >
              {region} Regional Final
            </div>
            <div className="space-y-2">
              {[team1, team2].map((team, idx) => (
                <div key={team.id}>
                  <div
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2"
                    style={{ background: 'white', border: '1px solid #e8e0d0' }}
                  >
                    <SeedPill seed={team.seed} />
                    <TeamLogo team={team} size={20} />
                    <span className="flex-1 text-sm font-semibold" style={{ color: '#1a1625' }}>{team.name}</span>
                    {team.stats?.adjEM !== undefined && (
                      <span className="text-xs tabular-nums" style={{ color: '#a0832a' }}>
                        +{team.stats.adjEM.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {idx === 0 && (
                    <div className="text-center my-1 text-[10px] font-bold" style={{ color: '#9ca3af' }}>
                      vs
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Final Four Section ───────────────────────────────────────────────────────

function FinalFourSection({ finalFour, champion }: { finalFour: Team[]; champion: Team }) {
  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ background: 'white', border: '1px solid #e8e0d0' }}
    >
      <h3
        className="mb-4 text-lg font-bold"
        style={{ fontFamily: '"Playfair Display", serif', color: '#1a1625' }}
      >
        Final Four
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {finalFour.map(team => (
          <div
            key={team.id}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
            style={{
              border: `1px solid ${team.id === champion.id ? '#a0832a' : '#e8e0d0'}`,
              background: team.id === champion.id ? '#fffdf0' : '#faf7f0',
            }}
          >
            <SeedPill seed={team.seed} />
            <TeamLogo team={team} size={24} />
            <div className="flex-1">
              <span className="text-sm font-semibold" style={{ color: '#1a1625' }}>{team.name}</span>
              <span className="ml-2 text-xs" style={{ color: '#9ca3af' }}>{team.region}</span>
            </div>
            {team.id === champion.id && (
              <Trophy className="h-4 w-4 shrink-0" style={{ color: '#a0832a' }} />
            )}
            {team.stats?.adjEM !== undefined && (
              <span className="text-xs tabular-nums" style={{ color: '#9ca3af' }}>
                +{team.stats.adjEM.toFixed(1)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Upsets Section ───────────────────────────────────────────────────────────

function UpsetCallouts({ r64Upsets, lateUpsets }: {
  r64Upsets: UpsetInfo[]
  lateUpsets: LateUpset[]
}) {
  if (r64Upsets.length === 0 && lateUpsets.length === 0) {
    return (
      <div
        className="rounded-2xl p-5 shadow-sm"
        style={{ background: 'white', border: '1px solid #e8e0d0' }}
      >
        <h3
          className="mb-2 text-lg font-bold"
          style={{ fontFamily: '"Playfair Display", serif', color: '#1a1625' }}
        >
          Notable Upsets
        </h3>
        <p className="text-sm" style={{ color: '#9ca3af' }}>
          No major upsets — the favorites held serve throughout the bracket.
        </p>
      </div>
    )
  }

  function upsetExplanation(upset: UpsetInfo): string {
    const { winnerSeed, loserSeed, winner } = upset
    const adjEM = winner.stats?.adjEM
    if (winnerSeed === 12 && loserSeed === 5) {
      return `The 5-12 is historically volatile (36% upset rate). ${adjEM ? `${winner.name}'s +${adjEM.toFixed(1)} adjEM is well above average for a 12-seed.` : 'The model flagged this as a danger game.'}`
    }
    if (winnerSeed === 11 && loserSeed === 6) {
      return `The 6-11 matchup is routinely unpredictable — 6-seeds only win ~63% of the time.`
    }
    if (winnerSeed === 13 && loserSeed === 4) {
      return `13-seeds upset 4-seeds ~22% of the time. ${winner.name} had the numbers to exploit this.`
    }
    if (winnerSeed >= 10) {
      return `${winner.name}'s stats were deceptively strong for a #${winnerSeed} seed${adjEM ? ` (+${adjEM.toFixed(1)} adjEM)` : ''}.`
    }
    const gap = loserSeed - winnerSeed
    return `A ${gap}-seed gap upset${adjEM ? ` backed by ${winner.name}'s +${adjEM.toFixed(1)} efficiency margin` : ''}.`
  }

  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ background: 'white', border: '1px solid #e8e0d0' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-4 w-4" style={{ color: '#dc2626' }} />
        <h3
          className="text-lg font-bold"
          style={{ fontFamily: '"Playfair Display", serif', color: '#1a1625' }}
        >
          Notable Upsets
        </h3>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ background: '#fef2f2', color: '#dc2626' }}
        >
          {r64Upsets.length + lateUpsets.length} upset{r64Upsets.length + lateUpsets.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {r64Upsets.map((upset, i) => (
          <div
            key={i}
            className="rounded-xl p-3.5"
            style={{ background: '#fff5f5', border: '1px solid #fecaca' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <SeedPill seed={upset.winnerSeed} />
              <span className="font-semibold text-sm" style={{ color: '#1a1625' }}>{upset.winner.name}</span>
              <span className="text-xs" style={{ color: '#9ca3af' }}>beats #{upset.loserSeed} seed</span>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider" style={{ color: '#dc2626' }}>
                R64 · {upset.region}
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
              {upsetExplanation(upset)}
            </p>
          </div>
        ))}

        {lateUpsets.map((upset, i) => (
          <div
            key={`late-${i}`}
            className="rounded-xl p-3.5"
            style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <SeedPill seed={upset.winnerSeed} />
              <span className="text-sm font-medium" style={{ color: '#1a1625' }}>
                #{upset.winnerSeed} seed advances in the {upset.round}
              </span>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider" style={{ color: '#ea580c' }}>
                {upset.round}
              </span>
            </div>
            <p className="text-xs" style={{ color: '#9ca3af' }}>Higher seeds sometimes meet their match in later rounds when variance plays a bigger role.</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Odds Table ───────────────────────────────────────────────────────────────

function OddsTable({ odds }: { odds: TitleOddsEntry[] }) {
  const top8 = odds.slice(0, 8)

  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ background: 'white', border: '1px solid #e8e0d0' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="h-4 w-4" style={{ color: '#2563eb' }} />
        <h3
          className="text-lg font-bold"
          style={{ fontFamily: '"Playfair Display", serif', color: '#1a1625' }}
        >
          Championship Odds
        </h3>
        <span className="text-xs ml-1" style={{ color: '#9ca3af' }}>(200 simulations)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid #e8e0d0', color: '#9ca3af' }}>
              <th className="py-1.5 text-left">Team</th>
              <th className="py-1.5 text-right">Title</th>
              <th className="py-1.5 text-right">Final Four</th>
              <th className="py-1.5 text-right">Elite Eight</th>
            </tr>
          </thead>
          <tbody>
            {top8.map((entry, i) => (
              <tr key={entry.teamId} style={{ borderBottom: '1px solid #f3f0ea' }}>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: '#9ca3af', width: 16 }}>{i + 1}.</span>
                    <SeedPill seed={entry.seed} />
                    <span className="font-medium" style={{ color: '#1a1625' }}>{entry.teamName}</span>
                    <span className="hidden sm:inline" style={{ color: '#9ca3af' }}>· {entry.region}</span>
                  </div>
                </td>
                <td className="py-2 text-right tabular-nums font-semibold" style={{ color: '#a0832a' }}>
                  {(entry.titleOdds * 100).toFixed(1)}%
                </td>
                <td className="py-2 text-right tabular-nums" style={{ color: '#7c3aed' }}>
                  {(entry.finalFourOdds * 100).toFixed(0)}%
                </td>
                <td className="py-2 text-right tabular-nums" style={{ color: '#2563eb' }}>
                  {(entry.eliteEightOdds * 100).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Results View ─────────────────────────────────────────────────────────────

function SimulationResults({
  result,
  onResimulate,
  loading,
  allTeams,
}: {
  result: SimResult
  onResimulate: () => void
  loading: boolean
  allTeams: Team[]
}) {
  const narrative = buildChampionNarrative(result.champion)
  const [showBracket, setShowBracket] = useState(allTeams.length > 0)

  return (
    <div className="space-y-5">
      {/* Re-simulate bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: '#9ca3af' }}>
          Simulation complete —{' '}
          <span style={{ color: '#1a1625', fontWeight: 600 }}>
            {result.r64Upsets.length + result.lateUpsets.length} upset{result.r64Upsets.length + result.lateUpsets.length !== 1 ? 's' : ''}
          </span>{' '}
          detected
        </p>
        <div className="flex items-center gap-2">
          {allTeams.length > 0 && (
            <button
              onClick={() => setShowBracket(!showBracket)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition"
              style={{
                border: '1px solid #e8e0d0',
                color: showBracket ? '#2563eb' : '#4b5563',
                background: showBracket ? '#eff6ff' : 'white',
              }}
            >
              🏆 {showBracket ? 'Hide' : 'Show'} Full Bracket
            </button>
          )}
          <button
            onClick={onResimulate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50"
            style={{ border: '1px solid #e8e0d0', background: 'white', color: '#4b5563' }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Re-simulate
          </button>
        </div>
      </div>

      {/* Full Printed Bracket */}
      {showBracket && allTeams.length > 0 && (
        <PrintedBracket result={result} allTeams={allTeams} />
      )}

      {/* Champion card */}
      <ChampionCard champion={result.champion} narrative={narrative} />

      {/* Elite Eight — 4 regional matchups */}
      <EliteEightSection eliteEight={result.eliteEight} />

      {/* Final Four */}
      <FinalFourSection finalFour={result.finalFour} champion={result.champion} />

      {/* Two-col: upsets + odds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <UpsetCallouts r64Upsets={result.r64Upsets} lateUpsets={result.lateUpsets} />
        <OddsTable odds={result.titleOdds} />
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function SimulateBracket({ allTeams = [] }: SimulateBracketProps) {
  const [result, setResult] = useState<SimResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSimulate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/simulate-bracket', { method: 'POST' })
      if (!res.ok) throw new Error('Simulation failed')
      const data = await res.json() as SimResult
      setResult(data)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div
        className="rounded-2xl p-6 text-center shadow-sm"
        style={{ background: 'white', border: '1px solid #fecaca' }}
      >
        <p className="mb-3 font-medium" style={{ color: '#dc2626' }}>{error}</p>
        <button
          onClick={handleSimulate}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: '#2563eb' }}
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!result) {
    return <SimulateHero onSimulate={handleSimulate} loading={loading} />
  }

  return (
    <SimulationResults
      result={result}
      onResimulate={handleSimulate}
      loading={loading}
      allTeams={allTeams}
    />
  )
}
