/**
 * MadnessLab Prediction Engine
 * 4-layer analytics model for computing win probabilities and upset scores.
 *
 * Layer 1: Base team strength (adjEM, kenpomRank, SOS)
 * Layer 2: Matchup adjustments (style interactions)
 * Layer 3: Tournament priors (seed history, archetypes)
 * Layer 4: Variance / chaos model (volatility)
 *
 * Note: All stats here are mock data. To connect real data,
 * replace the MockTeam inputs with real provider data.
 */

import type { MockTeam } from './mockData'
import { getUpsetRateForMatchup } from './historicalData'

export type ConfidenceTier = 'coin_flip' | 'slight_edge' | 'favored' | 'clear_favorite'
export type UpsetAlertTier = 'none' | 'low' | 'medium' | 'high'

export interface MatchupPrediction {
  team1Id: string
  team2Id: string
  team1WinProb: number
  team2WinProb: number
  favoriteId: string
  underdogId: string
  confidenceTier: ConfidenceTier
  volatilityScore: number        // 0-100
  upsetAlertTier: UpsetAlertTier
  upsetAlertScore: number        // 0-100
  upsetAlertReasons: string[]
  decidingFactors: string[]
  layer1Score: { team1: number; team2: number }
  layer2Adjustments: { label: string; favoringTeam: string; magnitude: number }[]
  layer3Prior: number            // Historical seed matchup prior (0-1 for team1)
  layer4Volatility: number       // Chaos multiplier (1.0 = neutral)
}

// ─── Layer 1: Base Team Strength ──────────────────────────────────────────────

function computeBaseStrength(team: MockTeam): number {
  const { adjOE, adjDE, adjEM, kenpomRank, sosRank } = team.stats

  // KenPom logistic model weight (60% of base)
  const emScore = adjEM * 0.6

  // SOS adjustment: reward teams that played tough schedules
  const sosPenalty = Math.max(0, (sosRank - 50) / 300) * 2
  const sosBonus = Math.max(0, (50 - sosRank) / 50) * 1.5
  const sosAdj = sosBonus - sosPenalty

  // Recent form bonus — kept small so hot streaks don't override efficiency reality
  const { last5wins, last10wins, streakType, streakLength, avgMarginLast5 } = team.recentForm
  const formScore = (last5wins / 5) * 0.8 + (last10wins / 10) * 0.4
    + (streakType === 'W' ? Math.min(streakLength, 5) * 0.05 : -Math.min(streakLength, 5) * 0.05)
    + avgMarginLast5 * 0.02

  void kenpomRank // ranked by adjEM via kenpomRank; not used in base strength directly

  return emScore + sosAdj + formScore
}

// ─── Layer 2: Matchup Adjustments ─────────────────────────────────────────────

interface MatchupAdjustment {
  label: string
  favoringTeam: 'team1' | 'team2'
  magnitude: number  // 0-5, advantage points
}

function computeMatchupAdjustments(team1: MockTeam, team2: MockTeam): MatchupAdjustment[] {
  const adjustments: MatchupAdjustment[] = []
  const s1 = team1.stats
  const s2 = team2.stats

  // 3-point rate vs 3-point defense interaction
  // High 3pt offense against good 3pt defense = risky matchup
  const threePtDiff1 = s1.threePointRate - (1 - s2.defReboundRate / 100)  // proxy for 3pt defense quality
  const threePtDiff2 = s2.threePointRate - (1 - s1.defReboundRate / 100)
  if (Math.abs(threePtDiff1 - threePtDiff2) > 0.05) {
    const favoring = threePtDiff1 > threePtDiff2 ? 'team1' : 'team2'
    adjustments.push({
      label: '3-point offense vs defense matchup',
      favoringTeam: favoring,
      magnitude: Math.min(3, Math.abs(threePtDiff1 - threePtDiff2) * 15),
    })
  }

  // Turnover creation vs susceptibility
  const toAdv1 = s1.turnoverForcedRate - s2.turnoverRate
  const toAdv2 = s2.turnoverForcedRate - s1.turnoverRate
  if (Math.abs(toAdv1 - toAdv2) > 2) {
    const favoring = toAdv1 > toAdv2 ? 'team1' : 'team2'
    adjustments.push({
      label: 'Turnover creation advantage',
      favoringTeam: favoring,
      magnitude: Math.min(3, Math.abs(toAdv1 - toAdv2) * 0.3),
    })
  }

  // Offensive rebounding vs defensive rebounding
  const rebAdv1 = s1.offReboundRate - (100 - s2.defReboundRate)
  const rebAdv2 = s2.offReboundRate - (100 - s1.defReboundRate)
  if (Math.abs(rebAdv1 - rebAdv2) > 4) {
    const favoring = rebAdv1 > rebAdv2 ? 'team1' : 'team2'
    adjustments.push({
      label: 'Rebounding battle edge',
      favoringTeam: favoring,
      magnitude: Math.min(2.5, Math.abs(rebAdv1 - rebAdv2) * 0.12),
    })
  }

  // Tempo interaction — fast team vs slow team creates variance
  const tempoDiff = Math.abs(s1.tempo - s2.tempo)
  if (tempoDiff > 5) {
    const fasterTeam = s1.tempo > s2.tempo ? 'team1' : 'team2'
    // Faster team can impose pace if they have tempo advantage
    adjustments.push({
      label: 'Pace control edge',
      favoringTeam: fasterTeam,
      magnitude: Math.min(1.5, tempoDiff * 0.08),
    })
  }

  // Defense quality matchup (adjDE advantage)
  const defAdv1 = s2.adjDE - s1.adjDE  // Lower adjDE = better defense. More negative s2.adjDE = s2 better D
  // Actually: lower adjDE is better defense. team1 has better D if s1.adjDE < s2.adjDE
  // So s2.adjDE - s1.adjDE > 0 means team1 has better D
  if (Math.abs(s1.adjDE - s2.adjDE) > 4) {
    const betterDefense = s1.adjDE < s2.adjDE ? 'team1' : 'team2'
    adjustments.push({
      label: 'Defensive efficiency edge',
      favoringTeam: betterDefense,
      magnitude: Math.min(4, Math.abs(s1.adjDE - s2.adjDE) * 0.18),
    })
  }

  return adjustments
}

// ─── Layer 3: Tournament Priors ────────────────────────────────────────────────

function computeTournamentPrior(team1: MockTeam, team2: MockTeam): number {
  // Returns win probability for team1 based on seed matchup history
  const seed1 = team1.seed
  const seed2 = team2.seed
  const upsetRate = getUpsetRateForMatchup(seed1, seed2)

  // Which team is the "higher seed" (lower number = favorite)
  if (seed1 <= seed2) {
    // team1 is the favorite: prior = 1 - upsetRate
    return 1 - upsetRate
  } else {
    // team1 is the underdog: prior = upsetRate
    return upsetRate
  }
}

// ─── Layer 4: Variance / Chaos Model ──────────────────────────────────────────

function computeVolatilityScore(team1: MockTeam, team2: MockTeam): number {
  let volatility = 0

  // 3-point dependence: high 3pt rate = high variance
  const avg3ptRate = (team1.stats.threePointRate + team2.stats.threePointRate) / 2
  if (avg3ptRate > 0.42) volatility += 20
  else if (avg3ptRate > 0.38) volatility += 12
  else if (avg3ptRate > 0.35) volatility += 6

  // Turnover variance: both teams high TO = chaos
  const avgToRate = (team1.stats.turnoverRate + team2.stats.turnoverRate) / 2
  if (avgToRate > 17) volatility += 18
  else if (avgToRate > 15.5) volatility += 10
  else if (avgToRate > 14) volatility += 5

  // Tempo extremes
  const tempoDiff = Math.abs(team1.stats.tempo - team2.stats.tempo)
  if (tempoDiff > 8) volatility += 15
  else if (tempoDiff > 5) volatility += 8
  else if (tempoDiff > 3) volatility += 3

  // Foul risk proxy: high FT rate = more foul variance
  const avgFtRate = (team1.stats.ftRate + team2.stats.ftRate) / 2
  if (avgFtRate > 0.40) volatility += 10
  else if (avgFtRate > 0.35) volatility += 5

  // Close quality gap: similar adjEM = more volatile
  const emGap = Math.abs(team1.stats.adjEM - team2.stats.adjEM)
  if (emGap < 5) volatility += 18
  else if (emGap < 10) volatility += 10
  else if (emGap < 15) volatility += 5

  // Seed-based: upset-prone matchups are inherently volatile
  const seedGap = Math.abs(team1.seed - team2.seed)
  if (seedGap === 4) volatility += 12  // 5v12, 6v11, 7v10 matchups
  else if (seedGap <= 2) volatility += 8
  else if (seedGap >= 13) volatility -= 10  // Large mismatches are less volatile

  return Math.min(100, Math.max(0, volatility))
}

// ─── Main Prediction Function ──────────────────────────────────────────────────

export function predictMatchup(team1: MockTeam, team2: MockTeam): MatchupPrediction {
  // Layer 1: Base strength
  const base1 = computeBaseStrength(team1)
  const base2 = computeBaseStrength(team2)

  // Layer 2: Matchup adjustments
  const adjustments = computeMatchupAdjustments(team1, team2)
  let adj1 = 0
  let adj2 = 0
  for (const adj of adjustments) {
    if (adj.favoringTeam === 'team1') adj1 += adj.magnitude
    else adj2 += adj.magnitude
  }

  // Layer 3: Tournament seed prior
  const seedPrior1 = computeTournamentPrior(team1, team2)

  // Layer 4: Volatility
  const volatility = computeVolatilityScore(team1, team2)
  // Max 12% pull toward 50/50 — preserves favorites without killing upsets
  const v = (volatility / 100) * 0.12

  // Combine layers
  const totalStrength1 = base1 + adj1
  const totalStrength2 = base2 + adj2

  // Logistic win probability — divisor of 22 keeps large adjEM gaps realistic
  // (1 adjEM pt ≈ 0.45 expected pt margin; divisor=22 matches KenPom calibration)
  const strengthDiff = totalStrength1 - totalStrength2
  const logisticProb = 1 / (1 + Math.pow(10, -strengthDiff / 22))

  // Blend with seed prior (40% weight — historical seed outcomes are strong signals)
  const blendedProb = logisticProb * 0.60 + seedPrior1 * 0.40

  // Apply chaos: pull blended probability toward 50/50 by v (max 12%)
  // Correct formula: finalProb = blendedProb*(1-v) + 0.5*v
  const finalProb1 = blendedProb * (1 - v) + 0.5 * v
  const clampedProb1 = Math.min(0.97, Math.max(0.03, finalProb1))
  const finalProb2 = 1 - clampedProb1

  // Determine confidence tier
  const diff = Math.abs(clampedProb1 - 0.5)
  let confidenceTier: ConfidenceTier
  if (diff < 0.05) confidenceTier = 'coin_flip'
  else if (diff < 0.12) confidenceTier = 'slight_edge'
  else if (diff < 0.22) confidenceTier = 'favored'
  else confidenceTier = 'clear_favorite'

  // Favorite / underdog
  const favoriteId = clampedProb1 >= 0.5 ? team1.id : team2.id
  const underdogId = clampedProb1 >= 0.5 ? team2.id : team1.id
  const underdogProb = clampedProb1 >= 0.5 ? finalProb2 : clampedProb1

  // Upset alert
  const upsetAlertScore = computeUpsetAlertScore(team1, team2, underdogProb, volatility)
  const upsetAlertTier = getUpsetAlertTier(upsetAlertScore)
  const upsetAlertReasons = getUpsetAlertReasons(team1, team2, volatility)

  // Deciding factors (top 3)
  const decidingFactors = getDecidingFactors(team1, team2, adjustments, clampedProb1)

  return {
    team1Id: team1.id,
    team2Id: team2.id,
    team1WinProb: clampedProb1,
    team2WinProb: finalProb2,
    favoriteId,
    underdogId,
    confidenceTier,
    volatilityScore: volatility,
    upsetAlertTier,
    upsetAlertScore,
    upsetAlertReasons,
    decidingFactors,
    layer1Score: { team1: base1, team2: base2 },
    layer2Adjustments: adjustments,
    layer3Prior: seedPrior1,
    layer4Volatility: 1 + v,
  }
}

// ─── Upset Alert Scoring ───────────────────────────────────────────────────────

function computeUpsetAlertScore(
  team1: MockTeam,
  team2: MockTeam,
  underdogWinProb: number,
  volatility: number
): number {
  let score = 0

  // Underdog win probability contributes most
  if (underdogWinProb >= 0.40) score += 40
  else if (underdogWinProb >= 0.33) score += 30
  else if (underdogWinProb >= 0.25) score += 20
  else if (underdogWinProb >= 0.18) score += 12
  else score += 5

  // Volatility contributes
  score += volatility * 0.35

  // Seed mismatch being small = more upset-prone
  const seedGap = Math.abs(team1.seed - team2.seed)
  if (seedGap <= 3) score += 15
  else if (seedGap <= 5) score += 10
  else if (seedGap >= 12) score -= 20

  return Math.min(100, Math.max(0, score))
}

function getUpsetAlertTier(score: number): UpsetAlertTier {
  if (score >= 65) return 'high'
  if (score >= 40) return 'medium'
  if (score >= 20) return 'low'
  return 'none'
}

function getUpsetAlertReasons(team1: MockTeam, team2: MockTeam, volatility: number): string[] {
  const reasons: string[] = []
  const favorite = team1.seed <= team2.seed ? team1 : team2
  const underdog = team1.seed <= team2.seed ? team2 : team1
  const s_fav = favorite.stats
  const s_und = underdog.stats

  // 3-point variance risk
  if (s_und.threePointRate > 0.42) {
    reasons.push(`${underdog.name} is 3-point dependent (${Math.round(s_und.threePointRate * 100)}% of shots) — hot shooting can erase any gap`)
  }

  // Favorite luck regression
  if (s_fav.luckFactor > 0.04) {
    reasons.push(`${favorite.name} has a positive luck factor (+${s_fav.luckFactor.toFixed(3)}) — may have overperformed record`)
  }

  // Schedule strength gap
  if (s_und.sosRank < s_fav.sosRank - 30) {
    reasons.push(`${underdog.name} played a tougher schedule (SOS rank #${s_und.sosRank} vs #${s_fav.sosRank}) — record undervalues them`)
  }

  // Underdog defensive elite
  if (s_und.adjDE < 94) {
    reasons.push(`${underdog.name}'s defense (adjDE: ${s_und.adjDE.toFixed(1)}) is elite — can grind favorites into bad offense`)
  }

  // Fast tempo vs slow favorite
  if (s_und.tempo > 73 && s_fav.tempo < 68) {
    reasons.push(`${underdog.name} plays fast (${s_und.tempo.toFixed(0)} tempo) vs. a slower ${favorite.name} — pace mismatch creates chaos`)
  }

  // KenPom rank vs seed divergence
  if (s_und.kenpomRank < s_fav.kenpomRank + (underdog.seed - favorite.seed) * 3) {
    reasons.push(`${underdog.name}'s KenPom rank (#${s_und.kenpomRank}) is better than their seed suggests`)
  }

  // High volatility
  if (volatility >= 60) {
    reasons.push('Highly volatile matchup — both style and quality gap create chaos conditions')
  }

  return reasons.slice(0, 4)  // Top 4 reasons
}

function getDecidingFactors(
  team1: MockTeam,
  team2: MockTeam,
  adjustments: MatchupAdjustment[],
  team1Prob: number
): string[] {
  const factors: string[] = []
  const s1 = team1.stats
  const s2 = team2.stats
  const favorite = team1Prob >= 0.5 ? team1 : team2
  const underdog = team1Prob >= 0.5 ? team2 : team1

  // Primary: efficiency margin advantage
  const emGap = Math.abs(s1.adjEM - s2.adjEM)
  if (emGap > 15) {
    factors.push(`${favorite.name} has a significant efficiency advantage (${s1.adjEM.toFixed(1)} vs ${s2.adjEM.toFixed(1)} adjEM)`)
  } else if (emGap > 8) {
    factors.push(`Moderate efficiency edge for ${favorite.name} (adjEM gap: ${emGap.toFixed(1)})`)
  } else {
    factors.push(`Razor-thin efficiency margin — this is essentially a coin flip on paper`)
  }

  // Secondary: best matchup adjustment
  if (adjustments.length > 0) {
    const topAdj = adjustments.sort((a, b) => b.magnitude - a.magnitude)[0]
    const favTeam = topAdj.favoringTeam === 'team1' ? team1 : team2
    factors.push(`${topAdj.label} favors ${favTeam.name}`)
  }

  // Defense
  const betterDefense = s1.adjDE < s2.adjDE ? team1 : team2
  const defGap = Math.abs(s1.adjDE - s2.adjDE)
  if (defGap > 5) {
    factors.push(`${betterDefense.name}'s defense (adjDE: ${Math.min(s1.adjDE, s2.adjDE).toFixed(1)}) is a key differentiator`)
  }

  // 3-point dependence risk
  const high3ptTeam = s1.threePointRate > s2.threePointRate ? team1 : team2
  if (Math.max(s1.threePointRate, s2.threePointRate) > 0.42) {
    factors.push(`${high3ptTeam.name}'s 3-point reliance (${Math.round(Math.max(s1.threePointRate, s2.threePointRate) * 100)}%) introduces high-variance outcomes`)
  }

  return factors.slice(0, 4)
}

// ─── Batch prediction helper ───────────────────────────────────────────────────

export function predictAllMatchups(matchups: Array<{ team1: MockTeam; team2: MockTeam }>): MatchupPrediction[] {
  return matchups.map(({ team1, team2 }) => predictMatchup(team1, team2))
}
