#!/usr/bin/env tsx
/**
 * MadnessLab — Barttorvik / T-Rank Real Data Fetcher
 *
 * Robust version:
 * - Handles Barttorvik array or object responses
 * - Supports the 2026 official bracket, including First Four teams
 * - Generates lib/realData.ts as a drop-in replacement shape
 * - Falls back safely when a team cannot be matched
 */

import fs from 'fs'
import path from 'path'

type Region = 'South' | 'East' | 'West' | 'Midwest'

const TOURNAMENT_BRACKET: Array<{
  seed: number
  name: string
  barttovrikName: string
  conference: string
  region: Region
  isFirstFour: boolean
}> = [
  // ── EAST ───────────────────────────────────────────────────────────────────
  { seed: 1,  name: 'Duke',               barttovrikName: 'Duke',               conference: 'ACC',          region: 'East',    isFirstFour: false },
  { seed: 16, name: 'Siena',              barttovrikName: 'Siena',              conference: 'MAAC',         region: 'East',    isFirstFour: false },
  { seed: 8,  name: 'Ohio State',         barttovrikName: 'Ohio State',         conference: 'Big Ten',      region: 'East',    isFirstFour: false },
  { seed: 9,  name: 'TCU',                barttovrikName: 'TCU',                conference: 'Big 12',       region: 'East',    isFirstFour: false },
  { seed: 5,  name: "St. John's",         barttovrikName: "St. John's",         conference: 'Big East',     region: 'East',    isFirstFour: false },
  { seed: 12, name: 'Northern Iowa',      barttovrikName: 'Northern Iowa',      conference: 'MVC',          region: 'East',    isFirstFour: false },
  { seed: 4,  name: 'Kansas',             barttovrikName: 'Kansas',             conference: 'Big 12',       region: 'East',    isFirstFour: false },
  { seed: 13, name: 'Cal Baptist',        barttovrikName: 'Cal Baptist',        conference: 'WAC',          region: 'East',    isFirstFour: false },
  { seed: 6,  name: 'Louisville',         barttovrikName: 'Louisville',         conference: 'ACC',          region: 'East',    isFirstFour: false },
  { seed: 11, name: 'South Florida',      barttovrikName: 'South Florida',      conference: 'AAC',          region: 'East',    isFirstFour: false },
  { seed: 3,  name: 'Michigan State',     barttovrikName: 'Michigan State',     conference: 'Big Ten',      region: 'East',    isFirstFour: false },
  { seed: 14, name: 'North Dakota State', barttovrikName: 'North Dakota State', conference: 'Summit',       region: 'East',    isFirstFour: false },
  { seed: 7,  name: 'UCLA',               barttovrikName: 'UCLA',               conference: 'Big Ten',      region: 'East',    isFirstFour: false },
  { seed: 10, name: 'UCF',                barttovrikName: 'UCF',                conference: 'Big 12',       region: 'East',    isFirstFour: false },
  { seed: 2,  name: 'UConn',              barttovrikName: 'Connecticut',        conference: 'Big East',     region: 'East',    isFirstFour: false },
  { seed: 15, name: 'Furman',             barttovrikName: 'Furman',             conference: 'SoCon',        region: 'East',    isFirstFour: false },

  // ── WEST ───────────────────────────────────────────────────────────────────
  { seed: 1,  name: 'Arizona',            barttovrikName: 'Arizona',            conference: 'Big 12',       region: 'West',    isFirstFour: false },
  { seed: 16, name: 'Long Island',        barttovrikName: 'LIU',                conference: 'NEC',          region: 'West',    isFirstFour: false },
  { seed: 8,  name: 'Villanova',          barttovrikName: 'Villanova',          conference: 'Big East',     region: 'West',    isFirstFour: false },
  { seed: 9,  name: 'Utah State',         barttovrikName: 'Utah State',         conference: 'MWC',          region: 'West',    isFirstFour: false },
  { seed: 5,  name: 'Wisconsin',          barttovrikName: 'Wisconsin',          conference: 'Big Ten',      region: 'West',    isFirstFour: false },
  { seed: 12, name: 'High Point',         barttovrikName: 'High Point',         conference: 'Big South',    region: 'West',    isFirstFour: false },
  { seed: 4,  name: 'Arkansas',           barttovrikName: 'Arkansas',           conference: 'SEC',          region: 'West',    isFirstFour: false },
  { seed: 13, name: 'Hawaii',             barttovrikName: 'Hawaii',             conference: 'Big West',     region: 'West',    isFirstFour: false },
  { seed: 6,  name: 'BYU',                barttovrikName: 'BYU',                conference: 'Big 12',       region: 'West',    isFirstFour: false },
  { seed: 11, name: 'Texas',              barttovrikName: 'Texas',              conference: 'SEC',          region: 'West',    isFirstFour: true  },
  { seed: 11, name: 'NC State',           barttovrikName: 'NC State',           conference: 'ACC',          region: 'West',    isFirstFour: true  },
  { seed: 3,  name: 'Gonzaga',            barttovrikName: 'Gonzaga',            conference: 'WCC',          region: 'West',    isFirstFour: false },
  { seed: 14, name: 'Kennesaw State',     barttovrikName: 'Kennesaw State',     conference: 'CUSA',         region: 'West',    isFirstFour: false },
  { seed: 7,  name: 'Miami (FL)',         barttovrikName: 'Miami FL',           conference: 'ACC',          region: 'West',    isFirstFour: false },
  { seed: 10, name: 'Missouri',           barttovrikName: 'Missouri',           conference: 'SEC',          region: 'West',    isFirstFour: false },
  { seed: 2,  name: 'Purdue',             barttovrikName: 'Purdue',             conference: 'Big Ten',      region: 'West',    isFirstFour: false },
  { seed: 15, name: 'Queens (N.C.)',      barttovrikName: 'Queens',             conference: 'ASUN',         region: 'West',    isFirstFour: false },

  // ── SOUTH ──────────────────────────────────────────────────────────────────
  { seed: 1,  name: 'Florida',            barttovrikName: 'Florida',            conference: 'SEC',          region: 'South',   isFirstFour: false },
  { seed: 16, name: 'Prairie View A&M',   barttovrikName: 'Prairie View A&M',   conference: 'SWAC',         region: 'South',   isFirstFour: true  },
  { seed: 16, name: 'Lehigh',             barttovrikName: 'Lehigh',             conference: 'Patriot',      region: 'South',   isFirstFour: true  },
  { seed: 8,  name: 'Clemson',            barttovrikName: 'Clemson',            conference: 'ACC',          region: 'South',   isFirstFour: false },
  { seed: 9,  name: 'Iowa',               barttovrikName: 'Iowa',               conference: 'Big Ten',      region: 'South',   isFirstFour: false },
  { seed: 5,  name: 'Vanderbilt',         barttovrikName: 'Vanderbilt',         conference: 'SEC',          region: 'South',   isFirstFour: false },
  { seed: 12, name: 'McNeese',            barttovrikName: 'McNeese State',      conference: 'Southland',    region: 'South',   isFirstFour: false },
  { seed: 4,  name: 'Nebraska',           barttovrikName: 'Nebraska',           conference: 'Big Ten',      region: 'South',   isFirstFour: false },
  { seed: 13, name: 'Troy',               barttovrikName: 'Troy',               conference: 'Sun Belt',     region: 'South',   isFirstFour: false },
  { seed: 6,  name: 'North Carolina',     barttovrikName: 'North Carolina',     conference: 'ACC',          region: 'South',   isFirstFour: false },
  { seed: 11, name: 'VCU',                barttovrikName: 'VCU',                conference: 'A-10',         region: 'South',   isFirstFour: false },
  { seed: 3,  name: 'Illinois',           barttovrikName: 'Illinois',           conference: 'Big Ten',      region: 'South',   isFirstFour: false },
  { seed: 14, name: 'Penn',               barttovrikName: 'Penn',               conference: 'Ivy',          region: 'South',   isFirstFour: false },
  { seed: 7,  name: "Saint Mary's",       barttovrikName: "Saint Mary's (CA)", conference: 'WCC',          region: 'South',   isFirstFour: false },
  { seed: 10, name: 'Texas A&M',          barttovrikName: 'Texas A&M',          conference: 'SEC',          region: 'South',   isFirstFour: false },
  { seed: 2,  name: 'Houston',            barttovrikName: 'Houston',            conference: 'Big 12',       region: 'South',   isFirstFour: false },
  { seed: 15, name: 'Idaho',              barttovrikName: 'Idaho',              conference: 'Big Sky',      region: 'South',   isFirstFour: false },

  // ── MIDWEST ────────────────────────────────────────────────────────────────
  { seed: 1,  name: 'Michigan',           barttovrikName: 'Michigan',           conference: 'Big Ten',      region: 'Midwest', isFirstFour: false },
  { seed: 16, name: 'UMBC',               barttovrikName: 'UMBC',               conference: 'America East', region: 'Midwest', isFirstFour: true  },
  { seed: 16, name: 'Howard',             barttovrikName: 'Howard',             conference: 'MEAC',         region: 'Midwest', isFirstFour: true  },
  { seed: 8,  name: 'Georgia',            barttovrikName: 'Georgia',            conference: 'SEC',          region: 'Midwest', isFirstFour: false },
  { seed: 9,  name: 'Saint Louis',        barttovrikName: 'Saint Louis',        conference: 'A-10',         region: 'Midwest', isFirstFour: false },
  { seed: 5,  name: 'Texas Tech',         barttovrikName: 'Texas Tech',         conference: 'Big 12',       region: 'Midwest', isFirstFour: false },
  { seed: 12, name: 'Akron',              barttovrikName: 'Akron',              conference: 'MAC',          region: 'Midwest', isFirstFour: false },
  { seed: 4,  name: 'Alabama',            barttovrikName: 'Alabama',            conference: 'SEC',          region: 'Midwest', isFirstFour: false },
  { seed: 13, name: 'Hofstra',            barttovrikName: 'Hofstra',            conference: 'CAA',          region: 'Midwest', isFirstFour: false },
  { seed: 6,  name: 'Tennessee',          barttovrikName: 'Tennessee',          conference: 'SEC',          region: 'Midwest', isFirstFour: false },
  { seed: 11, name: 'Miami (Ohio)',       barttovrikName: 'Miami OH',           conference: 'MAC',          region: 'Midwest', isFirstFour: true  },
  { seed: 11, name: 'SMU',                barttovrikName: 'SMU',                conference: 'AAC',          region: 'Midwest', isFirstFour: true  },
  { seed: 3,  name: 'Virginia',           barttovrikName: 'Virginia',           conference: 'ACC',          region: 'Midwest', isFirstFour: false },
  { seed: 14, name: 'Wright State',       barttovrikName: 'Wright State',       conference: 'Horizon',      region: 'Midwest', isFirstFour: false },
  { seed: 7,  name: 'Kentucky',           barttovrikName: 'Kentucky',           conference: 'SEC',          region: 'Midwest', isFirstFour: false },
  { seed: 10, name: 'Santa Clara',        barttovrikName: 'Santa Clara',        conference: 'WCC',          region: 'Midwest', isFirstFour: false },
  { seed: 2,  name: 'Iowa State',         barttovrikName: 'Iowa State',         conference: 'Big 12',       region: 'Midwest', isFirstFour: false },
  { seed: 15, name: 'Tennessee State',    barttovrikName: 'Tennessee State',    conference: 'OVC',          region: 'Midwest', isFirstFour: false },
]

interface BarttovrikTeam {
  team: string
  conf: string
  g: number
  rec: string
  adjoe: number
  adjde: number
  barthag: number
  efg_o: number
  efg_d: number
  tor: number
  tord: number
  orb: number
  drb: number
  ftr: number
  ftrd: number
  twop_o: number
  twop_d: number
  threep_o: number
  threep_d: number
  adj_t: number
  wab: number
  rk: number
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.'’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function getAbbreviation(name: string): string {
  const custom: Record<string, string> = {
    Duke: 'DUKE',
    Siena: 'SIE',
    'Ohio State': 'OSU',
    TCU: 'TCU',
    "St. John's": 'SJU',
    'Northern Iowa': 'UNI',
    Kansas: 'KU',
    'Cal Baptist': 'CBU',
    Louisville: 'LOU',
    'South Florida': 'USF',
    'Michigan State': 'MSU',
    'North Dakota State': 'NDSU',
    UCLA: 'UCLA',
    UCF: 'UCF',
    UConn: 'UCON',
    Furman: 'FUR',
    Arizona: 'ARIZ',
    'Long Island': 'LIU',
    Villanova: 'NOVA',
    'Utah State': 'USU',
    Wisconsin: 'WIS',
    'High Point': 'HPU',
    Arkansas: 'ARK',
    Hawaii: 'HAW',
    BYU: 'BYU',
    Texas: 'TEX',
    'NC State': 'NCSU',
    Gonzaga: 'GONZ',
    'Kennesaw State': 'KENN',
    'Miami (FL)': 'MIA',
    Missouri: 'MIZ',
    Purdue: 'PUR',
    'Queens (N.C.)': 'QUE',
    Florida: 'FLA',
    'Prairie View A&M': 'PVAM',
    Lehigh: 'LEH',
    Clemson: 'CLEM',
    Iowa: 'IOWA',
    Vanderbilt: 'VAN',
    McNeese: 'MCNS',
    Nebraska: 'NEB',
    Troy: 'TROY',
    'North Carolina': 'UNC',
    VCU: 'VCU',
    Illinois: 'ILL',
    Penn: 'PENN',
    "Saint Mary's": 'SMC',
    'Texas A&M': 'TAMU',
    Houston: 'HOU',
    Idaho: 'IDHO',
    Michigan: 'MICH',
    UMBC: 'UMBC',
    Howard: 'HOW',
    Georgia: 'UGA',
    'Saint Louis': 'SLU',
    'Texas Tech': 'TTU',
    Akron: 'AKR',
    Alabama: 'BAMA',
    Hofstra: 'HOF',
    Tennessee: 'TENN',
    'Miami (Ohio)': 'M-OH',
    SMU: 'SMU',
    Virginia: 'UVA',
    'Wright State': 'WRST',
    Kentucky: 'UK',
    'Santa Clara': 'SCU',
    'Iowa State': 'ISU',
    'Tennessee State': 'TNST',
  }

  return custom[name] || name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4)
}

function getProgramTier(name: string): 'blueblood' | 'power' | 'mid-major' | 'low-major' {
  const bluebloods = [
    'Duke', 'Kansas', 'UCLA', 'UConn', 'Kentucky', 'North Carolina',
    'Michigan State', 'Arizona', 'Purdue', 'Virginia', 'Louisville'
  ]
  const powerPrograms = [
    'Houston', 'Florida', 'Michigan', 'Iowa State', 'Alabama', 'Tennessee',
    'Illinois', 'Wisconsin', 'Arkansas', 'Texas Tech', 'Villanova', 'Ohio State',
    "St. John's", 'Texas A&M', 'Clemson', 'Missouri', 'BYU', 'UCLA',
    'Gonzaga', 'Nebraska', 'Vanderbilt', 'Georgia'
  ]
  const midMajors = [
    'VCU', 'McNeese', 'Saint Mary\'s', 'Akron', 'High Point', 'Utah State',
    'Santa Clara', 'Northern Iowa', 'South Florida', 'Furman', 'Troy',
    'Kennesaw State', 'Hofstra', 'Wright State', 'Lehigh', 'UMBC', 'Howard'
  ]

  if (bluebloods.includes(name)) return 'blueblood'
  if (powerPrograms.includes(name)) return 'power'
  if (midMajors.includes(name)) return 'mid-major'
  return 'low-major'
}

function getEspnId(name: string): number | null {
  const ids: Record<string, number> = {
    // East
    'Duke': 150,
    'Siena': 2561,
    'Ohio State': 194,
    'TCU': 2628,
    "St. John's": 2599,
    'Northern Iowa': 2271,
    'Kansas': 2305,
    'Cal Baptist': 2856,
    'Louisville': 97,
    'South Florida': 58,
    'Michigan State': 127,
    'North Dakota State': 2449,
    'UCLA': 26,
    'UCF': 2116,
    'UConn': 41,
    'Furman': 231,
    // West
    'Arizona': 12,
    'Long Island': 112358,
    'Villanova': 222,
    'Utah State': 328,
    'Wisconsin': 275,
    'High Point': 2272,
    'Arkansas': 8,
    'Hawaii': 62,
    'BYU': 252,
    'Texas': 251,
    'NC State': 152,
    'Gonzaga': 2250,
    'Kennesaw State': 2378,
    'Miami (FL)': 2390,
    'Missouri': 142,
    'Purdue': 2509,
    'Queens (N.C.)': 2511,
    // South
    'Florida': 57,
    'Prairie View A&M': 2480,
    'Lehigh': 2350,
    'Clemson': 228,
    'Iowa': 2294,
    'Vanderbilt': 238,
    'McNeese': 2393,
    'Nebraska': 158,
    'Troy': 2653,
    'North Carolina': 153,
    'VCU': 2670,
    'Illinois': 356,
    'Penn': 219,
    "Saint Mary's": 2608,
    'Texas A&M': 245,
    'Houston': 248,
    'Idaho': 70,
    // Midwest
    'Michigan': 130,
    'UMBC': 2427,
    'Howard': 2287,
    'Georgia': 61,
    'Saint Louis': 139,
    'Texas Tech': 44,
    'Akron': 2006,
    'Alabama': 333,
    'Hofstra': 2275,
    'Tennessee': 2633,
    'Miami (Ohio)': 193,
    'SMU': 2567,
    'Virginia': 258,
    'Wright State': 2711,
    'Kentucky': 96,
    'Santa Clara': 2541,
    'Iowa State': 66,
    'Tennessee State': 2634,
  }
  return ids[name] ?? null
}

function getPrimaryColor(name: string): string {
  const colors: Record<string, string> = {
    Duke: '#003087',
    Siena: '#006747',
    'Ohio State': '#BB0000',
    TCU: '#4D1979',
    "St. John's": '#CC0000',
    'Northern Iowa': '#592C88',
    Kansas: '#0051BA',
    'Cal Baptist': '#002D72',
    Louisville: '#AD0000',
    'South Florida': '#006747',
    'Michigan State': '#18453B',
    'North Dakota State': '#0A5640',
    UCLA: '#2774AE',
    UCF: '#000000',
    UConn: '#0C2340',
    Furman: '#4B2E83',
    Arizona: '#AB0520',
    'Long Island': '#000000',
    Villanova: '#00205B',
    'Utah State': '#0F243E',
    Wisconsin: '#C5050C',
    'High Point': '#5E2A84',
    Arkansas: '#9D2235',
    Hawaii: '#024731',
    BYU: '#002E5D',
    Texas: '#BF5700',
    'NC State': '#CC0000',
    Gonzaga: '#041E42',
    'Kennesaw State': '#FDBB30',
    'Miami (FL)': '#F47321',
    Missouri: '#F1B82D',
    Purdue: '#CEB888',
    'Queens (N.C.)': '#003DA5',
    Florida: '#0021A5',
    'Prairie View A&M': '#4B1979',
    Lehigh: '#653819',
    Clemson: '#F56600',
    Iowa: '#FFCD00',
    Vanderbilt: '#866D4B',
    McNeese: '#00539B',
    Nebraska: '#E41C38',
    Troy: '#8A1538',
    'North Carolina': '#7BAFD4',
    VCU: '#FDBB30',
    Illinois: '#E84A27',
    Penn: '#011F5B',
    "Saint Mary's": '#C8102E',
    'Texas A&M': '#500000',
    Houston: '#C8102E',
    Idaho: '#B18E5F',
    Michigan: '#00274C',
    UMBC: '#FFC20E',
    Howard: '#003A63',
    Georgia: '#BA0C2F',
    'Saint Louis': '#003DA5',
    'Texas Tech': '#CC0000',
    Akron: '#041E42',
    Alabama: '#9E1B32',
    Hofstra: '#FDBB30',
    Tennessee: '#FF8200',
    'Miami (Ohio)': '#B61E2E',
    SMU: '#C8102E',
    Virginia: '#232D4B',
    'Wright State': '#026937',
    Kentucky: '#0033A0',
    'Santa Clara': '#862633',
    'Iowa State': '#C8102E',
    'Tennessee State': '#003DA5',
  }

  return colors[name] || '#1a1a2e'
}

function computeThreePointRate(data: BarttovrikTeam): number {
  const raw3 = Number(data.threep_o ?? 33)
  const normalized = raw3 > 1 ? raw3 / 100 : raw3
  const base = 0.35
  const effect = (normalized - 0.33) * 0.5
  return Math.max(0.20, Math.min(0.55, base + effect))
}

function computeSosRank(data: BarttovrikTeam, allTeams: BarttovrikTeam[]): number {
  const sorted = [...allTeams].sort((a, b) => Number(b.wab ?? 0) - Number(a.wab ?? 0))
  const idx = sorted.findIndex(t => String(t.team) === String(data.team))
  return idx >= 0 ? idx + 1 : 50
}

function computeLuckFactor(data: BarttovrikTeam): number {
  if (!data.rec) return 0
  const match = String(data.rec).match(/(\d+)\s*-\s*(\d+)/)
  if (!match) return 0

  const wins = Number(match[1])
  const losses = Number(match[2])
  const games = wins + losses
  if (!games) return 0

  const recordWinPct = wins / games
  return Math.max(-0.15, Math.min(0.15, recordWinPct - Number(data.barthag ?? 0.5)))
}

function parseRecord(rec: string): { wins: number; losses: number } {
  const match = String(rec ?? '').match(/(\d+)\s*-\s*(\d+)/)
  if (!match) return { wins: 0, losses: 0 }
  return { wins: parseInt(match[1]), losses: parseInt(match[2]) }
}

function computeRecentForm(seed: number, barthag: number, rec?: string) {
  // Use actual season record when available from Barttorvik
  const { wins: winsTotal, losses: lossesTotal } = parseRecord(rec ?? '')
  const gamesPlayed = winsTotal + lossesTotal
  const winPct = gamesPlayed > 0
    ? winsTotal / gamesPlayed
    : Math.max(0.2, Math.min(0.99, barthag || 0.5))

  // Estimate last-5 / last-10 from season win% (best proxy without game logs)
  const last5wins = Math.max(0, Math.min(5, Math.round(winPct * 5)))
  const last10wins = Math.max(0, Math.min(10, Math.round(winPct * 10)))

  // Streak: if win% > expected (barthag), team is over-performing → likely on W run
  const luckFactor = winPct - (barthag || 0.5)
  const streakType: 'W' | 'L' = luckFactor >= 0 ? 'W' : 'L'
  const streakLength = Math.max(1, Math.min(8, Math.round(Math.abs(luckFactor) * 20) + 1))
  const avgMarginLast5 = Number(((winPct - 0.5) * 30).toFixed(1))

  return { winsTotal, lossesTotal, last5wins, last10wins, streakType, streakLength, avgMarginLast5 }
}

function computeTitleProfileScore(adjEM: number, seed: number, barthag: number): number {
  const emScore = Math.min(100, Math.max(0, (adjEM - 10) * 2.5))
  const seedBonus = Math.max(0, (8 - seed) * 3)
  const barthagScore = Math.max(0, Math.min(1, barthag)) * 40
  return Math.round(Math.min(100, (emScore * 0.5 + seedBonus + barthagScore) * 0.8))
}

function computeUpsetVulnerability(adjEM: number, seed: number, threepRate: number, torRate: number): number {
  const seedEffect = Math.max(0, (seed - 1) * 4)
  const emEffect = Math.max(0, 30 - adjEM)
  const chaosEffect = (threepRate - 0.33) * 30 + (torRate - 17) * 1.5
  return Math.round(Math.max(5, Math.min(85, seedEffect + emEffect * 0.5 + chaosEffect)))
}

function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function safeString(value: unknown, fallback = ''): string {
  if (value == null) return fallback
  return String(value)
}

function toTeamObjectFromArrayRow(row: unknown[]): BarttovrikTeam | null {
  if (!Array.isArray(row) || row.length === 0) return null

  // Live Barttorvik row currently starts with team name.
  // We use a safe positional mapping and defaults.
  const team = safeString(row[0]).trim()
  if (!team) return null

  const parsed = {
    team,
    adjoe: safeNumber(row[1], 110),
    adjde: safeNumber(row[2], 100),
    barthag: safeNumber(row[3], 0.5),
    wab: safeNumber(row[4], 0),
    conf: safeString(row[5], ''),
    g: safeNumber(row[6], 0),
    rec: safeString(row[7], '0-0'),
    efg_o: safeNumber(row[8], 50),
    efg_d: safeNumber(row[9], 50),
    tor: safeNumber(row[10], 17),
    tord: safeNumber(row[11], 17),
    orb: safeNumber(row[12], 30),
    drb: safeNumber(row[13], 70),
    ftr: safeNumber(row[14], 30),
    ftrd: safeNumber(row[15], 30),
    twop_o: safeNumber(row[16], 50),
    twop_d: safeNumber(row[17], 50),
    threep_o: safeNumber(row[18], 33),
    threep_d: safeNumber(row[19], 33),
    adj_t: safeNumber(row[20], 68),
    rk: safeNumber(row[21], 999),
  }

  // Sanity-check key fields. The Barttorvik array column layout can shift
  // between seasons. If values are implausible, return null so the caller
  // falls back to seed-based estimates rather than using scrambled data.
  const adjOEPlausible = parsed.adjoe >= 85 && parsed.adjoe <= 145
  const adjDEPlausible = parsed.adjde >= 80 && parsed.adjde <= 130
  const tempoPlausible = parsed.adj_t >= 55 && parsed.adj_t <= 90
  const torPlausible   = parsed.tor >= 8   && parsed.tor <= 28
  const drbPlausible   = parsed.drb >= 50  && parsed.drb <= 90

  if (!adjOEPlausible || !adjDEPlausible) {
    // Core efficiency stats wrong — reject entire row
    return null
  }

  if (!tempoPlausible || !torPlausible || !drbPlausible) {
    // Secondary stats are scrambled — keep adjOE/DE/barthag/rk, zero out bad fields
    console.warn(`  ⚠️  Scrambled secondary stats for ${team} (adj_t=${parsed.adj_t}, tor=${parsed.tor}) — using defaults`)
    return {
      ...parsed,
      adj_t: 68,  // use average tempo
      tor: 17,    // use average turnover rate
      tord: 19,
      orb: 28,
      drb: 71,
      ftr: 32,
      ftrd: 32,
      wab: parsed.adj_t, // the "tempo" slot likely holds WAB in the shifted format
    }
  }

  return parsed
}

function toTeamObjectFromObject(raw: Record<string, unknown>): BarttovrikTeam | null {
  const team = safeString(raw.team).trim()
  if (!team) return null

  return {
    team,
    conf: safeString(raw.conf),
    g: safeNumber(raw.g),
    rec: safeString(raw.rec, '0-0'),
    adjoe: safeNumber(raw.adjoe, 110),
    adjde: safeNumber(raw.adjde, 100),
    barthag: safeNumber(raw.barthag, 0.5),
    efg_o: safeNumber(raw.efg_o, 50),
    efg_d: safeNumber(raw.efg_d, 50),
    tor: safeNumber(raw.tor, 17),
    tord: safeNumber(raw.tord, 17),
    orb: safeNumber(raw.orb, 30),
    drb: safeNumber(raw.drb, 70),
    ftr: safeNumber(raw.ftr, 30),
    ftrd: safeNumber(raw.ftrd, 30),
    twop_o: safeNumber(raw.twop_o, 50),
    twop_d: safeNumber(raw.twop_d, 50),
    threep_o: safeNumber(raw.threep_o, 33),
    threep_d: safeNumber(raw.threep_d, 33),
    adj_t: safeNumber(raw.adj_t, 68),
    wab: safeNumber(raw.wab, 0),
    rk: safeNumber(raw.rk, 999),
  }
}

async function fetchBarttovrikData(year = 2026): Promise<BarttovrikTeam[]> {
  const url = `https://barttorvik.com/teamslicejson.php?year=${year}&json=1`
  console.log(`\n📡 Fetching T-Rank data from: ${url}`)

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MadnessLab/1.0; NCAA Tournament Analytics)',
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Barttorvik API returned ${response.status}: ${response.statusText}`)
  }

  const raw = await response.json()

  if (!Array.isArray(raw)) {
    throw new Error('Unexpected response format from Barttorvik API')
  }

  const teams: BarttovrikTeam[] = []

  for (const item of raw) {
    if (Array.isArray(item)) {
      const parsed = toTeamObjectFromArrayRow(item)
      if (parsed) teams.push(parsed)
      continue
    }

    if (item && typeof item === 'object') {
      const parsed = toTeamObjectFromObject(item as Record<string, unknown>)
      if (parsed) teams.push(parsed)
    }
  }

  if (teams.length === 0) {
    throw new Error('Barttorvik API parsed successfully, but no teams were found')
  }

  return teams
}

function buildTeamMap(barttovrikData: BarttovrikTeam[]): Map<string, BarttovrikTeam> {
  const map = new Map<string, BarttovrikTeam>()

  for (const team of barttovrikData) {
    const teamName = safeString(team.team).trim()
    if (!teamName) continue

    const normalized = teamName.toLowerCase()
    map.set(normalized, team)
    map.set(slugify(teamName), team)

    // extra aliases for common naming mismatches
    const aliases: string[] = []

    if (teamName === 'Connecticut') aliases.push('uconn')
    if (teamName === "Saint Mary's (CA)") aliases.push("saint mary's", 'saint-marys', 'saint marys')
    if (teamName === 'Miami FL') aliases.push('miami (fl)', 'miami fl', 'miami-fl')
    if (teamName === 'Miami OH') aliases.push('miami (ohio)', 'miami ohio', 'miami-ohio')
    if (teamName === 'LIU') aliases.push('long island', 'long-island')
    if (teamName === 'McNeese State') aliases.push('mcneese')
    if (teamName === 'Queens') aliases.push('queens (n.c.)', 'queens nc', 'queens-n-c')
    if (teamName === 'UCF') aliases.push('central florida')
    if (teamName === 'NC State') aliases.push('north carolina state')
    if (teamName === 'St. John\'s') aliases.push("st john's", 'st johns', 'saint johns')
    if (teamName === 'Saint Louis') aliases.push('st louis')
    if (teamName === 'Prairie View A&M') aliases.push('prairie view')
    if (teamName === 'South Florida') aliases.push('usf')
    if (teamName === 'Tennessee State') aliases.push('tn state', 'tenn state')

    for (const alias of aliases) {
      map.set(alias.toLowerCase(), team)
      map.set(slugify(alias), team)
    }
  }

  return map
}

function findTeamData(
  bracketEntry: typeof TOURNAMENT_BRACKET[number],
  teamMap: Map<string, BarttovrikTeam>
): BarttovrikTeam | null {
  const candidates = [
    bracketEntry.barttovrikName,
    bracketEntry.name,
    slugify(bracketEntry.barttovrikName),
    slugify(bracketEntry.name),
    bracketEntry.barttovrikName.toLowerCase().trim(),
    bracketEntry.name.toLowerCase().trim(),
  ]

  for (const key of candidates) {
    const found = teamMap.get(key.toLowerCase())
    if (found) return found
  }

  const target = bracketEntry.barttovrikName.toLowerCase()
  for (const [key, val] of teamMap.entries()) {
    if (key.includes(target) || target.includes(key)) {
      return val
    }
  }

  return null
}

function transformToMockTeam(
  bracketEntry: typeof TOURNAMENT_BRACKET[number],
  btData: BarttovrikTeam | null,
  allBtData: BarttovrikTeam[]
): string {
  const useReal = btData !== null

  const adjOE = useReal ? safeNumber(btData!.adjoe, 110) : (120 - bracketEntry.seed * 1.2)
  const adjDE = useReal ? safeNumber(btData!.adjde, 100) : (90 + bracketEntry.seed * 0.8)
  const adjEM = adjOE - adjDE
  const tempo = useReal ? safeNumber(btData!.adj_t, 68) : (70 - bracketEntry.seed * 0.2)
  const efgPct = useReal ? safeNumber(btData!.efg_o, 50) / 100 : (0.55 - bracketEntry.seed * 0.005)
  const threePct = useReal ? safeNumber(btData!.threep_o, 33) / 100 : (0.35 - bracketEntry.seed * 0.003)
  const threePointRate = useReal ? computeThreePointRate(btData!) : 0.35
  const ftRate = useReal ? safeNumber(btData!.ftr, 30) / 100 : 0.32
  const ftPct = 0.72
  const turnoverRate = useReal ? safeNumber(btData!.tor, 17) : (17 + bracketEntry.seed * 0.2)
  const turnoverForcedRate = useReal ? safeNumber(btData!.tord, 17) : (17 - bracketEntry.seed * 0.1)
  const offReboundRate = useReal ? safeNumber(btData!.orb, 30) : (30 - bracketEntry.seed * 0.3)
  const defReboundRate = useReal ? safeNumber(btData!.drb, 72) : (72 + bracketEntry.seed * 0.1)
  const sosRank = useReal ? computeSosRank(btData!, allBtData) : (bracketEntry.seed * 4)
  const luckFactor = useReal ? computeLuckFactor(btData!) : 0
  const kenpomRank = useReal ? safeNumber(btData!.rk, bracketEntry.seed * 3 - 1) : (bracketEntry.seed * 3 - 1)
  const barthag = useReal ? safeNumber(btData!.barthag, 0.5) : Math.max(0.05, 0.95 - bracketEntry.seed * 0.05)

  const rec = useReal ? safeString(btData!.rec, '0-0') : '0-0'
  const recentForm = computeRecentForm(bracketEntry.seed, barthag, rec)
  const titleProfileScore = computeTitleProfileScore(adjEM, bracketEntry.seed, barthag)
  const upsetVulnerability = computeUpsetVulnerability(adjEM, bracketEntry.seed, threePointRate, turnoverRate)

  return `  {
    id: '${slugify(bracketEntry.name)}',
    name: '${bracketEntry.name.replace(/'/g, "\\'")}',
    slug: '${slugify(bracketEntry.name)}',
    abbreviation: '${getAbbreviation(bracketEntry.name)}',
    conference: '${bracketEntry.conference}',
    programTier: '${getProgramTier(bracketEntry.name)}',
    primaryColor: '${getPrimaryColor(bracketEntry.name)}',
    seed: ${bracketEntry.seed},
    region: '${bracketEntry.region}',
    isFirstFour: ${bracketEntry.isFirstFour},
    stats: {
      adjOE: ${adjOE.toFixed(1)},
      adjDE: ${adjDE.toFixed(1)},
      adjEM: ${adjEM.toFixed(1)},
      tempo: ${tempo.toFixed(1)},
      threePointRate: ${threePointRate.toFixed(3)},
      threePointPct: ${threePct.toFixed(3)},
      efgPct: ${efgPct.toFixed(3)},
      ftRate: ${ftRate.toFixed(3)},
      ftPct: ${ftPct.toFixed(3)},
      turnoverRate: ${turnoverRate.toFixed(1)},
      turnoverForcedRate: ${turnoverForcedRate.toFixed(1)},
      offReboundRate: ${offReboundRate.toFixed(1)},
      defReboundRate: ${defReboundRate.toFixed(1)},
      sosRank: ${Math.round(sosRank)},
      luckFactor: ${luckFactor.toFixed(3)},
      kenpomRank: ${Math.round(kenpomRank)},
    },
    winsTotal: ${recentForm.winsTotal},
    lossesTotal: ${recentForm.lossesTotal},
    recentForm: {
      last5wins: ${recentForm.last5wins},
      last10wins: ${recentForm.last10wins},
      streakType: '${recentForm.streakType}',
      streakLength: ${recentForm.streakLength},
      avgMarginLast5: ${recentForm.avgMarginLast5},
    },
    titleProfileScore: ${titleProfileScore},
    upsetVulnerability: ${upsetVulnerability},
    espnId: ${getEspnId(bracketEntry.name) ?? 'undefined'},
    _dataSource: '${useReal ? 'barttorvik-live' : 'seed-estimate'}',
  }`
}

async function main() {
  console.log('🏀 MadnessLab — T-Rank Real Data Fetcher')
  console.log('━'.repeat(50))

  let barttovrikData: BarttovrikTeam[] = []
  let fetchFailed = false

  try {
    barttovrikData = await fetchBarttovrikData(2026)
    console.log(`✅ Fetched ${barttovrikData.length} teams from Barttorvik`)
  } catch (err) {
    console.warn(`\n⚠️  Barttorvik fetch failed: ${err}`)
    console.warn('   Falling back to seed-based estimates for all teams.')
    fetchFailed = true
  }

  const teamMap = buildTeamMap(barttovrikData)

  let realCount = 0
  let estimatedCount = 0
  const missingTeams: string[] = []

  const regionGroups: Record<Region, string[]> = {
    South: [],
    East: [],
    West: [],
    Midwest: [],
  }

  for (const entry of TOURNAMENT_BRACKET) {
    const btData = fetchFailed ? null : findTeamData(entry, teamMap)

    if (btData) {
      realCount++
    } else {
      estimatedCount++
      if (!fetchFailed) {
        missingTeams.push(`  ${entry.name} (#${entry.seed} ${entry.region})`)
      }
    }

    const teamStr = transformToMockTeam(entry, btData, barttovrikData)
    regionGroups[entry.region].push(teamStr)
  }

  const timestamp = new Date().toISOString()
  const dataSourceNote = fetchFailed
    ? '// ⚠️  ESTIMATED DATA: Barttorvik was unreachable. Stats are seed-based estimates.'
    : `// ✅ REAL DATA: Fetched from barttorvik.com on ${timestamp}`

  const output = `/**
 * MadnessLab Real Data — 2026 NCAA Tournament
 *
 * AUTO-GENERATED by scripts/fetchTRankData.ts
 * Generated: ${timestamp}
 *
 * Data source: Barttorvik / T-Rank (barttorvik.com)
 * ${fetchFailed ? '⚠️  Status: Estimated data (fetch failed)' : `✅ Status: Real data (${realCount} teams matched, ${estimatedCount} estimated)`}
 */

${dataSourceNote}

export type { MockTeam } from './mockData'
import type { MockTeam } from './mockData'

// ─── SOUTH REGION ─────────────────────────────────────────────────────────────

const SOUTH_TEAMS: (MockTeam & { _dataSource?: string })[] = [
${regionGroups.South.join(',\n')}
]

// ─── EAST REGION ──────────────────────────────────────────────────────────────

const EAST_TEAMS: (MockTeam & { _dataSource?: string })[] = [
${regionGroups.East.join(',\n')}
]

// ─── WEST REGION ──────────────────────────────────────────────────────────────

const WEST_TEAMS: (MockTeam & { _dataSource?: string })[] = [
${regionGroups.West.join(',\n')}
]

// ─── MIDWEST REGION ───────────────────────────────────────────────────────────

const MIDWEST_TEAMS: (MockTeam & { _dataSource?: string })[] = [
${regionGroups.Midwest.join(',\n')}
]

export const ALL_TEAMS: MockTeam[] = [
  ...SOUTH_TEAMS,
  ...EAST_TEAMS,
  ...WEST_TEAMS,
  ...MIDWEST_TEAMS,
] as MockTeam[]

export const TEAMS_BY_REGION = {
  South: SOUTH_TEAMS as MockTeam[],
  East: EAST_TEAMS as MockTeam[],
  West: WEST_TEAMS as MockTeam[],
  Midwest: MIDWEST_TEAMS as MockTeam[],
}

export const DATA_SOURCE = '${fetchFailed ? 'estimated' : 'barttorvik-live'}'
export const DATA_FETCHED_AT = '${timestamp}'
export const REAL_TEAMS_COUNT = ${realCount}
export const ESTIMATED_TEAMS_COUNT = ${estimatedCount}
`

  const outputPath = path.join(process.cwd(), 'lib', 'realData.ts')
  fs.writeFileSync(outputPath, output, 'utf-8')

  console.log(`\n📁 Output: lib/realData.ts`)
  console.log(`   ✅ Real data: ${realCount} teams`)
  console.log(`   📊 Estimated: ${estimatedCount} teams`)

  if (missingTeams.length > 0) {
    console.log(`\n⚠️  Teams not matched to Barttorvik:`)
    missingTeams.forEach(t => console.log(t))
  }

  console.log('\n📋 Next steps:')
  console.log('   1. Run: npm run data:fetch')
  console.log('   2. Run: npm run dev')
  console.log("   3. Make sure your app imports from '@/lib/realData' if needed")
  console.log('\n✅ Done!\n')
}

main().catch(e => {
  console.error('\n❌ Fatal error:', e)
  process.exit(1)
})