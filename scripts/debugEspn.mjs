#!/usr/bin/env node
/**
 * Debug script: prints the raw ESPN API response for Duke (id: 150)
 * Run from the madnesslab project folder: node scripts/debugEspn.mjs
 * No tsx / no TypeScript needed.
 */

const espnId = 150
const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${espnId}/statistics`

console.log('Fetching:', url)

const res = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; MadnessLab/1.0)',
    Accept: 'application/json',
  },
})

console.log('Status:', res.status)
const data = await res.json()

// Print the top-level keys
console.log('\n── Top-level keys:', Object.keys(data))

// Print results keys if present
if (data.results) {
  console.log('── results keys:', Object.keys(data.results))
  if (data.results.splits) {
    console.log('── results.splits keys:', Object.keys(data.results.splits))
    const cats = data.results.splits.categories
    console.log('── results.splits.categories type:', typeof cats, Array.isArray(cats) ? '(array, length=' + cats.length + ')' : '')
    if (Array.isArray(cats) && cats.length > 0) {
      console.log('── First category name:', cats[0].name)
      console.log('── First category stats (first 5):', cats[0].stats?.slice(0, 5))
    } else if (cats && typeof cats === 'object') {
      console.log('── categories object keys:', Object.keys(cats).slice(0, 10))
    }
  }
  if (data.results.stats) {
    const stats = data.results.stats
    console.log('── results.stats type:', typeof stats, Array.isArray(stats) ? '(array, length=' + stats.length + ')' : '')
    if (Array.isArray(stats)) {
      console.log('── First few stats:', stats.slice(0, 5))
    }
  }
}

// Also print the full JSON so we can see everything
console.log('\n── Full JSON (truncated to 4000 chars):')
console.log(JSON.stringify(data, null, 2).slice(0, 4000))
