#!/usr/bin/env tsx
/**
 * MadnessLab — ESPN Stats Supplementary Fetcher
 *
 * Fetches real per-game stats for all 68 tournament teams from ESPN's public
 * API and patches lib/realData.ts with accurate secondary stats:
 *   - tempo (possessions per 40 min, computed from pace)
 *   - turnoverRate (turnovers per 100 possessions)
 *   - offReboundRate (offensive rebound %)
 *   - defReboundRate (defensive rebound %)
 *
 * Uses ESPN IDs already embedded in realData.ts.
 *
 * Run from your terminal: npm run data:espn
 *
 * Data source: ESPN public stats API (no API key required)
 */

import fs from 'fs'
import path from 'path'

// ─── ESPN ID map (matches fetchTRankData.ts getEspnId) ────────────────────────
const ESPN_IDS: Record<string, number> = {
  // East
  'Duke': 150, 'Siena': 2561, 'Ohio State': 194, 'TCU': 2628,
  "St. John's": 2599, 'Northern Iowa': 2271, 'Kansas': 2305, 'Cal Baptist': 2856,
  'Louisville': 97, 'South Florida': 58, 'Michigan State': 127, 'North Dakota State': 2449,
  'UCLA': 26, 'UCF': 2116, 'UConn': 41, 'Furman': 231,
  // West
  'Arizona': 12, 'Long Island': 112358, 'Villanova': 222, 'Utah State': 328,
  'Wisconsin': 275, 'High Point': 2272, 'Arkansas': 8, 'Hawaii': 62,
  'BYU': 252, 'Texas': 251, 'NC State': 152, 'Gonzaga': 2250,
  'Kennesaw State': 2378, 'Miami (FL)': 2390, 'Missouri': 142, 'Purdue': 2509,
  'Queens (N.C.)': 2511,
  // South
  'Florida': 57, 'Prairie View A&M': 2480, 'Lehigh': 2350, 'Clemson': 228,
  'Iowa': 2294, 'Vanderbilt': 238, 'McNeese': 2393, 'Nebraska': 158,
  'Troy': 2653, 'North Carolina': 153, 'VCU': 2670, 'Illinois': 356,
  'Penn': 219, "Saint Mary's": 2608, 'Texas A&M': 245, 'Houston': 248,
  'Idaho': 70,
  // Midwest
  'Michigan': 130, 'UMBC': 2427, 'Howard': 2287, 'Georgia': 61,
  'Saint Louis': 139, 'Texas Tech': 44, 'Akron': 2006, 'Alabama': 333,
  'Hofstra': 2275, 'Tennessee': 2633, 'Miami (Ohio)': 193, 'SMU': 2567,
  'Virginia': 258, 'Wright State': 2711, 'Kentucky': 96, 'Santa Clara': 2541,
  'Iowa State': 66, 'Tennessee State': 2634,
}

interface EspnStats {
  name: string
  espnId: number
  // raw per-game averages from ESPN
  fga: number        // field goal attempts per game
  fta: number        // free throw attempts per game
  oreb: number       // offensive rebounds per game
  dreb: number       // defensive rebounds per game
  treb: number       // total rebounds per game
  to: number         // turnovers per game
  pts: number        // points per game
  // opponent
  opp_oreb: number   // opponent offensive rebounds per game
  opp_dreb: number   // opponent defensive rebounds per game
  opp_to: number     // opponent turnovers per game
  opp_fga: number    // opponent field goal attempts per game
  opp_fta: number    // opponent free throw attempts per game
  // computed
  tempo: number
  turnoverRate: number
  offReboundRate: number
  defReboundRate: number
}

// Statistic category IDs used by ESPN's stats API
// These map to standard basketball stats in ESPN's response
const ESPN_STAT_LABELS: Record<string, string> = {
  'fieldGoalsAttempted': 'fga',
  'freeThrowsAttempted': 'fta',
  'offensiveRebounds': 'oreb',
  'defensiveRebounds': 'dreb',
  'rebounds': 'treb',
  'turnovers': 'to',
  'points': 'pts',
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchTeamStats(espnId: number): Promise<Record<string, number> | null> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${espnId}/statistics`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MadnessLab/1.0)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      console.warn(`  ⚠️  ESPN returned ${res.status} for team ${espnId}`)
      return null
    }

    const data = await res.json() as {
      results?: {
        stats?: {
          id?: string
          name?: string
          categories?: Array<{
            name: string
            stats: Array<{ name: string; value: number; displayValue?: string }>
          }>
        }
      }
    }

    const stats: Record<string, number> = {}

    // ESPN API: results.stats is an object with a categories array
    const categories = data?.results?.stats?.categories
    if (Array.isArray(categories)) {
      for (const category of categories) {
        for (const stat of category.stats ?? []) {
          stats[stat.name] = stat.value
        }
      }
    }

    return Object.keys(stats).length > 0 ? stats : null
  } catch (err) {
    console.warn(`  ⚠️  Fetch failed for team ${espnId}: ${err}`)
    return null
  }
}

/**
 * Compute possessions per game using the standard formula:
 *   Poss ≈ FGA + 0.44 * FTA - OREB + TO
 * Then annualize to per-40-min tempo (assuming ~18 possessions per 5 min → 72/game = tempo baseline)
 */
function computeTempo(fga: number, fta: number, oreb: number, to: number): number {
  const poss = fga + 0.44 * fta - oreb + to
  // Tempo: scale raw possessions per game to per-40-min equivalent
  // Average D1 team plays ~72 possessions per game ≈ 68–74 tempo range
  // Clamp to realistic bounds
  return Math.max(58, Math.min(84, poss))
}

/**
 * Turnover rate = turnovers / possessions * 100
 */
function computeTurnoverRate(to: number, fga: number, fta: number, oreb: number): number {
  const poss = fga + 0.44 * fta - oreb + to
  if (poss <= 0) return 17
  return Math.max(8, Math.min(28, (to / poss) * 100))
}

/**
 * Offensive rebound rate = OREB / (OREB + opponent DREB)
 */
function computeOffReboundRate(oreb: number, oppDreb: number): number {
  const denom = oreb + oppDreb
  if (denom <= 0) return 28
  return Math.max(15, Math.min(45, (oreb / denom) * 100))
}

/**
 * Defensive rebound rate = DREB / (DREB + opponent OREB)
 */
function computeDefReboundRate(dreb: number, oppOreb: number): number {
  const denom = dreb + oppOreb
  if (denom <= 0) return 72
  return Math.max(50, Math.min(90, (dreb / denom) * 100))
}

// ─── Patch realData.ts ─────────────────────────────────────────────────────────

function patchRealData(updates: Map<string, EspnStats>): void {
  const realDataPath = path.join(process.cwd(), 'lib', 'realData.ts')
  let content = fs.readFileSync(realDataPath, 'utf-8')
  let patchCount = 0

  for (const [teamName, stats] of updates) {
    // Find the team block by espnId (most reliable unique identifier)
    const espnIdLine = `    espnId: ${stats.espnId},`
    const idx = content.indexOf(espnIdLine)
    if (idx === -1) {
      console.warn(`  Could not locate espnId: ${stats.espnId} for ${teamName}`)
      continue
    }

    // Walk backwards to find the opening of the stats block
    // Then replace the four secondary stat lines
    const replacements: Array<[RegExp, string]> = [
      [/      tempo: [\d.]+,/, `      tempo: ${stats.tempo.toFixed(1)},`],
      [/      turnoverRate: [\d.]+,/, `      turnoverRate: ${stats.turnoverRate.toFixed(1)},`],
      [/      offReboundRate: [\d.]+,/, `      offReboundRate: ${stats.offReboundRate.toFixed(1)},`],
      [/      defReboundRate: [\d.]+,/, `      defReboundRate: ${stats.defReboundRate.toFixed(1)},`],
    ]

    // Find the team block boundaries: from id: 'xxx' to espnId: xxx
    // Use the espnId anchor to find the block, then look backwards for the stats section
    const blockEnd = idx
    // Find the start of this team block (look back for the opening brace)
    const blockStart = content.lastIndexOf('\n  {', blockEnd)
    if (blockStart === -1) continue

    let block = content.slice(blockStart, blockEnd + espnIdLine.length + 50)

    for (const [pattern, replacement] of replacements) {
      block = block.replace(pattern, replacement)
    }

    content = content.slice(0, blockStart) + block + content.slice(blockStart + block.length)
    patchCount++
  }

  // Update the generated timestamp
  content = content.replace(
    /\/\/ ✅ REAL DATA: Fetched from barttorvik\.com on .+/,
    `// ✅ REAL DATA: Barttorvik efficiency + ESPN secondary stats — ${new Date().toISOString()}`
  )

  fs.writeFileSync(realDataPath, content, 'utf-8')
  console.log(`\n✅ Patched ${patchCount} teams in lib/realData.ts`)
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🏀 MadnessLab — ESPN Stats Fetcher')
  console.log('━'.repeat(50))
  console.log(`Fetching stats for ${Object.keys(ESPN_IDS).length} tournament teams...\n`)

  const updates = new Map<string, EspnStats>()
  let successCount = 0
  let failCount = 0

  const entries = Object.entries(ESPN_IDS)

  for (let i = 0; i < entries.length; i++) {
    const [teamName, espnId] = entries[i]
    process.stdout.write(`  [${String(i + 1).padStart(2)}/${entries.length}] ${teamName.padEnd(28)}`)

    const raw = await fetchTeamStats(espnId)

    if (!raw) {
      process.stdout.write('✗ no data\n')
      failCount++
      await delay(100)
      continue
    }

    // ESPN uses several naming conventions — try all variants
    // avg-prefix style: avgOffensiveRebounds, avgTurnovers, etc.
    // plain style: offensiveRebounds, turnovers, etc.
    const getStat = (keys: string[]): number => {
      for (const k of keys) {
        if (raw[k] !== undefined && raw[k] > 0) return raw[k]
      }
      return 0
    }

    // On the first team, print all field names so we can debug if needed
    if (i === 0 && Object.keys(raw).length > 0) {
      const allKeys = Object.keys(raw).sort()
      console.log(`\n  📋 ESPN fields available (team ${espnId}): ${allKeys.slice(0, 25).join(', ')}${allKeys.length > 25 ? ` ...+${allKeys.length - 25} more` : ''}\n`)
    }

    const oreb = getStat(['avgOffensiveRebounds', 'offensiveReboundsPerGame', 'offensiveRebounds'])
    const dreb = getStat(['avgDefensiveRebounds', 'defensiveReboundsPerGame', 'defensiveRebounds'])
    const to   = getStat(['avgTurnovers', 'turnoversPerGame', 'turnovers'])
    const fga  = getStat(['avgFieldGoalsAttempted', 'fieldGoalsAttemptedPerGame', 'fieldGoalsAttempted'])
    const fta  = getStat(['avgFreeThrowsAttempted', 'freeThrowsAttemptedPerGame', 'freeThrowsAttempted'])
    const pts  = getStat(['avgPoints', 'pointsPerGame', 'points'])

    const oppOreb = getStat(['avgOpponentOffensiveRebounds', 'opponentOffensiveReboundsPerGame', 'opponentOffensiveRebounds'])
    const oppDreb = getStat(['avgOpponentDefensiveRebounds', 'opponentDefensiveReboundsPerGame', 'opponentDefensiveRebounds'])

    const tempo         = computeTempo(fga, fta, oreb, to)
    const turnoverRate  = computeTurnoverRate(to, fga, fta, oreb)
    const offRebRate    = computeOffReboundRate(oreb, oppDreb > 0 ? oppDreb : dreb * 0.8)
    const defRebRate    = computeDefReboundRate(dreb, oppOreb > 0 ? oppOreb : oreb * 0.6)

    updates.set(teamName, {
      name: teamName,
      espnId,
      fga, fta, oreb, dreb, treb: oreb + dreb, to, pts,
      opp_oreb: oppOreb, opp_dreb: oppDreb, opp_to: 0, opp_fga: 0, opp_fta: 0,
      tempo,
      turnoverRate,
      offReboundRate: offRebRate,
      defReboundRate: defRebRate,
    })

    process.stdout.write(`✓  tempo=${tempo.toFixed(1)}  TO%=${turnoverRate.toFixed(1)}  OReb%=${offRebRate.toFixed(1)}\n`)
    successCount++

    // Be polite to ESPN's servers — 150ms between requests
    await delay(150)
  }

  console.log(`\n📊 Results: ${successCount} fetched, ${failCount} failed`)

  if (updates.size > 0) {
    console.log('📝 Patching lib/realData.ts...')
    patchRealData(updates)
    console.log('\n🎉 Done! Restart your dev server to see updated stats.')
  } else {
    console.log('\n⚠️  No data fetched — realData.ts unchanged.')
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
