import { notFound } from 'next/navigation'
import { ALL_TEAMS } from '@/lib/mockData'
import { predictMatchup } from '@/lib/predictionEngine'
import { getUpsetRateForMatchup } from '@/lib/historicalData'
import { generateFallbackExplanation } from '@/lib/aiExplainer'
import { AIExplanationCard } from '@/components/AIExplanationCard'
import { UpsetAlertBadge } from '@/components/UpsetAlertBadge'
import { TeamStatGrid } from '@/components/TeamStatGrid'
import { cn, winProbColor, getVolatilityLabel, getVolatilityColor, getConfidenceTierLabel, formatOdds } from '@/lib/utils'
import { ArrowLeft, Zap, BarChart2, Clock, Shield } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: { gameId: string }
}

export default function MatchupPage({ params }: PageProps) {
  const { gameId } = params

  // Parse: r64_South_1v16
  const parts = gameId.split('_')
  if (parts.length < 3) notFound()

  const region = parts[1]
  const seedPart = parts[2]
  const seeds = seedPart?.split('v').map(Number)
  if (!seeds || seeds.length !== 2 || seeds.some(isNaN)) notFound()

  const [seed1, seed2] = seeds

  const regionTeams = ALL_TEAMS.filter(t => t.region === region && !t.isFirstFour)
  const team1 = regionTeams.find(t => t.seed === seed1)
  const team2 = regionTeams.find(t => t.seed === seed2)

  if (!team1 || !team2) notFound()

  const prediction = predictMatchup(team1, team2)
  const upsetRate = getUpsetRateForMatchup(seed1, seed2)

  const favorite = prediction.favoriteId === team1.id ? team1 : team2
  const underdog = prediction.favoriteId === team1.id ? team2 : team1
  const favProb = prediction.favoriteId === team1.id ? prediction.team1WinProb : prediction.team2WinProb
  const undProb = 1 - favProb

  const explanation = generateFallbackExplanation({
    team1,
    team2,
    prediction,
    seedMatchupUpsetRate: upsetRate,
  })

  const roundName = parts[0] === 'r64' ? 'Round of 64' : parts[0] === 'r32' ? 'Round of 32' : parts[0]

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      {/* Back */}
      <Link
        href="/bracket"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Bracket
      </Link>

      {/* Matchup header */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <span>{region} Region</span>
          <span>·</span>
          <span>{roundName}</span>
          {prediction.upsetAlertTier !== 'none' && (
            <>
              <span>·</span>
              <UpsetAlertBadge tier={prediction.upsetAlertTier} />
            </>
          )}
        </div>

        {/* Head-to-head probs */}
        <div className="flex items-center gap-4">
          {/* Team 1 */}
          <div className="flex-1 text-center">
            <Link href={`/teams/${team1.slug}`} className="hover:text-orange-400 transition-colors">
              <p className="text-xs text-gray-500 mb-1">#{team1.seed} seed</p>
              <p className="text-xl font-bold text-white">{team1.name}</p>
              <p className="text-xs text-gray-500">{team1.conference}</p>
            </Link>
            <p className={cn('text-3xl font-extrabold mt-3', winProbColor(prediction.team1WinProb))}>
              {formatOdds(prediction.team1WinProb)}
            </p>
            <p className="text-xs text-gray-500">win probability</p>
          </div>

          {/* VS */}
          <div className="text-center shrink-0">
            <p className="text-2xl font-bold text-gray-600">vs</p>
            <p className={cn('text-xs font-semibold mt-1 px-2 py-1 rounded border',
              prediction.confidenceTier === 'coin_flip' ? 'text-orange-400 border-orange-400/30 bg-orange-400/10' :
              prediction.confidenceTier === 'slight_edge' ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' :
              'text-blue-400 border-blue-400/30 bg-blue-400/10'
            )}>
              {getConfidenceTierLabel(prediction.confidenceTier)}
            </p>
          </div>

          {/* Team 2 */}
          <div className="flex-1 text-center">
            <Link href={`/teams/${team2.slug}`} className="hover:text-orange-400 transition-colors">
              <p className="text-xs text-gray-500 mb-1">#{team2.seed} seed</p>
              <p className="text-xl font-bold text-white">{team2.name}</p>
              <p className="text-xs text-gray-500">{team2.conference}</p>
            </Link>
            <p className={cn('text-3xl font-extrabold mt-3', winProbColor(prediction.team2WinProb))}>
              {formatOdds(prediction.team2WinProb)}
            </p>
            <p className="text-xs text-gray-500">win probability</p>
          </div>
        </div>

        {/* Probability bar */}
        <div className="mt-5">
          <div className="flex h-3 rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all', winProbColor(prediction.team1WinProb).replace('text-', 'bg-'))}
              style={{ width: `${prediction.team1WinProb * 100}%`, background: prediction.team1WinProb >= 0.5 ? '#22c55e' : '#f97316' }}
            />
            <div className="flex-1 bg-gray-700" />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{team1.name}</span>
            <span>{team2.name}</span>
          </div>
        </div>
      </div>

      {/* Matchup analytics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="h-3.5 w-3.5 text-orange-400" />
            <p className="text-xs text-gray-500">Volatility</p>
          </div>
          <p className={cn('text-xl font-bold', getVolatilityColor(prediction.volatilityScore))}>
            {prediction.volatilityScore}
          </p>
          <p className={cn('text-xs', getVolatilityColor(prediction.volatilityScore))}>
            {getVolatilityLabel(prediction.volatilityScore)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            <p className="text-xs text-gray-500">Proj. Pace</p>
          </div>
          <p className="text-xl font-bold text-blue-400">
            {((team1.stats.tempo + team2.stats.tempo) / 2).toFixed(0)}
          </p>
          <p className="text-xs text-gray-500">poss/40m avg</p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <BarChart2 className="h-3.5 w-3.5 text-purple-400" />
            <p className="text-xs text-gray-500">Seed Upset Rate</p>
          </div>
          <p className={cn('text-xl font-bold', upsetRate > 0.3 ? 'text-orange-400' : 'text-gray-300')}>
            {Math.round(upsetRate * 100)}%
          </p>
          <p className="text-xs text-gray-500">historically</p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <p className="text-xs text-gray-500">Edge</p>
          </div>
          <p className="text-xl font-bold text-emerald-400">
            {Math.abs(team1.stats.adjEM - team2.stats.adjEM).toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">adjEM gap</p>
        </div>
      </div>

      {/* Deciding factors */}
      {prediction.decidingFactors.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-white mb-3">Deciding Factors</h2>
          <div className="space-y-2">
            {prediction.decidingFactors.map((factor, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3">
                <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-300">{factor}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upset alert reasons */}
      {prediction.upsetAlertTier !== 'none' && prediction.upsetAlertReasons.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <UpsetAlertBadge tier={prediction.upsetAlertTier} />
            <h2 className="text-lg font-bold text-white">Why {underdog.name} Could Win</h2>
          </div>
          <div className="space-y-2">
            {prediction.upsetAlertReasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3">
                <span className="text-orange-400 text-sm">⚠</span>
                <p className="text-sm text-gray-300">{reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Style matchup */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-white mb-3">Style Comparison</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
          <div className="grid grid-cols-3 text-sm">
            {/* Header */}
            <div className="py-2.5 px-4 text-gray-400 font-medium border-b border-gray-800">{team1.name}</div>
            <div className="py-2.5 px-2 text-center text-xs text-gray-600 border-b border-gray-800 font-medium">Metric</div>
            <div className="py-2.5 px-4 text-right text-gray-400 font-medium border-b border-gray-800">{team2.name}</div>

            {[
              { label: 'adjOE', v1: team1.stats.adjOE.toFixed(1), v2: team2.stats.adjOE.toFixed(1), higherIsBetter: true },
              { label: 'adjDE', v1: team1.stats.adjDE.toFixed(1), v2: team2.stats.adjDE.toFixed(1), higherIsBetter: false },
              { label: 'Tempo', v1: team1.stats.tempo.toFixed(0), v2: team2.stats.tempo.toFixed(0), higherIsBetter: null },
              { label: '3P Rate', v1: `${Math.round(team1.stats.threePointRate * 100)}%`, v2: `${Math.round(team2.stats.threePointRate * 100)}%`, higherIsBetter: null },
              { label: 'TO Rate', v1: `${team1.stats.turnoverRate.toFixed(1)}%`, v2: `${team2.stats.turnoverRate.toFixed(1)}%`, higherIsBetter: false },
              { label: 'Reb', v1: `${team1.stats.offReboundRate.toFixed(1)}%`, v2: `${team2.stats.offReboundRate.toFixed(1)}%`, higherIsBetter: true },
            ].map((row, i) => {
              const v1Num = parseFloat(row.v1)
              const v2Num = parseFloat(row.v2)
              const t1Better = row.higherIsBetter === null ? false : row.higherIsBetter ? v1Num > v2Num : v1Num < v2Num
              const t2Better = row.higherIsBetter === null ? false : row.higherIsBetter ? v2Num > v1Num : v2Num < v1Num
              return (
                <div key={i} className="contents">
                  <div className={cn('py-2.5 px-4 border-b border-gray-800/50', t1Better ? 'text-emerald-400 font-semibold' : 'text-gray-300')}>{row.v1}</div>
                  <div className="py-2.5 px-2 text-center text-xs text-gray-500 border-b border-gray-800/50">{row.label}</div>
                  <div className={cn('py-2.5 px-4 text-right border-b border-gray-800/50', t2Better ? 'text-emerald-400 font-semibold' : 'text-gray-300')}>{row.v2}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* AI / Deterministic explanation */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-white mb-3">Matchup Analysis</h2>
        <AIExplanationCard
          gameId={gameId}
          initialExplanation={explanation}
          source="fallback"
        />
      </section>

      {/* Team stat deep dives */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">{team1.name} Stats</h2>
        <TeamStatGrid team={team1} />
      </section>
      <section className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">{team2.name} Stats</h2>
        <TeamStatGrid team={team2} />
      </section>
    </div>
  )
}
