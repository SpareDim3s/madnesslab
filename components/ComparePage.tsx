'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftRight, TrendingUp, Shield, Zap, ChevronDown, Trophy } from 'lucide-react'
import { predictMatchup } from '@/lib/predictionEngine'
import type { MockTeam } from '@/lib/mockData'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number) {
  return `${Math.round(n * 100)}%`
}

function TeamLogo({ team, size = 40 }: { team: MockTeam; size?: number }) {
  if (!team.espnId) {
    return (
      <div
        className="flex items-center justify-center rounded-lg font-bold text-lg bg-gray-800 border border-gray-700 text-gray-300"
        style={{ width: size, height: size }}
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
  accent1 = 'bg-blue-500',
  accent2 = 'bg-orange-500',
}: {
  label: string
  v1: number
  v2: number
  higherIsBetter?: boolean
  format?: (n: number) => string
  accent1?: string
  accent2?: string
}) {
  const max = Math.max(Math.abs(v1), Math.abs(v2), 1)
  const bar1 = Math.min(100, (Math.abs(v1) / max) * 100)
  const bar2 = Math.min(100, (Math.abs(v2) / max) * 100)

  const t1Wins = higherIsBetter ? v1 > v2 : v1 < v2
  const t2Wins = higherIsBetter ? v2 > v1 : v2 < v1

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2 border-b border-gray-800/40">
      {/* Team 1 bar (right-aligned) */}
      <div className="flex items-center justify-end gap-2">
        <span className={`text-sm tabular-nums font-semibold ${t1Wins ? 'text-white' : 'text-gray-500'}`}>
          {format(v1)}
        </span>
        <div className="w-24 h-2 rounded-full bg-gray-800 overflow-hidden flex justify-end">
          <div
            className={`h-2 rounded-full ${t1Wins ? accent1 : 'bg-gray-700'}`}
            style={{ width: `${bar1}%` }}
          />
        </div>
      </div>

      {/* Label */}
      <span className="text-xs text-gray-500 text-center w-24 shrink-0">{label}</span>

      {/* Team 2 bar (left-aligned) */}
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 rounded-full bg-gray-800 overflow-hidden">
          <div
            className={`h-2 rounded-full ${t2Wins ? accent2 : 'bg-gray-700'}`}
            style={{ width: `${bar2}%` }}
          />
        </div>
        <span className={`text-sm tabular-nums font-semibold ${t2Wins ? 'text-white' : 'text-gray-500'}`}>
          {format(v2)}
        </span>
      </div>
    </div>
  )
}

// ─── Win probability arc ──────────────────────────────────────────────────────

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
    p1 >= 80 ? 'dominant' :
    p1 >= 65 ? 'favored' :
    p1 >= 55 ? 'slight edge' :
    p1 >= 45 ? 'toss-up' :
    p1 >= 35 ? 'slight edge' :
    p1 >= 20 ? 'favored' : 'dominant'

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6 text-center">
      <div className="text-xs uppercase tracking-widest text-gray-500 mb-4">Win Probability</div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-center flex-1">
          <div className="flex justify-center mb-2">
            <TeamLogo team={team1} size={48} />
          </div>
          <div className="text-sm font-bold text-gray-200">{team1.abbreviation ?? team1.name}</div>
          <div className="text-3xl font-black text-blue-400 mt-1">{p1}%</div>
        </div>

        <div className="text-center px-4">
          <div className="text-xl font-black text-gray-600">vs</div>
          <div className="text-xs text-gray-600 mt-1">{tier}</div>
        </div>

        <div className="text-center flex-1">
          <div className="flex justify-center mb-2">
            <TeamLogo team={team2} size={48} />
          </div>
          <div className="text-sm font-bold text-gray-200">{team2.abbreviation ?? team2.name}</div>
          <div className="text-3xl font-black text-orange-400 mt-1">{p2}%</div>
        </div>
      </div>

      {/* Bar */}
      <div className="h-4 rounded-full overflow-hidden flex">
        <div
          className="h-4 bg-blue-500 transition-all duration-500"
          style={{ width: `${p1}%` }}
        />
        <div
          className="h-4 bg-orange-500 transition-all duration-500"
          style={{ width: `${p2}%` }}
        />
      </div>

      {/* Favorite label */}
      {p1 !== 50 && (
        <p className="mt-3 text-xs text-gray-500">
          <span className={p1 > 50 ? 'text-blue-400 font-semibold' : 'text-orange-400 font-semibold'}>
            {p1 > 50 ? team1.name : team2.name}
          </span>
          {' '}projected to win
          {p1 !== p2 ? ` · ${Math.abs(p1 - p2)} point spread` : ''}
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
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <Zap className="h-4 w-4 text-orange-400" />
        Matchup Deciding Factors
      </h3>

      <div className="space-y-2 mb-5">
        {prediction.decidingFactors.map((factor, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-gray-400">
            <span className="text-orange-400 mt-0.5 shrink-0">→</span>
            {factor}
          </div>
        ))}
      </div>

      {prediction.layer2Adjustments.length > 0 && (
        <>
          <div className="text-xs uppercase tracking-wider text-gray-600 mb-2">Style Adjustments</div>
          <div className="space-y-1.5">
            {prediction.layer2Adjustments.slice(0, 4).map((adj, i) => {
              const favoring = adj.favoringTeam === team1.id ? team1.abbreviation ?? team1.name : team2.abbreviation ?? team2.name
              const color = adj.favoringTeam === team1.id ? 'text-blue-400' : 'text-orange-400'
              return (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{adj.label}</span>
                  <span className={`font-semibold ${color}`}>
                    +{adj.magnitude.toFixed(1)} {favoring}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {prediction.upsetAlertTier !== 'none' && (
        <div className="mt-4 rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-400">
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
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
      <h3 className="text-sm font-bold text-white mb-4">Key Players</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* Team 1 */}
        <div className="space-y-2">
          {p1.slice(0, maxRows).map(p => (
            <div key={p.name} className="rounded-lg border border-gray-800 bg-gray-800/40 px-3 py-2">
              <div className="text-xs font-semibold text-gray-200">{p.name}</div>
              {p.position && <div className="text-[10px] text-gray-600 mb-1">{p.position}</div>}
              <div className="flex gap-2 text-[11px] tabular-nums">
                <span className="text-orange-400 font-bold">{p.ppg.toFixed(1)} ppg</span>
                {p.rpg != null && p.rpg > 0 && <span className="text-blue-400">{p.rpg.toFixed(1)} rpg</span>}
                {p.apg != null && p.apg > 0 && <span className="text-purple-400">{p.apg.toFixed(1)} apg</span>}
              </div>
            </div>
          ))}
          {p1.length === 0 && (
            <div className="text-xs text-gray-600 italic py-2">No player data for {team1.name}</div>
          )}
        </div>
        {/* Team 2 */}
        <div className="space-y-2">
          {p2.slice(0, maxRows).map(p => (
            <div key={p.name} className="rounded-lg border border-gray-800 bg-gray-800/40 px-3 py-2">
              <div className="text-xs font-semibold text-gray-200">{p.name}</div>
              {p.position && <div className="text-[10px] text-gray-600 mb-1">{p.position}</div>}
              <div className="flex gap-2 text-[11px] tabular-nums">
                <span className="text-orange-400 font-bold">{p.ppg.toFixed(1)} ppg</span>
                {p.rpg != null && p.rpg > 0 && <span className="text-blue-400">{p.rpg.toFixed(1)} rpg</span>}
                {p.apg != null && p.apg > 0 && <span className="text-purple-400">{p.apg.toFixed(1)} apg</span>}
              </div>
            </div>
          ))}
          {p2.length === 0 && (
            <div className="text-xs text-gray-600 italic py-2">No player data for {team2.name}</div>
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
  accent,
}: {
  teams: MockTeam[]
  value: string
  onChange: (id: string) => void
  label: string
  accent: string
}) {
  const sorted = [...teams].sort((a, b) => {
    const regionOrder: Record<string, number> = { South: 0, East: 1, West: 2, Midwest: 3 }
    const rDiff = (regionOrder[a.region] ?? 0) - (regionOrder[b.region] ?? 0)
    return rDiff !== 0 ? rDiff : a.seed - b.seed
  })

  const selected = teams.find(t => t.id === value)

  return (
    <div className="flex-1 min-w-0">
      <label className={`text-xs uppercase tracking-wider font-semibold mb-2 block ${accent}`}>{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 pr-10 text-sm font-medium text-white focus:border-gray-500 focus:outline-none"
        >
          {sorted.map(t => (
            <option key={t.id} value={t.id}>
              #{t.seed} {t.name} ({t.region})
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      </div>
      {selected && (
        <div className="mt-2 flex items-center gap-2 px-1">
          <TeamLogo team={selected} size={20} />
          <span className="text-xs text-gray-500">{selected.conference} · {selected.winsTotal}-{selected.lossesTotal}</span>
          <span className="ml-auto text-xs text-gray-600">adjEM {selected.stats.adjEM.toFixed(1)}</span>
        </div>
      )}
    </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/" className="text-xs text-gray-600 hover:text-gray-400 transition mb-4 inline-block">← Back</Link>
        <h1 className="text-2xl font-black text-white">Head-to-Head Comparison</h1>
        <p className="text-gray-500 text-sm mt-1">Pick any two 2026 tournament teams for a data-driven matchup breakdown.</p>
      </div>

      {/* Selectors */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
        <div className="flex items-end gap-3">
          <TeamSelector
            teams={nonFF}
            value={team1Id}
            onChange={setTeam1Id}
            label="Team 1"
            accent="text-blue-400"
          />
          <button
            onClick={swap}
            className="shrink-0 mb-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-gray-400 hover:text-white hover:border-gray-500 transition"
            title="Swap teams"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <TeamSelector
            teams={nonFF}
            value={team2Id}
            onChange={setTeam2Id}
            label="Team 2"
            accent="text-orange-400"
          />
        </div>
      </div>

      {/* Same team warning */}
      {team1.id === team2.id && (
        <div className="rounded-xl border border-yellow-800/40 bg-yellow-950/20 p-4 text-center text-sm text-yellow-500">
          Select two different teams to compare.
        </div>
      )}

      {prediction && team1.id !== team2.id && (
        <>
          {/* Win probability */}
          <WinProbBar team1={team1} team2={team2} prob1={prediction.team1WinProb} />

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center px-1">
            <div className="flex items-center gap-2">
              <TeamLogo team={team1} size={28} />
              <div>
                <div className="text-sm font-bold text-gray-200">{team1.name}</div>
                <div className="text-xs text-gray-600">#{team1.seed} · {team1.region}</div>
              </div>
            </div>
            <div className="text-xs text-gray-600 text-center w-24">Stat</div>
            <div className="flex items-center justify-end gap-2">
              <div className="text-right">
                <div className="text-sm font-bold text-gray-200">{team2.name}</div>
                <div className="text-xs text-gray-600">#{team2.seed} · {team2.region}</div>
              </div>
              <TeamLogo team={team2} size={28} />
            </div>
          </div>

          {/* Stats grid */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-400" />
              Efficiency Stats
            </h3>

            <StatBar
              label="adjEM"
              v1={team1.stats.adjEM}
              v2={team2.stats.adjEM}
              higherIsBetter
            />
            <StatBar
              label="Off Eff (adjOE)"
              v1={team1.stats.adjOE}
              v2={team2.stats.adjOE}
              higherIsBetter
              format={(n) => n.toFixed(1)}
            />
            <StatBar
              label="Def Eff (adjDE)"
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
              label="Turnover Rate"
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
          </div>

          {/* Profile scores */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              Tournament Profile
            </h3>

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
              label="Season W-L %"
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
          </div>

          {/* Deciding factors + key players */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <FactorsPanel prediction={prediction} team1={team1} team2={team2} />
            <PlayersPanel team1={team1} team2={team2} />
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/teams/${team1.slug}`}
              className="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-2 text-xs font-medium text-gray-400 hover:text-white hover:border-gray-600 transition"
            >
              Full {team1.name} profile →
            </Link>
            <Link
              href={`/teams/${team2.slug}`}
              className="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-2 text-xs font-medium text-gray-400 hover:text-white hover:border-gray-600 transition"
            >
              Full {team2.name} profile →
            </Link>
            <Link
              href="/bracket"
              className="rounded-lg border border-orange-800/40 bg-orange-950/20 px-4 py-2 text-xs font-medium text-orange-400 hover:text-orange-300 hover:border-orange-600/60 transition ml-auto"
            >
              Simulate the full tournament →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
