#!/usr/bin/env tsx
/**
 * MadnessLab — ESPN API Debugger v2
 *
 * Tests each data source we need to fix the player stats fetcher.
 * Run: npx tsx scripts/debugEspnApi.ts
 */

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball'
const DUKE_ID = 150
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; MadnessLab/1.0)' }

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) })
  return { status: res.status, ok: res.ok, data: res.ok ? await res.json() : null }
}

function print(label: string, data: unknown, maxLen = 2000) {
  const s = JSON.stringify(data, null, 2)
  console.log(s.length > maxLen ? s.slice(0, maxLen) + '\n... [truncated]' : s)
  console.log()
}

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  ESPN API Debugger v2 — MadnessLab')
  console.log('═══════════════════════════════════════════════════\n')

  // ─── TEST 1: Global Leaders (show FULL raw response) ──────────────────────
  console.log('━━━ TEST 1: Global Leaders Endpoint ━━━\n')

  const leaderUrls = [
    `${BASE}/leaders?limit=5&season=2026`,
    `${BASE}/leaders?limit=5`,
  ]
  for (const url of leaderUrls) {
    console.log('URL:', url)
    const { status, data } = await fetchJson(url)
    console.log('Status:', status)
    if (data) {
      console.log('Top-level keys:', Object.keys(data as object).join(', '))
      // Print the FULL structure with a reasonable limit
      print('Full response:', data, 3000)
    } else {
      console.log('No data\n')
    }
  }

  // ─── TEST 2: Team Leaders (enable=leaders param) ───────────────────────────
  console.log('━━━ TEST 2: Team Leaders via enable=leaders ━━━\n')

  const teamLeaderUrls = [
    `${BASE}/teams/${DUKE_ID}?enable=leaders&season=2026`,
    `${BASE}/teams/${DUKE_ID}?enable=leaders`,
    `${BASE}/teams/${DUKE_ID}/leaders?season=2026`,
    `${BASE}/teams/${DUKE_ID}/leaders`,
  ]
  for (const url of teamLeaderUrls) {
    console.log('URL:', url)
    const { status, data } = await fetchJson(url)
    console.log('Status:', status)
    if (data) {
      const d = data as Record<string, unknown>
      console.log('Keys:', Object.keys(d).join(', '))
      // Specifically look for leaders data
      const leaders = d.leaders ?? (d.team as Record<string, unknown>)?.leaders
      if (leaders) {
        console.log('✅ Found leaders key! Sample:')
        print('leaders:', leaders, 2000)
      } else {
        console.log('❌ No leaders key. Full response:')
        print('response:', data, 1000)
      }
    } else {
      console.log('No data\n')
    }
  }

  // ─── TEST 3: Team Schedule + Last Game Box Score ───────────────────────────
  console.log('━━━ TEST 3: Team Schedule & Box Score ━━━\n')

  const scheduleUrl = `${BASE}/teams/${DUKE_ID}/schedule?season=2026&seasontype=2&limit=5`
  console.log('URL:', scheduleUrl)
  const { status: sStatus, data: scheduleData } = await fetchJson(scheduleUrl)
  console.log('Status:', sStatus)

  if (!scheduleData) {
    console.log('No schedule data\n')
  } else {
    const d = scheduleData as Record<string, unknown>
    console.log('Schedule keys:', Object.keys(d).join(', '))

    // Find events/games
    const events = (d.events ?? d.games ?? d.schedule ?? []) as Array<Record<string, unknown>>
    console.log(`Events array length: ${Array.isArray(events) ? events.length : 'N/A'}`)

    if (Array.isArray(events) && events.length > 0) {
      const lastEvent = events[events.length - 1]
      console.log('\nLast event sample:')
      print('event:', lastEvent, 500)

      const gameId = lastEvent.id ?? (lastEvent.event as Record<string, unknown>)?.id
      if (gameId) {
        console.log(`Found game ID: ${gameId}`)
        console.log('\nFetching game summary (box score)...')
        const summaryUrl = `${BASE}/summary?event=${gameId}`
        console.log('URL:', summaryUrl)
        const { status: sumStatus, data: summaryData } = await fetchJson(summaryUrl)
        console.log('Status:', sumStatus)
        if (summaryData) {
          const sd = summaryData as Record<string, unknown>
          console.log('Summary keys:', Object.keys(sd).join(', '))
          const boxscore = sd.boxscore as Record<string, unknown> | undefined
          if (boxscore) {
            console.log('Boxscore keys:', Object.keys(boxscore).join(', '))
            const players = boxscore.players as Array<Record<string, unknown>> | undefined
            if (players?.length) {
              console.log(`\n✅ Found ${players.length} team player groups!`)
              const team1 = players[0]
              console.log('Player group keys:', Object.keys(team1).join(', '))
              const stats = team1.statistics as Array<Record<string, unknown>> | undefined
              if (stats?.length) {
                const statGroup = stats[0]
                console.log('Stat group keys:', Object.keys(statGroup).join(', '))
                console.log('Keys (stat column names):', JSON.stringify(statGroup.keys ?? statGroup.labels))
                const athletes = statGroup.athletes as Array<unknown> | undefined
                if (athletes?.length) {
                  console.log('\nFirst athlete in box score:')
                  print('athlete:', athletes[0], 600)
                }
              }
            }
          }
        }
      }
    }
  }

  // ─── TEST 4: Teams Statistics (show full structure) ────────────────────────
  console.log('\n━━━ TEST 4: Full Team Statistics Response ━━━\n')

  const teamStatsUrl = `${BASE}/teams/${DUKE_ID}/statistics?season=2026`
  console.log('URL:', teamStatsUrl)
  const { status: tsStatus, data: tsData } = await fetchJson(teamStatsUrl)
  console.log('Status:', tsStatus)
  if (tsData) {
    const d = tsData as Record<string, unknown>
    const results = d.results as Record<string, unknown> | undefined
    if (results) {
      console.log('results keys:', Object.keys(results).join(', '))
      const stats = results.stats as Record<string, unknown> | undefined
      if (stats) {
        console.log('results.stats keys:', Object.keys(stats).join(', '))
        const cats = stats.categories as Array<Record<string, unknown>> | undefined
        if (cats?.length) {
          console.log(`\n${cats.length} stat categories:`)
          for (const cat of cats) {
            const statList = cat.stats as Array<{name: string; value: number}> | undefined
            const names = (statList ?? []).map(s => `${s.name}=${s.value}`).join(', ')
            console.log(`  "${cat.name}": ${names.slice(0, 150)}`)
          }
        }
        // Check for "leaders" or "leaders per stat" at any level
        if (stats.leaders) {
          console.log('\n✅ Found stats.leaders!')
          print('stats.leaders:', stats.leaders, 1000)
        }
      }
      if (results.leaders) {
        console.log('\n✅ Found results.leaders!')
        print('results.leaders:', results.leaders, 1500)
      }
    }
    // Check top level
    if (d.leaders) {
      console.log('\n✅ Found top-level leaders in stats endpoint!')
      print('leaders:', d.leaders, 1500)
    }
  }

  console.log('\n═══════════════════════════════════════════════════')
  console.log('  Paste this output to get the player stats fixed!')
  console.log('═══════════════════════════════════════════════════')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
