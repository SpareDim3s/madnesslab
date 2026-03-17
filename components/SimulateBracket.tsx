'use client'

import { useState } from 'react'
import { Trophy, Zap, AlertTriangle, TrendingUp, RefreshCw, FlaskConical } from 'lucide-react'

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
  r64Upsets: UpsetInfo[]
  lateUpsets: LateUpset[]
  titleOdds: TitleOddsEntry[]
}

// ─── Explanation Generator ────────────────────────────────────────────────────

function buildChampionNarrative(champion: Team): string {
  const { stats, seed, titleProfileScore, keyPlayers } = champion
  const adjEM = stats?.adjEM ?? 0
  const adjOE = stats?.adjOE ?? 0
  const adjDE = stats?.adjDE ?? 0
  const tempo = stats?.tempo ?? 70
  const kenpomRank = stats?.kenpomRank

  const lines: string[] = []

  // Opening — seed + program strength
  if (seed === 1) {
    lines.push(`${champion.name} lived up to their #1 seed, validating what the efficiency metrics have said all season.`)
  } else if (seed <= 3) {
    lines.push(`${champion.name} was a heavy pre-tournament favorite, and the stats backed it up all the way.`)
  } else if (seed <= 5) {
    lines.push(`${champion.name} was expected to make a deep run, and they delivered — cutting down the nets as a #${seed} seed.`)
  } else {
    lines.push(`${champion.name} pulled off the run of the tournament, winning it all as a #${seed} seed — a result the variance model flagged as possible.`)
  }

  // Efficiency narrative
  if (kenpomRank && kenpomRank <= 5) {
    lines.push(`Their adjusted efficiency margin of +${adjEM.toFixed(1)} ranked them among the top 5 teams nationally — a level where champions are almost always found.`)
  } else if (adjEM >= 28) {
    lines.push(`An elite efficiency margin of +${adjEM.toFixed(1)} separated them from the field all the way to the championship.`)
  } else if (adjEM >= 22) {
    lines.push(`A strong efficiency margin of +${adjEM.toFixed(1)} gave them a meaningful edge in every round.`)
  }

  // Offense vs Defense profile
  const offRank = adjOE >= 124 ? 'historic' : adjOE >= 120 ? 'elite' : adjOE >= 116 ? 'very good' : 'solid'
  const defRank = adjDE <= 89 ? 'historically stingy' : adjDE <= 92 ? 'elite' : adjDE <= 95 ? 'very good' : 'solid'

  if (adjDE < 93 && adjOE > 118) {
    lines.push(`They were lethal on both ends — ${offRank} offense (adjOE ${adjOE.toFixed(1)}) paired with ${defRank} defense (adjDE ${adjDE.toFixed(1)}). Two-way excellence is the hallmark of almost every champion.`)
  } else if (adjDE < 93) {
    lines.push(`Defense wins championships — and ${champion.name}'s ${defRank} defense (adjDE ${adjDE.toFixed(1)}) was the engine. They never let opponents get comfortable.`)
  } else {
    lines.push(`Their ${offRank} offense (adjOE ${adjOE.toFixed(1)}) was unstoppable at key moments, creating separation when it mattered most.`)
  }

  // Tempo
  if (tempo < 66) {
    lines.push(`Their slow, deliberate pace (${tempo.toFixed(1)} possessions/game) neutralized opponents who relied on fast-break points, reducing the variance that causes upsets.`)
  } else if (tempo > 74) {
    lines.push(`Their fast-paced attack (${tempo.toFixed(1)} possessions/game) overwhelmed teams that tried to keep up, and they had the efficiency to thrive in high-possession games.`)
  }

  // Title profile score
  if (titleProfileScore && titleProfileScore >= 70) {
    lines.push(`Their title profile score of ${titleProfileScore} matches the historical fingerprint of champions — elite defense, controlled tempo, and top-tier efficiency.`)
  }

  // Key players
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

function SeedBadge({ seed }: { seed: number }) {
  const colors =
    seed === 1 ? 'bg-yellow-500 text-white' :
    seed <= 3 ? 'bg-orange-500 text-white' :
    seed <= 5 ? 'bg-blue-500 text-white' :
    seed <= 8 ? 'bg-gray-500 text-white' :
    'bg-gray-700 text-gray-300'

  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${colors}`}>
      {seed}
    </span>
  )
}

function SmallTeamRow({ team }: { team: Team }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2">
      <SeedBadge seed={team.seed} />
      <TeamLogo team={team} size={20} />
      <span className="text-sm font-medium text-gray-200">{team.name}</span>
      <span className="ml-auto text-xs text-gray-500">{team.region}</span>
    </div>
  )
}

// ─── Hero (pre-simulate) ──────────────────────────────────────────────────────

function SimulateHero({ onSimulate, loading }: { onSimulate: () => void; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-8 text-center shadow-xl">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/20">
        <FlaskConical className="h-8 w-8 text-orange-400" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-white">Run the Tournament</h2>
      <p className="mx-auto mb-2 max-w-lg text-gray-400 text-sm leading-relaxed">
        MadnessLab&rsquo;s 4-layer prediction engine simulates all 67 games using real T-Rank efficiency stats,
        matchup adjustments, historical upset rates, and variance modeling.
      </p>
      <p className="mx-auto mb-8 max-w-lg text-gray-500 text-xs leading-relaxed">
        Each click runs a fresh simulation. Favorites win most of the time — but the model accounts for the chaos.
      </p>

      <button
        onClick={onSimulate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-8 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-orange-400 disabled:opacity-60"
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

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600">
        {[
          { icon: '📊', label: 'Layer 1', desc: 'Efficiency margin' },
          { icon: '⚡', label: 'Layer 2', desc: 'Matchup adjustments' },
          { icon: '🗂️', label: 'Layer 3', desc: 'Historical upset rates' },
          { icon: '🎲', label: 'Layer 4', desc: 'Chaos & variance' },
        ].map(l => (
          <div key={l.label} className="rounded-lg border border-gray-800 bg-gray-900/40 p-2.5">
            <div className="text-base mb-0.5">{l.icon}</div>
            <div className="font-semibold text-gray-500">{l.label}</div>
            <div className="text-gray-600">{l.desc}</div>
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
    <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-950/40 via-gray-900 to-orange-950/30 p-6 shadow-xl">
      {/* Crown banner */}
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-400" />
        <span className="text-sm font-bold uppercase tracking-wider text-yellow-400">2026 Champion</span>
      </div>

      {/* Team identity */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-800/60">
          {champion.espnId ? (
            <TeamLogo team={champion} size={48} />
          ) : (
            <span className="text-2xl font-black text-white">{champion.abbreviation?.slice(0, 2)}</span>
          )}
        </div>
        <div>
          <h2 className="text-3xl font-black text-white leading-none">{champion.name}</h2>
          <div className="mt-1 flex items-center gap-2">
            <SeedBadge seed={champion.seed} />
            <span className="text-sm text-gray-400">{champion.region} Region</span>
            {champion.conference && (
              <span className="text-xs text-gray-600">· {champion.conference}</span>
            )}
          </div>
        </div>
      </div>

      {/* Key stats row */}
      {stats && (
        <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {[
            { label: 'adjEM', value: stats.adjEM?.toFixed(1) ?? '—', accent: 'text-orange-400' },
            { label: 'adjOE', value: stats.adjOE?.toFixed(1) ?? '—', accent: 'text-blue-400' },
            { label: 'adjDE', value: stats.adjDE?.toFixed(1) ?? '—', accent: 'text-green-400' },
            { label: 'Tempo', value: stats.tempo?.toFixed(1) ?? '—', accent: 'text-purple-400' },
            { label: 'T-Rank', value: stats.kenpomRank ? `#${stats.kenpomRank}` : '—', accent: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-gray-800 bg-gray-900/60 p-2.5 text-center">
              <div className={`text-base font-bold tabular-nums ${s.accent}`}>{s.value}</div>
              <div className="text-[10px] text-gray-600 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Narrative explanation */}
      <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-orange-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-orange-400">Why they won</span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{narrative}</p>
      </div>

      {/* Key players */}
      {champion.keyPlayers && champion.keyPlayers.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Key Players</div>
          <div className="flex flex-wrap gap-2">
            {champion.keyPlayers.slice(0, 3).map(p => (
              <div key={p.name} className="flex items-center gap-1.5 rounded-full border border-gray-800 bg-gray-900/60 px-3 py-1 text-xs">
                <span className="font-medium text-gray-200">{p.name}</span>
                <span className="text-gray-500">{p.ppg} ppg</span>
                {p.position && <span className="text-gray-600">· {p.position}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Final Four section ───────────────────────────────────────────────────────

function FinalFourSection({ finalFour, champion }: { finalFour: Team[]; champion: Team }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
      <h3 className="mb-4 text-base font-bold text-white">Final Four</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {finalFour.map(team => (
          <div
            key={team.id}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
              team.id === champion.id
                ? 'border-yellow-500/40 bg-yellow-950/30'
                : 'border-gray-800 bg-gray-900/40'
            }`}
          >
            <SeedBadge seed={team.seed} />
            <TeamLogo team={team} size={24} />
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-200">{team.name}</span>
              <span className="ml-2 text-xs text-gray-600">{team.region}</span>
            </div>
            {team.id === champion.id && (
              <Trophy className="h-4 w-4 text-yellow-400 shrink-0" />
            )}
            {team.stats?.adjEM !== undefined && (
              <span className="text-xs tabular-nums text-gray-500">
                +{team.stats.adjEM.toFixed(1)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Upsets section ───────────────────────────────────────────────────────────

function UpsetCallouts({ r64Upsets, lateUpsets, allTeams }: {
  r64Upsets: UpsetInfo[]
  lateUpsets: LateUpset[]
  allTeams?: never // unused but keeps API clear
}) {
  void allTeams

  if (r64Upsets.length === 0 && lateUpsets.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <h3 className="mb-2 text-base font-bold text-white">Notable Upsets</h3>
        <p className="text-sm text-gray-500">No major upsets in this simulation — the favorites held serve throughout the bracket.</p>
      </div>
    )
  }

  function upsetExplanation(upset: UpsetInfo): string {
    const { winnerSeed, loserSeed, winner } = upset
    const seedGap = loserSeed - winnerSeed
    const adjEM = winner.stats?.adjEM

    if (winnerSeed === 12 && loserSeed === 5) {
      return `The 5-12 matchup has historically been the most volatile in the tournament (36% upset rate). ${
        adjEM ? `${winner.name}'s efficiency margin of +${adjEM.toFixed(1)} is well above average for a 12-seed.` : 'The model flagged this as a danger game.'
      }`
    }
    if (winnerSeed === 11 && loserSeed === 6) {
      return `The 6-11 matchup is routinely unpredictable — 6-seeds only win about 63% of the time, and ${winner.name} had the statistical profile to pull this off.`
    }
    if (winnerSeed === 13 && loserSeed === 4) {
      return `13-seeds upset 4-seeds roughly 22% of the time. ${winner.name} had the efficiency numbers and matchup advantages to exploit a vulnerable ${loserSeed}-seed.`
    }
    if (winnerSeed >= 10) {
      return `${winner.name}'s stats were deceptively strong for a #${winnerSeed} seed${
        adjEM ? ` (adjEM +${adjEM.toFixed(1)})` : ''
      }, and the variance model gave them real upset potential against a #${loserSeed}.`
    }
    return `A #${winnerSeed} over a #${loserSeed} — a ${seedGap}-seed gap upset${
      adjEM ? ` backed by ${winner.name}'s +${adjEM.toFixed(1)} efficiency margin` : ''
    }.`
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <h3 className="text-base font-bold text-white">Notable Upsets</h3>
        <span className="ml-auto rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
          {r64Upsets.length + lateUpsets.length} upsets
        </span>
      </div>

      <div className="space-y-3">
        {r64Upsets.map((upset, i) => (
          <div key={i} className="rounded-lg border border-red-900/30 bg-red-950/20 p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <SeedBadge seed={upset.winnerSeed} />
              <span className="font-semibold text-gray-200 text-sm">{upset.winner.name}</span>
              <span className="text-gray-500 text-xs">beats #{upset.loserSeed} seed</span>
              <span className="ml-auto text-[10px] uppercase tracking-wider text-red-400 font-semibold">
                R64 · {upset.region}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {upsetExplanation(upset)}
            </p>
          </div>
        ))}

        {lateUpsets.map((upset, i) => (
          <div key={`late-${i}`} className="rounded-lg border border-orange-900/30 bg-orange-950/20 p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <SeedBadge seed={upset.winnerSeed} />
              <span className="text-gray-300 text-sm font-medium">
                #{upset.winnerSeed} seed advances in the {upset.round}
              </span>
              <span className="ml-auto text-[10px] uppercase tracking-wider text-orange-400 font-semibold">
                {upset.round}
              </span>
            </div>
            <p className="text-xs text-gray-500">Higher seeds sometimes meet their match in the later rounds — when teams are more evenly matched and variance plays a bigger role.</p>
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
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
      <h3 className="mb-4 text-base font-bold text-white">
        Championship Odds
        <span className="ml-2 text-xs font-normal text-gray-500">(200 simulations)</span>
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500">
              <th className="py-1.5 text-left">Team</th>
              <th className="py-1.5 text-right">Title</th>
              <th className="py-1.5 text-right">Final Four</th>
              <th className="py-1.5 text-right">Elite Eight</th>
            </tr>
          </thead>
          <tbody>
            {top8.map((entry, i) => (
              <tr key={entry.teamId} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-600 w-4">{i + 1}.</span>
                    <SeedBadge seed={entry.seed} />
                    <span className="font-medium text-gray-200">{entry.teamName}</span>
                    <span className="text-gray-600 hidden sm:inline">· {entry.region}</span>
                  </div>
                </td>
                <td className="py-2 text-right tabular-nums text-orange-400 font-semibold">
                  {(entry.titleOdds * 100).toFixed(1)}%
                </td>
                <td className="py-2 text-right tabular-nums text-purple-400">
                  {(entry.finalFourOdds * 100).toFixed(0)}%
                </td>
                <td className="py-2 text-right tabular-nums text-blue-400">
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

// ─── Results view ─────────────────────────────────────────────────────────────

function SimulationResults({
  result,
  onResimulate,
  loading,
}: {
  result: SimResult
  onResimulate: () => void
  loading: boolean
}) {
  const narrative = buildChampionNarrative(result.champion)

  return (
    <div className="space-y-5">
      {/* Re-simulate bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Simulation complete — {result.r64Upsets.length + result.lateUpsets.length} upset{result.r64Upsets.length + result.lateUpsets.length !== 1 ? 's' : ''} detected
        </p>
        <button
          onClick={onResimulate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-800 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Re-simulate
        </button>
      </div>

      {/* Champion card */}
      <ChampionCard champion={result.champion} narrative={narrative} />

      {/* Final four */}
      <FinalFourSection finalFour={result.finalFour} champion={result.champion} />

      {/* Two-col layout for upsets + odds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <UpsetCallouts r64Upsets={result.r64Upsets} lateUpsets={result.lateUpsets} />
        <OddsTable odds={result.titleOdds} />
      </div>

      {/* Elite 8 section */}
      {result.eliteEight.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h3 className="mb-3 text-base font-bold text-white">Elite Eight</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {result.eliteEight.map(team => (
              <SmallTeamRow key={team.id} team={team} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function SimulateBracket() {
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
      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-6 text-center">
        <p className="text-red-400 mb-3">{error}</p>
        <button
          onClick={handleSimulate}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-400 transition"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!result) {
    return <SimulateHero onSimulate={handleSimulate} loading={loading} />
  }

  return <SimulationResults result={result} onResimulate={handleSimulate} loading={loading} />
}
