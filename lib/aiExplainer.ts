/**
 * MadnessLab AI Explainer Layer
 *
 * The AI layer is strictly for explanation and storytelling.
 * It NEVER invents stats, injuries, or records.
 * All structured data is passed in explicitly.
 *
 * If no AI_API_KEY is configured, falls back to deterministic
 * plain-English explanations built from the same structured data.
 */

import type { MockTeam } from './mockData'
import type { MatchupPrediction } from './predictionEngine'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExplainMatchupInput {
  team1: MockTeam
  team2: MockTeam
  prediction: MatchupPrediction
  seedMatchupUpsetRate: number
  historicalContext?: string
}

export interface ExplainMatchupOutput {
  explanation: string
  source: 'ai' | 'fallback'
  model?: string
}

// ─── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are MadnessLab's matchup analyst. Your job is to explain NCAA tournament matchup predictions in plain, sharp English.

CRITICAL RULES:
1. ONLY use the statistics provided to you. Never invent stats, injuries, player names, or records not given.
2. Never fabricate KenPom rankings, win-loss records, or player information.
3. If the edge is small, say so — do not manufacture false certainty.
4. Keep tone sharp, readable, and slightly fun — like a smart sports analytics writer. Not corny.
5. Explain WHY the favorite is favored using only the provided metrics.
6. Describe a credible path for the underdog.
7. Mention upset risk when it's real.
8. Length: 3-4 short paragraphs. No headers. No bullet points in the output.

You are grounded in data. The stats tell the story. Your job is to narrate it clearly.`

// ─── Prompt Builder ────────────────────────────────────────────────────────────

export function buildMatchupPrompt(input: ExplainMatchupInput): string {
  const { team1, team2, prediction, seedMatchupUpsetRate } = input
  const { favoriteId, team1WinProb, team2WinProb, confidenceTier, volatilityScore, decidingFactors, upsetAlertTier, upsetAlertReasons } = prediction

  const favorite = favoriteId === team1.id ? team1 : team2
  const underdog = favoriteId === team1.id ? team2 : team1
  const favProb = favoriteId === team1.id ? team1WinProb : team2WinProb
  const undProb = 1 - favProb

  const favStat = favorite.stats
  const undStat = underdog.stats

  return `Explain this NCAA tournament matchup:

FAVORITE: ${favorite.name} (#${favorite.seed} seed, ${favorite.conference})
- Win probability: ${Math.round(favProb * 100)}%
- Adjusted Efficiency Margin: ${favStat.adjEM.toFixed(1)} (adjOE: ${favStat.adjOE.toFixed(1)}, adjDE: ${favStat.adjDE.toFixed(1)})
- Tempo: ${favStat.tempo.toFixed(0)} possessions/40 min
- 3-point rate: ${Math.round(favStat.threePointRate * 100)}% of shots
- Turnover rate: ${favStat.turnoverRate.toFixed(1)}%
- Recent form: ${favorite.recentForm.last5wins}/5 wins, current ${favorite.recentForm.streakType}-${favorite.recentForm.streakLength} streak
- KenPom rank: #${favStat.kenpomRank}
- Program tier: ${favorite.programTier}

UNDERDOG: ${underdog.name} (#${underdog.seed} seed, ${underdog.conference})
- Win probability: ${Math.round(undProb * 100)}%
- Adjusted Efficiency Margin: ${undStat.adjEM.toFixed(1)} (adjOE: ${undStat.adjOE.toFixed(1)}, adjDE: ${undStat.adjDE.toFixed(1)})
- Tempo: ${undStat.tempo.toFixed(0)} possessions/40 min
- 3-point rate: ${Math.round(undStat.threePointRate * 100)}% of shots
- Turnover rate: ${undStat.turnoverRate.toFixed(1)}%
- Recent form: ${underdog.recentForm.last5wins}/5 wins, current ${underdog.recentForm.streakType}-${underdog.recentForm.streakLength} streak
- KenPom rank: #${undStat.kenpomRank}
- Program tier: ${underdog.programTier}

MATCHUP CONTEXT:
- Historical upset rate for ${favorite.seed}-vs-${underdog.seed} matchups: ${Math.round(seedMatchupUpsetRate * 100)}%
- Confidence tier: ${confidenceTier}
- Volatility score: ${volatilityScore}/100
- Upset alert tier: ${upsetAlertTier}
- Key deciding factors: ${decidingFactors.join('; ')}
${upsetAlertReasons.length > 0 ? `- Upset reasons: ${upsetAlertReasons.join('; ')}` : ''}

Write 3-4 paragraphs explaining this matchup. Use only the data above.`
}

// ─── Deterministic Fallback Explainer ─────────────────────────────────────────

export function generateFallbackExplanation(input: ExplainMatchupInput): string {
  const { team1, team2, prediction, seedMatchupUpsetRate } = input
  const { favoriteId, team1WinProb, confidenceTier, volatilityScore, upsetAlertTier, upsetAlertReasons, decidingFactors } = prediction

  const favorite = favoriteId === team1.id ? team1 : team2
  const underdog = favoriteId === team1.id ? team2 : team1
  const favProb = favoriteId === team1.id ? team1WinProb : 1 - team1WinProb
  const undProb = 1 - favProb
  const fS = favorite.stats
  const uS = underdog.stats

  const edgeDescription = {
    clear_favorite: 'a clear edge',
    favored: 'a meaningful edge',
    slight_edge: 'a slight edge',
    coin_flip: 'nearly identical odds — this is a coin flip',
  }[confidenceTier]

  // Paragraph 1: The setup
  const seedGap = underdog.seed - favorite.seed
  let p1 = `${favorite.name} (${favorite.seed}-seed) enters as ${Math.round(favProb * 100)}% favorites over ${underdog.name} (${underdog.seed}-seed), a matchup history shows produces upsets ${Math.round(seedMatchupUpsetRate * 100)}% of the time. The analytics give ${favorite.name} ${edgeDescription} — their adjusted efficiency margin of ${fS.adjEM.toFixed(1)} outpaces ${underdog.name}'s ${uS.adjEM.toFixed(1)}.`

  // Paragraph 2: Favorite's strengths
  const defEdge = fS.adjDE < uS.adjDE
  const offEdge = fS.adjOE > uS.adjOE
  let p2 = `On paper, ${favorite.name}'s case starts ${defEdge ? `with their defense (adjDE: ${fS.adjDE.toFixed(1)})` : `with their offense (adjOE: ${fS.adjOE.toFixed(1)})`}. ${offEdge ? `They score efficiently at ${fS.adjOE.toFixed(1)} offensive efficiency, putting constant pressure on a ${underdog.name} defense rated ${uS.adjDE.toFixed(1)}.` : `They've held opponents to ${fS.adjDE.toFixed(1)} defensive efficiency — elite by tournament standards.`} ${decidingFactors[0] ? decidingFactors[0] + '.' : ''}`

  // Paragraph 3: Underdog path
  let p3 = `${underdog.name} isn't without a path. `
  if (uS.adjDE < 95) {
    p3 += `Their defense (adjDE: ${uS.adjDE.toFixed(1)}) can disrupt any offense, and a slow game will suit them.`
  } else if (uS.threePointRate > 0.40) {
    p3 += `They launch ${Math.round(uS.threePointRate * 100)}% of their attempts from three — a hot night would rewrite this bracket line.`
  } else if (underdog.recentForm.streakType === 'W' && underdog.recentForm.streakLength >= 3) {
    p3 += `They've won ${underdog.recentForm.streakLength} straight entering the tournament and are playing their best basketball of the year.`
  } else {
    p3 += `If they force turnovers (${uS.turnoverForcedRate.toFixed(1)} forced TO rate) and control the rebounding battle, this becomes a different game.`
  }

  // Paragraph 4: Volatility & verdict
  let p4 = ''
  if (upsetAlertTier === 'high') {
    p4 = `⚠️ High upset alert. ${upsetAlertReasons[0] ?? 'Multiple volatility factors'} make this one of the most dangerous favorites in the bracket. Volatility score: ${volatilityScore}/100. Don't sleep on ${underdog.name}.`
  } else if (upsetAlertTier === 'medium') {
    p4 = `Worth watching: volatility score of ${volatilityScore}/100 suggests this isn't a lock. ${upsetAlertReasons[0] ?? 'Style factors'} create real upset risk. ${favorite.name} is favored, but chalk isn't always right in March.`
  } else {
    p4 = `${favorite.name} is the pick — ${Math.round(favProb * 100)}% win probability, lower volatility (${volatilityScore}/100), and a statistical profile that matches tournament winners. ${underdog.name} is a respectable program but faces a tough draw.`
  }

  return [p1, p2, p3, p4].filter(Boolean).join('\n\n')
}

// ─── AI Client ────────────────────────────────────────────────────────────────

async function callAIProvider(prompt: string): Promise<string | null> {
  const provider = process.env.AI_PROVIDER
  const apiKey = process.env.AI_API_KEY
  const model = process.env.AI_MODEL

  if (!apiKey || provider === 'none') return null

  try {
    if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model ?? 'claude-haiku-4-5',
          max_tokens: 512,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) return null
      const data = await response.json() as { content: Array<{ text: string }> }
      return data.content?.[0]?.text ?? null
    }

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model ?? 'gpt-4o-mini',
          max_tokens: 512,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
        }),
      })

      if (!response.ok) return null
      const data = await response.json() as { choices: Array<{ message: { content: string } }> }
      return data.choices?.[0]?.message?.content ?? null
    }
  } catch (err) {
    console.error('[aiExplainer] Provider call failed:', err)
  }

  return null
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function explainMatchup(input: ExplainMatchupInput): Promise<ExplainMatchupOutput> {
  // Always generate fallback first (instant)
  const fallback = generateFallbackExplanation(input)

  // Try AI if configured
  const useMockData = process.env.USE_MOCK_DATA === 'true'
  if (!useMockData && process.env.AI_PROVIDER && process.env.AI_PROVIDER !== 'none' && process.env.AI_API_KEY) {
    const prompt = buildMatchupPrompt(input)
    const aiText = await callAIProvider(prompt)

    if (aiText) {
      return {
        explanation: aiText,
        source: 'ai',
        model: process.env.AI_MODEL ?? 'unknown',
      }
    }
  }

  return {
    explanation: fallback,
    source: 'fallback',
  }
}
