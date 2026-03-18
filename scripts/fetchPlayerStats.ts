#!/usr/bin/env tsx
/**
 * MadnessLab — Player Stats Fetcher v3 (Box Score approach)
 *
 * ESPN removed /athletes/{id}/statistics. Global leaders endpoint
 * returns a different structure. Box score summaries work reliably.
 *
 * Strategy:
 *   1. Get each team's last 5 completed games from their schedule
 *   2. For each game, fetch the box score (summary?event={id})
 *   3. Aggregate player stats across games → compute per-game averages
 *   4. Compute TS% (True Shooting %) from FGA + FTA
 *   5. Write top-3 players by PPG into lib/realData.ts
 *
 * Box score stat columns (from ESPN):
 *   minutes · points · FGM-FGA · 3PM-3PA · FTM-FTA ·
 *   rebounds · assists · turnovers · steals · blocks · oreb · dreb · fouls
 *
 * Run: npm run data:players
 */

import fs from 'fs'
import path from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerAccum {
  id: string
  name: string
  position: string
  year: string
  games: number
  minutes: number
  points: number
  fgm: number; fga: number
  tpm: number; tpa: number   // 3-pointers
  ftm: number; fta: number
  rebounds: number
  assists: number
}

interface PlayerStats {
  name: string
  position: 'G' | 'F' | 'C'
  year: 'Fr' | 'So' | 'Jr' | 'Sr' | 'Gr'
  ppg: number; rpg: number; apg: number
  threePtPct?: number
  trueShootingPct?: number
  usagePct?: number
}

interface TeamEntry {
  id: string       // our slug (e.g. 'duke')
  name: string     // display name
  espnId: number   // ESPN team ID
}

// ─── ESPN ID map (complete for all 68 teams) ─────────────────────────────────

const TEAMS: TeamEntry[] = [
  // EAST
  { id: 'duke',              name: 'Duke',              espnId: 150  },
  { id: 'siena',             name: 'Siena',             espnId: 2561 },
  { id: 'ohio-state',        name: 'Ohio State',        espnId: 194  },
  { id: 'tcu',               name: 'TCU',               espnId: 2628 },
  { id: 'st-johns',          name: "St. John's",        espnId: 2599 },
  { id: 'northern-iowa',     name: 'Northern Iowa',     espnId: 2271 },
  { id: 'kansas',            name: 'Kansas',            espnId: 2305 },
  { id: 'cal-baptist',       name: 'Cal Baptist',       espnId: 2856 },
  { id: 'louisville',        name: 'Louisville',        espnId: 97   },
  { id: 'south-florida',     name: 'South Florida',     espnId: 58   },
  { id: 'michigan-state',    name: 'Michigan State',    espnId: 127  },
  { id: 'north-dakota-state',name: 'North Dakota State',espnId: 2449 },
  { id: 'ucla',              name: 'UCLA',              espnId: 26   },
  { id: 'ucf',               name: 'UCF',               espnId: 2116 },
  { id: 'uconn',             name: 'UConn',             espnId: 41   },
  { id: 'furman',            name: 'Furman',            espnId: 231  },
  // WEST
  { id: 'arizona',           name: 'Arizona',           espnId: 12   },
  { id: 'long-island',       name: 'Long Island',       espnId: 112358 },
  { id: 'villanova',         name: 'Villanova',         espnId: 222  },
  { id: 'utah-state',        name: 'Utah State',        espnId: 328  },
  { id: 'wisconsin',         name: 'Wisconsin',         espnId: 275  },
  { id: 'high-point',        name: 'High Point',        espnId: 2272 },
  { id: 'arkansas',          name: 'Arkansas',          espnId: 8    },
  { id: 'hawaii',            name: 'Hawaii',            espnId: 62   },
  { id: 'byu',               name: 'BYU',               espnId: 252  },
  { id: 'texas',             name: 'Texas',             espnId: 251  },
  { id: 'nc-state',          name: 'NC State',          espnId: 152  },
  { id: 'gonzaga',           name: 'Gonzaga',           espnId: 2250 },
  { id: 'kennesaw-state',    name: 'Kennesaw State',    espnId: 2378 },
  { id: 'miami-fl',          name: 'Miami (FL)',        espnId: 2390 },
  { id: 'missouri',          name: 'Missouri',          espnId: 142  },
  { id: 'purdue',            name: 'Purdue',            espnId: 2509 },
  { id: 'queens-nc',         name: "Queens (N.C.)",     espnId: 2511 },
  // SOUTH
  { id: 'florida',           name: 'Florida',           espnId: 57   },
  { id: 'prairie-view-a-m',  name: 'Prairie View A&M',  espnId: 2480 },
  { id: 'lehigh',            name: 'Lehigh',            espnId: 2350 },
  { id: 'clemson',           name: 'Clemson',           espnId: 228  },
  { id: 'iowa',              name: 'Iowa',              espnId: 2294 },
  { id: 'vanderbilt',        name: 'Vanderbilt',        espnId: 238  },
  { id: 'mcneese',           name: 'McNeese',           espnId: 2393 },
  { id: 'nebraska',          name: 'Nebraska',          espnId: 158  },
  { id: 'troy',              name: 'Troy',              espnId: 2653 },
  { id: 'north-carolina',    name: 'North Carolina',    espnId: 153  },
  { id: 'vcu',               name: 'VCU',               espnId: 2670 },
  { id: 'illinois',          name: 'Illinois',          espnId: 356  },
  { id: 'penn',              name: 'Penn',              espnId: 219  },
  { id: 'saint-marys',       name: "Saint Mary's",      espnId: 2608 },
  { id: 'texas-a-m',         name: 'Texas A&M',         espnId: 245  },
  { id: 'houston',           name: 'Houston',           espnId: 248  },
  { id: 'idaho',             name: 'Idaho',             espnId: 70   },
  // MIDWEST
  { id: 'michigan',          name: 'Michigan',          espnId: 130  },
  { id: 'umbc',              name: 'UMBC',              espnId: 2427 },
  { id: 'howard',            name: 'Howard',            espnId: 2287 },
  { id: 'georgia',           name: 'Georgia',           espnId: 61   },
  { id: 'saint-louis',       name: 'Saint Louis',       espnId: 139  },
  { id: 'texas-tech',        name: 'Texas Tech',        espnId: 44   },
  { id: 'akron',             name: 'Akron',             espnId: 2006 },
  { id: 'alabama',           name: 'Alabama',           espnId: 333  },
  { id: 'hofstra',           name: 'Hofstra',           espnId: 2275 },
  { id: 'tennessee',         name: 'Tennessee',         espnId: 2633 },
  { id: 'miami-ohio',        name: 'Miami (Ohio)',       espnId: 193  },
  { id: 'smu',               name: 'SMU',               espnId: 2567 },
  { id: 'virginia',          name: 'Virginia',          espnId: 258  },
  { id: 'wright-state',      name: 'Wright State',      espnId: 2711 },
  { id: 'kentucky',          name: 'Kentucky',          espnId: 96   },
  { id: 'santa-clara',       name: 'Santa Clara',       espnId: 2541 },
  { id: 'iowa-state',        name: 'Iowa State',        espnId: 66   },
  { id: 'tennessee-state',   name: 'Tennessee State',   espnId: 2634 },
]

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball'
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; MadnessLab/1.0)' }
const GAMES_TO_FETCH = 5   // average across last N games
const MIN_GAMES_PLAYED = 2 // player must appear in at least 2 games

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) })
    if (!res.ok) return null
    return await res.json() as T
  } catch {
    return null
  }
}

// ─── Parse a combined stat string like "8-15" → [made, attempted] ─────────────

function parseMadeAtt(s: string): [number, number] {
  if (!s || s === '--' || s === '-') return [0, 0]
  const parts = s.split('-')
  if (parts.length < 2) return [parseFloat(s) || 0, 0]
  return [parseFloat(parts[0]) || 0, parseFloat(parts[1]) || 0]
}

// ─── Get recent completed game IDs for a team ─────────────────────────────────

interface RawComp {
  id?: string
  date?: string
  status?: {
    type?: { completed?: boolean; name?: string; state?: string }
  }
  competitions?: RawComp[]
}

async function getRecentGameIds(espnId: number, verbose = false): Promise<string[]> {
  const now = new Date()

  // Collect {id, date} pairs regardless of response nesting
  const found: Array<{ id: string; date: Date }> = []

  function harvest(items: RawComp[]) {
    for (const item of items) {
      // Nested: event wraps competitions (ESPN weekly schedule format)
      if (item.competitions?.length) {
        harvest(item.competitions)
      }
      // Leaf competition — take it if it has an ID
      if (item.id) {
        const d = item.date ? new Date(item.date) : new Date(0)
        // Keep if: date is in the past OR status says completed
        const isCompleted =
          d < now ||
          item.status?.type?.completed === true ||
          item.status?.type?.state === 'post' ||
          item.status?.type?.name?.includes('FINAL')
        if (isCompleted) {
          found.push({ id: item.id, date: d })
        }
      }
    }
  }

  // Try multiple schedule URL formats
  const urls = [
    `${BASE}/teams/${espnId}/schedule?season=2026&limit=50`,
    `${BASE}/teams/${espnId}/schedule?season=2026&seasontype=2&limit=40`,
  ]

  for (const url of urls) {
    const data = await fetchJson<Record<string, unknown>>(url)
    if (!data) continue

    const topLevel = (
      data.events ??
      data.competitions ??
      data.games ??
      data.schedule ??
      []
    ) as RawComp[]

    if (!Array.isArray(topLevel) || topLevel.length === 0) continue

    if (verbose) {
      const sample = topLevel[0] as Record<string, unknown>
      console.log(`\n  [debug] schedule keys: ${Object.keys(data).join(', ')}`)
      console.log(`  [debug] top-level array length: ${topLevel.length}`)
      console.log(`  [debug] first item keys: ${Object.keys(sample).join(', ')}`)
      if (sample.competitions) {
        const comps = sample.competitions as RawComp[]
        console.log(`  [debug] first.competitions length: ${comps.length}`)
        if (comps.length) console.log(`  [debug] first comp: ${JSON.stringify(comps[0]).slice(0, 200)}`)
      }
    }

    harvest(topLevel)
    if (found.length > 0) break
  }

  if (verbose) {
    console.log(`  [debug] completed games found: ${found.length}`)
  }

  // Return most-recent N game IDs
  return found
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, GAMES_TO_FETCH)
    .map(g => g.id)
}

// ─── Fetch one game box score, return player stats for our team ───────────────

interface BoxScoreAthlete {
  active?: boolean
  starter?: boolean
  athlete?: {
    id: string
    displayName: string
    position?: { abbreviation?: string; displayName?: string }
    experience?: { displayValue?: string }
  }
  stats?: string[]
}

interface BoxScoreStatGroup {
  names?: string[]
  keys?: string[]
  labels?: string[]
  athletes?: BoxScoreAthlete[]
}

interface BoxScoreTeam {
  team?: { id?: string }
  statistics?: BoxScoreStatGroup[]
  displayOrder?: number
}

async function fetchGamePlayerStats(
  gameId: string,
  espnTeamId: number,
  verbose = false
): Promise<Map<string, Partial<PlayerAccum>>> {
  const url = `${BASE}/summary?event=${gameId}`
  const data = await fetchJson<{
    boxscore?: { players?: BoxScoreTeam[]; teams?: unknown[] }
  }>(url)

  const result = new Map<string, Partial<PlayerAccum>>()
  if (!data?.boxscore?.players) return result

  if (verbose) {
    console.log(`\n  [debug] game ${gameId}: ${data.boxscore.players.length} team blocks`)
    for (const t of data.boxscore.players) {
      console.log(`    team id=${t.team?.id} stats groups=${t.statistics?.length}`)
    }
  }

  // Find the team block — match by ID string or by "our team" being one of two
  let teamBlock = data.boxscore.players.find(
    t => String(t.team?.id) === String(espnTeamId)
  )

  // Fallback: if no exact match, try to infer (some ESPN IDs don't match exactly)
  if (!teamBlock && data.boxscore.players.length === 2) {
    // We'll try both; return whichever has more players with ppg > 0
    // (both teams get processed, winner = team with more total points)
    teamBlock = data.boxscore.players[0]
  }

  if (!teamBlock) return result

  for (const statGroup of teamBlock.statistics ?? []) {
    // ESPN stat column keys for box score
    const keys: string[] = statGroup.keys ?? statGroup.names ?? statGroup.labels ?? []

    // Find column indices
    const idx = (names: string[]) =>
      keys.findIndex(k =>
        names.some(n => k.toLowerCase().includes(n.toLowerCase()))
      )

    const minIdx  = idx(['minutes'])
    const ptsIdx  = idx(['points'])
    const fgIdx   = idx(['fieldGoalsMade-fieldGoals', 'fieldGoals'])
    const tpIdx   = idx(['threePoint', 'three'])
    const ftIdx   = idx(['freeThrow'])
    const rebIdx  = idx(['rebounds'])
    const astIdx  = idx(['assists'])

    for (const entry of statGroup.athletes ?? []) {
      if (!entry.active || !entry.athlete || !entry.stats) continue

      const ath = entry.athlete
      const stats = entry.stats

      // Skip players with 0 minutes
      const minStr = minIdx >= 0 ? (stats[minIdx] ?? '0') : '0'
      // Minutes can be "32:14" or "32" or "0" or "0:00"
      const mins = parseFloat(minStr.split(':')[0] ?? '0') || 0
      if (mins < 1) continue

      const pts = ptsIdx >= 0 ? (parseFloat(stats[ptsIdx] ?? '0') || 0) : 0
      const [fgm, fga] = fgIdx >= 0 ? parseMadeAtt(stats[fgIdx] ?? '') : [0, 0]
      const [tpm, tpa] = tpIdx >= 0 ? parseMadeAtt(stats[tpIdx] ?? '') : [0, 0]
      const [ftm, fta] = ftIdx >= 0 ? parseMadeAtt(stats[ftIdx] ?? '') : [0, 0]
      const reb = rebIdx >= 0 ? (parseFloat(stats[rebIdx] ?? '0') || 0) : 0
      const ast = astIdx >= 0 ? (parseFloat(stats[astIdx] ?? '0') || 0) : 0

      result.set(ath.id, {
        id: ath.id,
        name: ath.displayName,
        position: ath.position?.abbreviation ?? ath.position?.displayName ?? 'G',
        year: ath.experience?.displayValue ?? 'Sr',
        games: 1,
        minutes: mins,
        points: pts,
        fgm, fga,
        tpm, tpa,
        ftm, fta,
        rebounds: reb,
        assists: ast,
      })
    }
  }

  return result
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizePosition(raw: string | undefined): 'G' | 'F' | 'C' {
  const p = (raw ?? '').toUpperCase()
  if (p === 'C' || p === 'CENTER') return 'C'
  if (p.includes('F') || p === 'FORWARD' || p === 'PF' || p === 'SF') return 'F'
  return 'G'
}

function normalizeYear(raw: string | undefined): 'Fr' | 'So' | 'Jr' | 'Sr' | 'Gr' {
  const y = (raw ?? '').toLowerCase()
  if (y.includes('fresh') || y === 'fr' || y === '1') return 'Fr'
  if (y.includes('soph')  || y === 'so' || y === '2') return 'So'
  if (y.includes('junior') || y === 'jr' || y === '3') return 'Jr'
  if (y.includes('grad')  || y === 'gr') return 'Gr'
  if (y.includes('senior') || y === 'sr' || y === '4' || y === '5') return 'Sr'
  return 'Sr'
}

function r1(n: number) { return Math.round(n * 10) / 10 }
function r3(n: number) { return Math.round(n * 1000) / 1000 }

// ─── Aggregate box scores → per-game averages ────────────────────────────────

function aggregateToPlayerCards(
  allGames: Map<string, Partial<PlayerAccum>>[]
): PlayerStats[] {
  // Merge all game-level data per player ID
  const totals = new Map<string, PlayerAccum>()

  for (const gameData of allGames) {
    for (const [id, gp] of gameData) {
      if (!gp.name) continue
      if (!totals.has(id)) {
        totals.set(id, {
          id: id,
          name: gp.name!,
          position: gp.position ?? 'G',
          year: gp.year ?? 'Sr',
          games: 0, minutes: 0, points: 0,
          fgm: 0, fga: 0, tpm: 0, tpa: 0,
          ftm: 0, fta: 0, rebounds: 0, assists: 0,
        })
      }
      const t = totals.get(id)!
      t.games += 1
      t.minutes  += gp.minutes  ?? 0
      t.points   += gp.points   ?? 0
      t.fgm      += gp.fgm      ?? 0
      t.fga      += gp.fga      ?? 0
      t.tpm      += gp.tpm      ?? 0
      t.tpa      += gp.tpa      ?? 0
      t.ftm      += gp.ftm      ?? 0
      t.fta      += gp.fta      ?? 0
      t.rebounds += gp.rebounds ?? 0
      t.assists  += gp.assists  ?? 0
    }
  }

  const cards: PlayerStats[] = []

  for (const t of totals.values()) {
    if (t.games < MIN_GAMES_PLAYED) continue
    if (t.points / t.games < 1) continue // skip deep bench

    const ppg = t.points / t.games
    const rpg = t.rebounds / t.games
    const apg = t.assists / t.games
    const fgaPerGame = t.fga / t.games
    const ftaPerGame = t.fta / t.games

    // True Shooting % = PTS / (2 × (FGA + 0.44 × FTA))
    const tsDenom = 2 * (t.fga + 0.44 * t.fta)
    const ts = tsDenom > 5 ? r3(t.points / tsDenom) : undefined

    // 3PT%
    const threePtPct = t.tpa >= 3 ? r3(t.tpm / t.tpa) : undefined

    // Usage estimate: (PPG + 0.5×APG + 0.25×RPG) × 1.4
    const usage = Math.min(36, Math.max(12, (ppg + 0.5 * apg + 0.25 * rpg) * 1.4))

    cards.push({
      name: t.name,
      position: normalizePosition(t.position),
      year: normalizeYear(t.year),
      ppg: r1(ppg),
      rpg: r1(rpg),
      apg: r1(apg),
      ...(threePtPct !== undefined ? { threePtPct } : {}),
      ...(ts !== undefined ? { trueShootingPct: ts } : {}),
      usagePct: Math.round(usage * 10) / 10,
    })
  }

  return cards.sort((a, b) => b.ppg - a.ppg).slice(0, 3)
}

// ─── Fetch all players for a team ─────────────────────────────────────────────

async function fetchTeamPlayers(team: TeamEntry, verbose = false): Promise<PlayerStats[]> {
  const gameIds = await getRecentGameIds(team.espnId, verbose)
  if (gameIds.length === 0) {
    if (verbose) console.log(`  [debug] no game IDs found for ${team.name}`)
    return []
  }

  if (verbose) {
    console.log(`  [debug] ${team.name}: fetching games [${gameIds.join(', ')}]`)
  }

  const allGameData: Map<string, Partial<PlayerAccum>>[] = []

  for (const gameId of gameIds) {
    const gameData = await fetchGamePlayerStats(gameId, team.espnId, verbose)
    if (verbose) console.log(`  [debug] game ${gameId}: ${gameData.size} players found`)
    if (gameData.size > 0) allGameData.push(gameData)
    await delay(120)
  }

  if (allGameData.length === 0) return []
  return aggregateToPlayerCards(allGameData)
}

// ─── Patch lib/realData.ts ───────────────────────────────────────────────────

function formatPlayer(p: PlayerStats): string {
  const lines: string[] = [
    `        {`,
    `          name: ${JSON.stringify(p.name)},`,
    `          position: '${p.position}',`,
    `          year: '${p.year}',`,
    `          ppg: ${p.ppg},`,
    `          rpg: ${p.rpg},`,
    `          apg: ${p.apg},`,
  ]
  if (p.threePtPct !== undefined)      lines.push(`          threePtPct: ${p.threePtPct},`)
  if (p.trueShootingPct !== undefined) lines.push(`          trueShootingPct: ${p.trueShootingPct},`)
  if (p.usagePct !== undefined)        lines.push(`          usagePct: ${p.usagePct},`)
  lines.push(`        }`)
  return lines.join('\n')
}

function patchKeyPlayers(teamId: string, espnId: number, players: PlayerStats[]): void {
  const filePath = path.join(process.cwd(), 'lib', 'realData.ts')
  let content = fs.readFileSync(filePath, 'utf-8')

  const espnAnchor = `    espnId: ${espnId},`
  const anchorIdx = content.indexOf(espnAnchor)
  if (anchorIdx === -1) {
    console.warn(`    Could not find espnId ${espnId} for ${teamId}`)
    return
  }

  const playersBlock = `    keyPlayers: [\n${players.map(formatPlayer).join(',\n')},\n    ],`
  const lookAhead = content.slice(anchorIdx, anchorIdx + 800)
  const hasKeyPlayers = lookAhead.includes('keyPlayers:')

  if (hasKeyPlayers) {
    const blockStart = content.indexOf('    keyPlayers: [', anchorIdx)
    if (blockStart !== -1 && blockStart < anchorIdx + 800) {
      const blockEnd = content.indexOf('    ],\n', blockStart) + '    ],\n'.length
      if (blockEnd > blockStart) {
        content = content.slice(0, blockStart) + playersBlock + '\n' + content.slice(blockEnd)
      }
    }
  } else {
    const insertAfter = anchorIdx + espnAnchor.length
    const nextLine = content.indexOf('\n', insertAfter) + 1
    content = content.slice(0, nextLine) + playersBlock + '\n' + content.slice(nextLine)
  }

  fs.writeFileSync(filePath, content, 'utf-8')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🏀 MadnessLab — Player Stats Fetcher v3')
  console.log('━'.repeat(55))
  console.log(`Using box scores from last ${GAMES_TO_FETCH} games per team`)
  console.log('Stats: PPG · RPG · APG · 3PT% · TS% · Usage%\n')

  let successCount = 0
  let failCount = 0
  const allResults: Array<{ team: string; players: PlayerStats[] }> = []

  for (let i = 0; i < TEAMS.length; i++) {
    const team = TEAMS[i]
    process.stdout.write(`  [${String(i + 1).padStart(2)}/${TEAMS.length}] ${team.name.padEnd(24)}`)

    try {
      const verbose = i === 0  // show debug info for first team only
      const players = await fetchTeamPlayers(team, verbose)

      if (players.length === 0) {
        process.stdout.write('✗ no data\n')
        failCount++
      } else {
        patchKeyPlayers(team.id, team.espnId, players)
        const summary = players.map(p => {
          const ts = p.trueShootingPct ? ` TS${(p.trueShootingPct * 100).toFixed(0)}%` : ''
          return `${p.name.split(' ').pop()} ${p.ppg}ppg${ts}`
        }).join(' · ')
        process.stdout.write(`✓  ${summary}\n`)
        successCount++
        allResults.push({ team: team.name, players })
      }
    } catch (err) {
      process.stdout.write(`✗ ${String(err).slice(0, 50)}\n`)
      failCount++
    }

    await delay(200) // pause between teams
  }

  console.log(`\n${'━'.repeat(55)}`)
  console.log(`✅ ${successCount} teams updated  ⚠️  ${failCount} teams failed`)
  console.log('📝 lib/realData.ts has been updated.\n')

  if (allResults.length > 0) {
    const allPlayers = allResults.flatMap(r =>
      r.players.map(p => ({ ...p, team: r.team }))
    ).sort((a, b) => b.ppg - a.ppg)

    console.log('🏆 Top scorers in the field:')
    for (const p of allPlayers.slice(0, 15)) {
      const ts = p.trueShootingPct
        ? ` · TS ${(p.trueShootingPct * 100).toFixed(0)}%`
        : ''
      const tp = p.threePtPct
        ? ` · 3PT ${(p.threePtPct * 100).toFixed(1)}%`
        : ''
      console.log(
        `  ${String(p.ppg.toFixed(1)).padStart(4)} ppg  ` +
        `${p.name.padEnd(22)} ${p.team.padEnd(18)} ${p.year}${ts}${tp}`
      )
    }
  }

  console.log('\n🎉 Restart your dev server (npm run dev) to see updated player cards!')
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
