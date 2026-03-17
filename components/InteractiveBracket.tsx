'use client'

import { useCallback, useMemo, useState } from 'react'

type Region = 'South' | 'East' | 'West' | 'Midwest'

export interface BracketTeam {
  id: string
  name: string
  seed: number
  region: Region
  abbreviation?: string
  primaryColor?: string
  conference?: string
  espnId?: number
  isFirstFour?: boolean
  titleProfileScore?: number
  upsetVulnerability?: number
  stats?: {
    adjOE?: number
    adjDE?: number
    adjEM?: number
    tempo?: number
    efgPct?: number
    threePointPct?: number
    turnoverRate?: number
    kenpomRank?: number
  }
}

type Picks = Record<string, string> // matchupId → teamId

const REGIONS: Region[] = ['South', 'East', 'West', 'Midwest']

// Standard seed pairing order (top to bottom in real bracket)
const SEED_PAIRS: [number, number][] = [
  [1, 16],
  [8, 9],
  [5, 12],
  [4, 13],
  [6, 11],
  [3, 14],
  [7, 10],
  [2, 15],
]

// ----- First Four helpers -----

interface FFPair {
  id: string
  region: Region
  seed: number
  top: BracketTeam
  bottom: BracketTeam
}

function getFirstFourPairs(teams: BracketTeam[]): FFPair[] {
  const ff = teams.filter(t => t.isFirstFour)
  const map = new Map<string, BracketTeam[]>()
  for (const t of ff) {
    const key = `${t.region}-${t.seed}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }
  const result: FFPair[] = []
  for (const [key, pair] of map) {
    if (pair.length === 2) {
      const dashIdx = key.indexOf('-')
      const region = key.slice(0, dashIdx) as Region
      const seed = parseInt(key.slice(dashIdx + 1))
      result.push({ id: `FF-${key}`, region, seed, top: pair[0], bottom: pair[1] })
    }
  }
  return result
}

function ffWinner(pair: FFPair, picks: Picks): BracketTeam | null {
  const pickedId = picks[pair.id]
  if (!pickedId) return null
  return pair.top.id === pickedId ? pair.top : pair.bottom.id === pickedId ? pair.bottom : null
}

// ----- helpers -----

function getRegionTeams(teams: BracketTeam[], region: Region): BracketTeam[] {
  return teams
    .filter(t => t.region === region && !t.isFirstFour)
    .sort((a, b) => a.seed - b.seed)
}

/** Returns the team at a given seed, substituting FF winner when applicable */
function teamBySeed(
  regionTeams: BracketTeam[],
  seed: number,
  region: Region,
  ffPairs: FFPair[],
  picks: Picks
): BracketTeam | null {
  const ffPair = ffPairs.find(p => p.region === region && p.seed === seed)
  if (ffPair) return ffWinner(ffPair, picks) // null = TBD until FF pick made
  return regionTeams.find(t => t.seed === seed) ?? null
}

function winProb(team: BracketTeam, opp: BracketTeam): number {
  const adjEM1 = team.stats?.adjEM ?? (20 - team.seed * 1.2)
  const adjEM2 = opp.stats?.adjEM ?? (20 - opp.seed * 1.2)
  const diff = adjEM1 - adjEM2
  return 1 / (1 + Math.exp(-diff / 8))
}

// ----- single team slot -----

function TeamSlot({
  team,
  picked,
  opponent,
  onClick,
  dimmed,
  placeholder,
}: {
  team: BracketTeam | null
  picked: boolean
  opponent: BracketTeam | null
  onClick: () => void
  dimmed: boolean
  placeholder?: string
}) {
  if (!team) {
    return (
      <div className="flex h-10 items-center rounded border border-dashed border-gray-150 bg-white px-2 text-xs text-gray-300">
        {placeholder ?? 'TBD'}
      </div>
    )
  }

  const prob = opponent ? winProb(team, opponent) : null
  const probPct = prob !== null ? Math.round(prob * 100) : null

  const seedBg =
    team.seed <= 4
      ? 'bg-gray-800 text-white'
      : team.seed <= 8
      ? 'bg-gray-500 text-white'
      : team.seed <= 12
      ? 'bg-gray-300 text-gray-700'
      : 'bg-gray-200 text-gray-500'

  const logoUrl = team.espnId
    ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.espnId}.png`
    : null

  return (
    <button
      onClick={onClick}
      className={[
        'group flex h-10 w-full items-center gap-1.5 rounded border px-2 text-left text-xs transition-all duration-150',
        picked
          ? 'border-orange-400 bg-orange-50 font-bold shadow-md ring-2 ring-orange-200'
          : dimmed
          ? 'border-gray-100 bg-gray-50 opacity-35 cursor-default'
          : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/40 hover:shadow-sm',
      ].join(' ')}
    >
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold ${picked ? 'bg-orange-500 text-white' : seedBg}`}>
        {team.seed}
      </span>
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          width={20}
          height={20}
          className={`h-5 w-5 shrink-0 object-contain ${dimmed ? 'opacity-30' : ''}`}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      )}
      <span className={`flex-1 truncate leading-tight ${picked ? 'text-orange-900' : dimmed ? 'text-gray-400' : 'text-gray-800'}`}>
        {team.abbreviation ?? team.name}
      </span>
      {probPct !== null && !dimmed && (
        <span className={`shrink-0 text-[10px] tabular-nums font-medium ${picked ? 'text-orange-600' : 'text-gray-400'}`}>
          {probPct}%
        </span>
      )}
      {picked && (
        <span className="shrink-0 text-orange-500 text-xs">✓</span>
      )}
    </button>
  )
}

// ----- one matchup (two slots) -----

function Matchup({
  id,
  top,
  bottom,
  picks,
  onPick,
  showWinnerOnly,
  topPlaceholder,
  bottomPlaceholder,
}: {
  id: string
  top: BracketTeam | null
  bottom: BracketTeam | null
  picks: Picks
  onPick: (matchupId: string, teamId: string) => void
  showWinnerOnly?: boolean
  topPlaceholder?: string
  bottomPlaceholder?: string
}) {
  const pickedId = picks[id]
  const topPicked = pickedId === top?.id
  const bottomPicked = pickedId === bottom?.id

  if (showWinnerOnly) {
    const winner = topPicked ? top : bottomPicked ? bottom : null
    return (
      <TeamSlot
        team={winner}
        picked={false}
        opponent={null}
        onClick={() => {}}
        dimmed={false}
      />
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      <TeamSlot
        team={top}
        picked={topPicked}
        opponent={bottom}
        onClick={() => top && onPick(id, top.id)}
        dimmed={!!pickedId && !topPicked}
        placeholder={topPlaceholder}
      />
      <div className="mx-auto h-px w-3/4 bg-gray-200" />
      <TeamSlot
        team={bottom}
        picked={bottomPicked}
        opponent={top}
        onClick={() => bottom && onPick(id, bottom.id)}
        dimmed={!!pickedId && !bottomPicked}
        placeholder={bottomPlaceholder}
      />
    </div>
  )
}

// ----- First Four section -----

function FirstFourSection({
  teams,
  picks,
  onPick,
}: {
  teams: BracketTeam[]
  picks: Picks
  onPick: (matchupId: string, teamId: string) => void
}) {
  const ffPairs = useMemo(() => getFirstFourPairs(teams), [teams])
  if (ffPairs.length === 0) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <h2 className="mb-3 border-b border-gray-100 pb-2 text-sm font-bold uppercase tracking-wider text-gray-700">
        First Four — Play-In Games
      </h2>
      <p className="text-xs text-gray-400 mb-3">
        Pick the winner of each play-in game. That team advances to the Round of 64.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ffPairs.map(pair => {
          const winner = ffWinner(pair, picks)
          return (
            <div key={pair.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {pair.region} · #{pair.seed} seed slot
              </div>
              <Matchup
                id={pair.id}
                top={pair.top}
                bottom={pair.bottom}
                picks={picks}
                onPick={onPick}
              />
              {winner && (
                <p className="mt-2 text-[10px] text-gray-400 text-center">
                  ✓ <span className="text-gray-600 font-medium">{winner.abbreviation ?? winner.name}</span> advances to R64
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ----- one region bracket column -----

type RegionRounds = {
  r1: Array<{ id: string; top: BracketTeam | null; bottom: BracketTeam | null }>
  r2: Array<{ id: string; top: BracketTeam | null; bottom: BracketTeam | null }>
  s16: Array<{ id: string; top: BracketTeam | null; bottom: BracketTeam | null }>
  e8: { id: string; top: BracketTeam | null; bottom: BracketTeam | null }
}

function buildRegionRounds(
  region: Region,
  teams: BracketTeam[],
  picks: Picks,
  ffPairs: FFPair[]
): RegionRounds {
  const rt = getRegionTeams(teams, region)

  // Round 1 — uses FF-aware teamBySeed so FF slots show TBD until FF is picked
  const r1 = SEED_PAIRS.map(([s1, s2], i) => ({
    id: `${region}-R1-G${i + 1}`,
    top: teamBySeed(rt, s1, region, ffPairs, picks),
    bottom: teamBySeed(rt, s2, region, ffPairs, picks),
  }))

  function r1Winner(gameIdx: number): BracketTeam | null {
    const g = r1[gameIdx]
    const pickedId = picks[g.id]
    if (!pickedId) return null
    return g.top?.id === pickedId ? g.top : g.bottom?.id === pickedId ? g.bottom : null
  }

  const r2 = [
    { id: `${region}-R2-G1`, top: r1Winner(0), bottom: r1Winner(1) },
    { id: `${region}-R2-G2`, top: r1Winner(2), bottom: r1Winner(3) },
    { id: `${region}-R2-G3`, top: r1Winner(4), bottom: r1Winner(5) },
    { id: `${region}-R2-G4`, top: r1Winner(6), bottom: r1Winner(7) },
  ]

  function r2Winner(gameIdx: number): BracketTeam | null {
    const g = r2[gameIdx]
    const pickedId = picks[g.id]
    if (!pickedId) return null
    return g.top?.id === pickedId ? g.top : g.bottom?.id === pickedId ? g.bottom : null
  }

  const s16 = [
    { id: `${region}-S16-G1`, top: r2Winner(0), bottom: r2Winner(1) },
    { id: `${region}-S16-G2`, top: r2Winner(2), bottom: r2Winner(3) },
  ]

  function s16Winner(gameIdx: number): BracketTeam | null {
    const g = s16[gameIdx]
    const pickedId = picks[g.id]
    if (!pickedId) return null
    return g.top?.id === pickedId ? g.top : g.bottom?.id === pickedId ? g.bottom : null
  }

  const e8 = {
    id: `${region}-E8-G1`,
    top: s16Winner(0),
    bottom: s16Winner(1),
  }

  return { r1, r2, s16, e8 }
}

function RegionBracket({
  region,
  teams,
  picks,
  onPick,
  ffPairs,
}: {
  region: Region
  teams: BracketTeam[]
  picks: Picks
  onPick: (matchupId: string, teamId: string) => void
  ffPairs: FFPair[]
}) {
  const rounds = buildRegionRounds(region, teams, picks, ffPairs)

  // Find any FF pairs for this region so we can label TBD slots
  const regionFF = ffPairs.filter(p => p.region === region)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <h2 className="mb-3 border-b border-gray-100 pb-2 text-sm font-bold uppercase tracking-wider text-gray-700">
        {region} Region
      </h2>
      <div className="overflow-x-auto">
        <div className="flex gap-2 pb-1" style={{ minWidth: '760px', height: '680px' }}>

          {/* Round 1 — 8 slots, each gets 1/8 height */}
          <div className="flex flex-col" style={{ width: '185px' }}>
            <div className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">Round of 64</div>
            <div className="flex flex-col flex-1">
              {rounds.r1.map((g, i) => {
                const [s1, s2] = SEED_PAIRS[i]
                const ffTop = regionFF.find(p => p.seed === s1)
                const ffBot = regionFF.find(p => p.seed === s2)
                return (
                  <div key={g.id} className="flex flex-1 flex-col justify-center px-0.5 py-0.5">
                    <Matchup
                      id={g.id}
                      top={g.top}
                      bottom={g.bottom}
                      picks={picks}
                      onPick={onPick}
                      topPlaceholder={ffTop ? `#${s1} FF winner` : undefined}
                      bottomPlaceholder={ffBot ? `#${s2} FF winner` : undefined}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Round 2 — 4 slots, each gets 1/4 height = 2 R1 slots */}
          <div className="flex flex-col" style={{ width: '185px' }}>
            <div className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">Round of 32</div>
            <div className="flex flex-col flex-1">
              {rounds.r2.map((g) => (
                <div key={g.id} className="flex flex-1 flex-col justify-center px-0.5 py-0.5">
                  <Matchup id={g.id} top={g.top} bottom={g.bottom} picks={picks} onPick={onPick} />
                </div>
              ))}
            </div>
          </div>

          {/* Sweet 16 — 2 slots, each gets 1/2 height */}
          <div className="flex flex-col" style={{ width: '185px' }}>
            <div className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">Sweet 16</div>
            <div className="flex flex-col flex-1">
              {rounds.s16.map((g) => (
                <div key={g.id} className="flex flex-1 flex-col justify-center px-0.5 py-0.5">
                  <Matchup id={g.id} top={g.top} bottom={g.bottom} picks={picks} onPick={onPick} />
                </div>
              ))}
            </div>
          </div>

          {/* Elite 8 — 1 slot, full height */}
          <div className="flex flex-col" style={{ width: '185px' }}>
            <div className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">Elite 8</div>
            <div className="flex flex-col flex-1">
              <div className="flex flex-1 flex-col justify-center px-0.5 py-0.5">
                <Matchup id={rounds.e8.id} top={rounds.e8.top} bottom={rounds.e8.bottom} picks={picks} onPick={onPick} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ----- Final Four + Championship -----

function FinalFour({
  teams,
  picks,
  onPick,
  ffPairs,
}: {
  teams: BracketTeam[]
  picks: Picks
  onPick: (matchupId: string, teamId: string) => void
  ffPairs: FFPair[]
}) {
  function e8Winner(region: Region): BracketTeam | null {
    const rounds = buildRegionRounds(region, teams, picks, ffPairs)
    const g = rounds.e8
    const pickedId = picks[g.id]
    if (!pickedId) return null
    return g.top?.id === pickedId ? g.top : g.bottom?.id === pickedId ? g.bottom : null
  }

  const sf1 = { id: 'FF-SF1', top: e8Winner('South'), bottom: e8Winner('East') }
  const sf2 = { id: 'FF-SF2', top: e8Winner('West'), bottom: e8Winner('Midwest') }

  function sfWinner(g: typeof sf1): BracketTeam | null {
    const pickedId = picks[g.id]
    if (!pickedId) return null
    return g.top?.id === pickedId ? g.top : g.bottom?.id === pickedId ? g.bottom : null
  }

  const champ = { id: 'CHAMP', top: sfWinner(sf1), bottom: sfWinner(sf2) }
  const champWinner = (() => {
    const pickedId = picks[champ.id]
    if (!pickedId) return null
    return champ.top?.id === pickedId ? champ.top : champ.bottom?.id === pickedId ? champ.bottom : null
  })()

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 border-b border-gray-100 pb-2 text-sm font-bold uppercase tracking-wider text-gray-700">
        Final Four &amp; Championship
      </h2>

      <div className="flex flex-wrap items-start justify-center gap-8">
        {/* Semifinal 1 */}
        <div style={{ minWidth: '180px' }}>
          <div className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            South vs East
          </div>
          <Matchup id={sf1.id} top={sf1.top} bottom={sf1.bottom} picks={picks} onPick={onPick} />
        </div>

        {/* Championship */}
        <div style={{ minWidth: '200px' }}>
          <div className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Championship
          </div>
          <Matchup id={champ.id} top={champ.top} bottom={champ.bottom} picks={picks} onPick={onPick} />
          {champWinner && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-center shadow-sm">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">Your Champion</div>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="text-xl font-bold text-gray-900">{champWinner.name}</span>
                <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-semibold text-gray-600">
                  #{champWinner.seed} seed
                </span>
              </div>
              {champWinner.stats?.adjEM !== undefined && (
                <div className="mt-1 text-xs text-gray-400">
                  adjEM: {champWinner.stats.adjEM.toFixed(1)} · Off: {champWinner.stats.adjOE?.toFixed(1)} · Def: {champWinner.stats.adjDE?.toFixed(1)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Semifinal 2 */}
        <div style={{ minWidth: '180px' }}>
          <div className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            West vs Midwest
          </div>
          <Matchup id={sf2.id} top={sf2.top} bottom={sf2.bottom} picks={picks} onPick={onPick} />
        </div>
      </div>
    </div>
  )
}

// ----- completion meter -----

function CompletionMeter({ picks, totalMatchups }: { picks: Picks; totalMatchups: number }) {
  const filled = Object.keys(picks).length
  const pct = Math.round((filled / totalMatchups) * 100)

  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-1.5 rounded-full bg-gray-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs tabular-nums text-gray-500">
        {filled}/{totalMatchups} picks ({pct}%)
      </span>
    </div>
  )
}

// ----- main export -----

export default function InteractiveBracket({ teams }: { teams: BracketTeam[] }) {
  const ffPairs = useMemo(() => getFirstFourPairs(teams), [teams])

  const [picks, setPicks] = useState<Picks>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const saved = localStorage.getItem('madnesslab-picks-2026')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const handlePick = useCallback((matchupId: string, teamId: string) => {
    setPicks((prev) => {
      const next = { ...prev }

      if (next[matchupId] === teamId) {
        delete next[matchupId]
      } else {
        next[matchupId] = teamId
      }

      try {
        localStorage.setItem('madnesslab-picks-2026', JSON.stringify(next))
      } catch {}

      return next
    })
  }, [])

  const handleReset = () => {
    setPicks({})
    try {
      localStorage.removeItem('madnesslab-picks-2026')
    } catch {}
  }

  // 4 FF + 32 R1 + 16 R2 + 8 S16 + 4 E8 + 2 FF + 1 Champ = 67
  const TOTAL_MATCHUPS = 67

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight">2026 NCAA Tournament Bracket</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Start with the First Four play-ins, then fill your bracket. Picks auto-save.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden w-48 sm:block">
            <CompletionMeter picks={picks} totalMatchups={TOTAL_MATCHUPS} />
          </div>
          <button
            onClick={handleReset}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Mobile completion */}
      <div className="sm:hidden px-1">
        <CompletionMeter picks={picks} totalMatchups={TOTAL_MATCHUPS} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 px-1 text-[11px] text-gray-400">
        <span>Click a team to pick · click again to deselect</span>
        <span><span className="font-medium text-gray-500">72%</span> = projected win probability (T-Rank)</span>
      </div>

      {/* First Four — must pick these before R64 slots unlock */}
      <FirstFourSection teams={teams} picks={picks} onPick={handlePick} />

      {/* Regions */}
      <div className="space-y-4">
        {REGIONS.map((region) => (
          <RegionBracket
            key={region}
            region={region}
            teams={teams}
            picks={picks}
            onPick={handlePick}
            ffPairs={ffPairs}
          />
        ))}
      </div>

      {/* Final Four */}
      <FinalFour teams={teams} picks={picks} onPick={handlePick} ffPairs={ffPairs} />
    </div>
  )
}
