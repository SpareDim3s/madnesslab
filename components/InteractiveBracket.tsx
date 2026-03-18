'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

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

// ─────────────────────────────────────────────────────────────
//  ART NOUVEAU BADGE COMPONENTS
// ─────────────────────────────────────────────────────────────

/** Ornate Art Nouveau "FINAL FOUR" logo for the center column header */
function FinalFourLogo() {
  return (
    <svg width="176" height="68" viewBox="0 0 176 68" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', margin: '0 auto 8px' }}>
      {/* Navy background */}
      <rect x="2" y="2" width="172" height="64" rx="5" fill="#1a1625"/>
      {/* Outer gold border */}
      <rect x="2" y="2" width="172" height="64" rx="5" stroke="#a0832a" strokeWidth="1.5"/>
      {/* Inner double border */}
      <rect x="6.5" y="6.5" width="163" height="55" rx="3" stroke="#c4a84a" strokeWidth="0.6" opacity="0.7"/>

      {/* Top ornamental bar */}
      <line x1="26" y1="14" x2="150" y2="14" stroke="#a0832a" strokeWidth="0.5" opacity="0.6"/>
      {/* Bottom ornamental bar */}
      <line x1="26" y1="54" x2="150" y2="54" stroke="#a0832a" strokeWidth="0.5" opacity="0.6"/>

      {/* Left diamond cluster */}
      <polygon points="18,34 23,29 28,34 23,39" fill="#a0832a"/>
      <polygon points="18,34 23,29 28,34 23,39" fill="#f0e8d0" opacity="0.25"/>
      <circle cx="18" cy="34" r="1.5" fill="#c4a84a" opacity="0.5"/>
      <circle cx="28" cy="34" r="1.5" fill="#c4a84a" opacity="0.5"/>

      {/* Right diamond cluster */}
      <polygon points="148,34 153,29 158,34 153,39" fill="#a0832a"/>
      <polygon points="148,34 153,29 158,34 153,39" fill="#f0e8d0" opacity="0.25"/>
      <circle cx="148" cy="34" r="1.5" fill="#c4a84a" opacity="0.5"/>
      <circle cx="158" cy="34" r="1.5" fill="#c4a84a" opacity="0.5"/>

      {/* "FINAL" text */}
      <text x="88" y="28" textAnchor="middle" fill="#c4a84a" fontSize="9.5"
        fontFamily="'Playfair Display', Georgia, serif" letterSpacing="6" fontWeight="700">
        FINAL
      </text>

      {/* Center divider with flanking dots */}
      <line x1="36" y1="35" x2="74" y2="35" stroke="#a0832a" strokeWidth="0.6"/>
      <circle cx="80" cy="35" r="1.2" fill="#a0832a"/>
      <circle cx="86" cy="35" r="2" fill="#c4a84a"/>
      <circle cx="92" cy="35" r="1.2" fill="#a0832a"/>
      <line x1="98" y1="35" x2="140" y2="35" stroke="#a0832a" strokeWidth="0.6"/>

      {/* "FOUR" text */}
      <text x="88" y="52" textAnchor="middle" fill="#f0e8d0" fontSize="17"
        fontFamily="'Playfair Display', Georgia, serif" letterSpacing="7" fontWeight="700">
        FOUR
      </text>
    </svg>
  )
}

/** Trophy SVG — replaces the 🏆 emoji in the Championship header */
function TrophySVG() {
  return (
    <svg width="22" height="26" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 5, marginBottom: 2 }}>
      <path d="M5 2 L5 11 Q5 18 11 18 Q17 18 17 11 L17 2 Z" fill="#c4a84a"/>
      <path d="M5 2 L5 11 Q5 18 11 18 Q17 18 17 11 L17 2 Z" fill="white" opacity="0.15"/>
      <path d="M5 4 Q1 4 1 8 Q1 12 5 12" stroke="#a0832a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M17 4 Q21 4 21 8 Q21 12 17 12" stroke="#a0832a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <rect x="9.5" y="18" width="3" height="4" fill="#a0832a"/>
      <rect x="6" y="22" width="10" height="2.5" rx="1.2" fill="#a0832a"/>
      <rect x="4" y="24" width="14" height="1.5" rx="0.8" fill="#c4a84a"/>
      <polygon points="11,4 11.8,6.5 14.5,6.5 12.3,8 13.1,10.5 11,9 8.9,10.5 9.7,8 7.5,6.5 10.2,6.5" fill="#f0e8d0" opacity="0.85"/>
    </svg>
  )
}

/** Full Art Nouveau champion reveal card — shown when user picks their champion */
function ChampionReveal({ team }: { team: BracketTeam }) {
  const logoUrl = team.espnId
    ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.espnId}.png`
    : null
  return (
    <div style={{ position: 'relative', background: '#1a1625', borderRadius: 8, border: '1.5px solid #a0832a', padding: '10px 8px 8px', overflow: 'hidden', marginTop: 8 }}>
      {/* Inner double border */}
      <div style={{ position: 'absolute', inset: 4, border: '0.5px solid rgba(196,168,74,0.4)', borderRadius: 5, pointerEvents: 'none' }}/>

      {/* Arced "CHAMPION" text */}
      <svg width="156" height="22" viewBox="0 0 156 22" style={{ display: 'block', margin: '0 auto' }}>
        <defs>
          <path id="champArc" d="M 10 20 A 68 68 0 0 1 146 20"/>
        </defs>
        <text fontSize="7.5" fontWeight="700" letterSpacing="3.5" fill="#c4a84a"
          fontFamily="'Playfair Display', Georgia, serif">
          <textPath href="#champArc">C H A M P I O N</textPath>
        </text>
      </svg>

      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={team.name} width={44} height={44}
          style={{ display: 'block', margin: '4px auto', objectFit: 'contain' }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div style={{ height: 12 }} />
      )}

      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#f0e8d0', fontFamily: '"Playfair Display", serif', marginTop: 2, lineHeight: 1.2 }}>
        {team.name}
      </div>
      <div style={{ textAlign: 'center', fontSize: 10, color: '#a0832a', marginTop: 3, letterSpacing: '0.05em' }}>
        #{team.seed} Seed
      </div>

      {/* Laurel + star footer */}
      <svg width="156" height="18" viewBox="0 0 156 18" style={{ display: 'block', margin: '6px auto 0' }}>
        <ellipse cx="36" cy="9" rx="14" ry="4" fill="#a0832a" opacity="0.55" transform="rotate(-12, 36, 9)"/>
        <ellipse cx="22" cy="10" rx="10" ry="3" fill="#a0832a" opacity="0.35" transform="rotate(-20, 22, 10)"/>
        <ellipse cx="12" cy="11" rx="7" ry="2.5" fill="#a0832a" opacity="0.2" transform="rotate(-28, 12, 11)"/>
        <ellipse cx="120" cy="9" rx="14" ry="4" fill="#a0832a" opacity="0.55" transform="rotate(12, 120, 9)"/>
        <ellipse cx="134" cy="10" rx="10" ry="3" fill="#a0832a" opacity="0.35" transform="rotate(20, 134, 10)"/>
        <ellipse cx="144" cy="11" rx="7" ry="2.5" fill="#a0832a" opacity="0.2" transform="rotate(28, 144, 11)"/>
        <polygon points="78,2 79.8,7 85,7 80.9,10.2 82.4,15.2 78,12.4 73.6,15.2 75.1,10.2 71,7 76.2,7" fill="#c4a84a"/>
      </svg>
    </div>
  )
}

/** Styled round-label badges for column headers */
function RoundBadge({ label }: { label: string }) {
  if (label === 'E8') {
    return (
      <div style={{ textAlign: 'center', marginBottom: 5 }}>
        <svg width="148" height="22" viewBox="0 0 148 22" fill="none" style={{ display: 'block', margin: '0 auto' }}>
          <rect x="1" y="1" width="146" height="20" rx="3.5" fill="#1a1625" stroke="#a0832a" strokeWidth="1.2"/>
          <rect x="4" y="4" width="140" height="14" rx="2" stroke="#c4a84a" strokeWidth="0.5" opacity="0.6"/>
          <polygon points="13,11 16,8 19,11 16,14" fill="#c4a84a" opacity="0.8"/>
          <polygon points="129,11 132,8 135,11 132,14" fill="#c4a84a" opacity="0.8"/>
          <text x="74" y="15" textAnchor="middle" fill="#c4a84a" fontSize="7.5"
            fontFamily="'Playfair Display', Georgia, serif" letterSpacing="3" fontWeight="700">
            ELITE EIGHT
          </text>
        </svg>
      </div>
    )
  }
  if (label === 'S16') {
    return (
      <div style={{ textAlign: 'center', marginBottom: 5 }}>
        <svg width="148" height="22" viewBox="0 0 148 22" fill="none" style={{ display: 'block', margin: '0 auto' }}>
          <rect x="1" y="1" width="146" height="20" rx="3.5" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.2"/>
          <rect x="4" y="4" width="140" height="14" rx="2" stroke="#60a5fa" strokeWidth="0.5" opacity="0.5"/>
          <text x="74" y="15" textAnchor="middle" fill="#93c5fd" fontSize="7.5"
            fontFamily="'Playfair Display', Georgia, serif" letterSpacing="3" fontWeight="700">
            SWEET SIXTEEN
          </text>
        </svg>
      </div>
    )
  }
  if (label === 'R32') {
    return (
      <div style={{ fontSize: 8.5, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em',
        color: '#8b7d6b', textAlign: 'center' as const, marginBottom: 4 }}>
        Round of 32
      </div>
    )
  }
  return (
    <div style={{ fontSize: 8.5, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em',
      color: '#8b7d6b', textAlign: 'center' as const, marginBottom: 4 }}>
      First Round
    </div>
  )
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
  flip,
}: {
  region: Region
  teams: BracketTeam[]
  picks: Picks
  onPick: (matchupId: string, teamId: string) => void
  ffPairs: FFPair[]
  flip?: boolean
}) {
  const rounds = buildRegionRounds(region, teams, picks, ffPairs)
  const regionFF = ffPairs.filter(p => p.region === region)

  const ROUND_LABEL_STYLE: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: '#a0832a',
    textAlign: 'center' as const,
    marginBottom: 4,
  }

  const columns = [
    {
      label: 'R64',
      width: 168,
      content: rounds.r1.map((g, i) => {
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
      }),
    },
    {
      label: 'R32',
      width: 168,
      content: rounds.r2.map((g) => (
        <div key={g.id} className="flex flex-1 flex-col justify-center px-0.5 py-0.5">
          <Matchup id={g.id} top={g.top} bottom={g.bottom} picks={picks} onPick={onPick} />
        </div>
      )),
    },
    {
      label: 'S16',
      width: 168,
      content: rounds.s16.map((g) => (
        <div key={g.id} className="flex flex-1 flex-col justify-center px-0.5 py-0.5">
          <Matchup id={g.id} top={g.top} bottom={g.bottom} picks={picks} onPick={onPick} />
        </div>
      )),
    },
    {
      label: 'E8',
      width: 168,
      content: [
        <div key={rounds.e8.id} className="flex flex-1 flex-col justify-center px-0.5 py-0.5">
          <Matchup id={rounds.e8.id} top={rounds.e8.top} bottom={rounds.e8.bottom} picks={picks} onPick={onPick} />
        </div>
      ],
    },
  ]

  const orderedCols = flip ? [...columns].reverse() : columns

  return (
    <div style={{ padding: '0 0 4px 0' }}>
      {/* Region label */}
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#1a1625',
        fontFamily: '"Playfair Display", Georgia, serif',
        textAlign: flip ? 'right' : 'left',
        padding: '4px 8px',
        letterSpacing: '0.03em',
      }}>
        {region}
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: 2, height: 640 }}>
        {orderedCols.map((col) => (
          <div key={col.label} className="flex flex-col" style={{ width: col.width }}>
            <RoundBadge label={col.label} />
            <div className="flex flex-col flex-1">
              {col.content}
            </div>
          </div>
        ))}
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '0 8px' }}>
      {/* SF1: South vs East */}
      <div style={{ width: 172 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: '#a0832a', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', marginBottom: 4 }}>
          South · East
        </div>
        <Matchup id={sf1.id} top={sf1.top} bottom={sf1.bottom} picks={picks} onPick={onPick} />
      </div>

      {/* Championship */}
      <div style={{ width: 172 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
          <TrophySVG />
          <span style={{ fontSize: 9, fontWeight: 700, color: '#1a1625', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"Playfair Display", serif' }}>
            Championship
          </span>
        </div>
        <Matchup id={champ.id} top={champ.top} bottom={champ.bottom} picks={picks} onPick={onPick} />
        {champWinner && <ChampionReveal team={champWinner} />}
      </div>

      {/* SF2: West vs Midwest */}
      <div style={{ width: 172 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: '#a0832a', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', marginBottom: 4 }}>
          West · Midwest
        </div>
        <Matchup id={sf2.id} top={sf2.top} bottom={sf2.bottom} picks={picks} onPick={onPick} />
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

// ----- URL share helpers -----

function encodePicks(picks: Picks): string {
  try {
    return btoa(JSON.stringify(picks))
  } catch {
    return ''
  }
}

function decodePicks(hash: string): Picks | null {
  try {
    const raw = hash.startsWith('#') ? hash.slice(1) : hash
    if (!raw) return null
    return JSON.parse(atob(raw)) as Picks
  } catch {
    return null
  }
}

// ----- main export -----

export default function InteractiveBracket({ teams }: { teams: BracketTeam[] }) {
  const ffPairs = useMemo(() => getFirstFourPairs(teams), [teams])
  const [copied, setCopied] = useState(false)

  const [picks, setPicks] = useState<Picks>(() => {
    if (typeof window === 'undefined') return {}
    // Priority: URL hash > localStorage
    const hashPicks = decodePicks(window.location.hash)
    if (hashPicks && Object.keys(hashPicks).length > 0) return hashPicks
    try {
      const saved = localStorage.getItem('madnesslab-picks-2026')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // Keep URL hash in sync (debounced)
  useEffect(() => {
    const encoded = encodePicks(picks)
    if (Object.keys(picks).length > 0) {
      history.replaceState(null, '', `#${encoded}`)
    } else {
      history.replaceState(null, '', window.location.pathname)
    }
  }, [picks])

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

  const handleShare = async () => {
    const encoded = encodePicks(picks)
    const url = `${window.location.origin}/bracket#${encoded}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback: select the URL from a prompt
      window.prompt('Copy this link to share your bracket:', url)
    }
  }

  // 4 FF + 32 R1 + 16 R2 + 8 S16 + 4 E8 + 2 FF + 1 Champ = 67
  const TOTAL_MATCHUPS = 67
  const filledCount = Object.keys(picks).length

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderRadius: 12,
        border: '1px solid #e8e0d0',
        background: '#ffffff',
        padding: 16,
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif' }}>
            2026 NCAA Tournament Bracket
          </h1>
          <p style={{ fontSize: 12, color: '#8b7d6b', marginTop: 2 }}>
            Start with the First Four play-ins, then fill your bracket. Picks auto-save.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden w-48 sm:block">
            <CompletionMeter picks={picks} totalMatchups={TOTAL_MATCHUPS} />
          </div>
          {filledCount > 0 && (
            <button
              onClick={handleShare}
              style={{
                borderRadius: 8,
                border: copied ? '1px solid #86efac' : '1px solid #2563eb',
                background: copied ? '#f0fdf4' : '#2563eb',
                color: copied ? '#166534' : '#ffffff',
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {copied ? '✓ Link copied!' : '🔗 Share Bracket'}
            </button>
          )}
          <button
            onClick={handleReset}
            style={{
              borderRadius: 8,
              border: '1px solid #e8e0d0',
              background: '#fdfcf8',
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 500,
              color: '#8b7d6b',
              cursor: 'pointer',
            }}
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px', padding: '0 4px', fontSize: 11, color: '#8b7d6b' }}>
        <span>Click a team to pick · click again to deselect</span>
        <span><span style={{ fontWeight: 600, color: '#4a4560' }}>72%</span> = projected win probability (T-Rank)</span>
      </div>

      {/* First Four — must pick these before R64 slots unlock */}
      <FirstFourSection teams={teams} picks={picks} onPick={handlePick} />

      {/* Full printed bracket — horizontal NCAA-style layout */}
      <div style={{
        borderRadius: 12,
        border: '1px solid #e8e0d0',
        background: '#ffffff',
        padding: 16,
        overflowX: 'auto',
      }}>
        <div style={{ minWidth: 1380, display: 'flex', gap: 0, alignItems: 'stretch' }}>

          {/* LEFT HALF: South (top) + East (bottom) — rounds flow L→R */}
          <div style={{ flex: '0 0 680px', borderRight: '1px solid #e8e0d0' }}>
            <RegionBracket
              region="South"
              teams={teams}
              picks={picks}
              onPick={handlePick}
              ffPairs={ffPairs}
              flip={false}
            />
            <div style={{ borderTop: '1px solid #f0e8d0', marginTop: 4 }} />
            <RegionBracket
              region="East"
              teams={teams}
              picks={picks}
              onPick={handlePick}
              ffPairs={ffPairs}
              flip={false}
            />
          </div>

          {/* CENTER: Final Four + Championship */}
          <div style={{
            flex: '0 0 196px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            borderRight: '1px solid #e8e0d0',
            padding: '8px 4px',
          }}>
            <FinalFourLogo />
            <FinalFour teams={teams} picks={picks} onPick={handlePick} ffPairs={ffPairs} />
          </div>

          {/* RIGHT HALF: West (top) + Midwest (bottom) — rounds flow R→L */}
          <div style={{ flex: '0 0 680px' }}>
            <RegionBracket
              region="West"
              teams={teams}
              picks={picks}
              onPick={handlePick}
              ffPairs={ffPairs}
              flip={true}
            />
            <div style={{ borderTop: '1px solid #f0e8d0', marginTop: 4 }} />
            <RegionBracket
              region="Midwest"
              teams={teams}
              picks={picks}
              onPick={handlePick}
              ffPairs={ffPairs}
              flip={true}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
