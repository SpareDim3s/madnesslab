export const dynamic = 'force-dynamic'

import { FlaskConical, Layers, Zap, GitMerge, Sparkles, Database, Code2 } from 'lucide-react'

export const metadata = {
  title: 'About — MadnessLab',
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20">
          <FlaskConical className="h-6 w-6 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">About MadnessLab</h1>
          <p className="text-gray-400 text-sm">Smarter than a bracket picker.</p>
        </div>
      </div>

      <p className="text-gray-300 leading-relaxed mb-8">
        MadnessLab is a stats-first NCAA Tournament intelligence app. Unlike bracket pickers that let an AI guess game outcomes,
        MadnessLab uses a 4-layer statistical prediction engine grounded in adjusted efficiency metrics, matchup analysis,
        historical tournament patterns, and variance modeling. The AI layer is used only for natural-language explanations —
        it never drives predictions.
      </p>

      {/* How it works */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4">Prediction Engine</h2>
        <div className="space-y-4">
          {[
            {
              icon: <Layers className="h-5 w-5 text-blue-400" />,
              title: 'Layer 1 — Base Team Strength',
              desc: 'Adjusted efficiency margin (adjEM), tempo, strength of schedule, luck factor, and recent form. Weighted using a KenPom-style logistic model.',
            },
            {
              icon: <Zap className="h-5 w-5 text-orange-400" />,
              title: 'Layer 2 — Matchup Adjustments',
              desc: '3-point rate vs 3-point defense, turnover creation vs susceptibility, rebounding battles, pace interaction, and inside/outside scoring profiles.',
            },
            {
              icon: <Database className="h-5 w-5 text-purple-400" />,
              title: 'Layer 3 — Tournament Priors',
              desc: 'Historical seed matchup upset rates (1985–2025). 12-seeds win 36% of the time against 5-seeds. 8v9 is a near coin flip. These priors are blended in (20% weight).',
            },
            {
              icon: <FlaskConical className="h-5 w-5 text-red-400" />,
              title: 'Layer 4 — Variance & Chaos Model',
              desc: '3-point dependence, turnover variance, tempo extremes, foul risk, and quality gap all adjust the probability toward 50/50 when conditions are chaotic.',
            },
          ].map(layer => (
            <div key={layer.title} className="flex gap-4 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
              <div className="shrink-0 mt-0.5">{layer.icon}</div>
              <div>
                <p className="font-semibold text-white text-sm">{layer.title}</p>
                <p className="text-sm text-gray-400 mt-1">{layer.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Simulation */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4">Monte Carlo Simulation</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-3">
          The bracket simulator runs N complete tournament simulations. Each game uses the prediction engine's win probability
          as the basis for a random draw. Running more simulations (100+) gives stable championship odds; 1× gives a single bracket result.
        </p>
        <p className="text-gray-300 text-sm leading-relaxed">
          Aggregate results show title odds, Final Four odds, Elite Eight odds, and Sweet 16 odds for every team —
          a much richer output than a single bracket pick.
        </p>
      </section>

      {/* AI layer */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-orange-400" />
          <h2 className="text-lg font-bold text-white">AI Explanation Layer</h2>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5 mb-4">
          <p className="text-sm font-semibold text-orange-400 mb-2">Core Rule: AI explains. AI never predicts.</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            The LLM receives structured matchup data and is instructed to explain what the stats mean —
            not to invent facts. It cannot access the internet, cannot fabricate injuries, and cannot override
            the statistical output.
          </p>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          When no API key is configured (the default), a deterministic rule-based fallback generates explanations
          using the same structured data. The output quality is lower but grounded in the same facts.
          Set <code className="text-orange-400">AI_PROVIDER</code> and <code className="text-orange-400">AI_API_KEY</code> to enable LLM explanations.
        </p>
      </section>

      {/* Bracket Twins */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <GitMerge className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">Bracket Twins</h2>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          For each 2026 team, we compute a weighted Euclidean distance across normalized features against a
          curated library of past tournament teams (2012–2025): adjEM (35%), seed (25%), adjDE (18%), adjOE (12%),
          eFG% (6%), and 3-point rate (4%). The 3 most statistically similar <em>historical</em> teams are shown
          along with how far they went — Champion, Final Four, Elite Eight, etc. — giving you a data-grounded
          precedent for what a team like this tends to accomplish in March.
        </p>
      </section>

      {/* Tech stack */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Tech Stack</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Framework', value: 'Next.js 14 (App Router)' },
            { label: 'Language', value: 'TypeScript' },
            { label: 'Styling', value: 'Tailwind CSS + shadcn/ui' },
            { label: 'Charts', value: 'Recharts' },
            { label: 'Stats Data', value: 'Barttorvik / T-Rank' },
            { label: 'Database', value: 'PostgreSQL via Prisma' },
            { label: 'Validation', value: 'Zod' },
            { label: 'AI Providers', value: 'Anthropic Claude / OpenAI' },
          ].map(item => (
            <div key={item.label} className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-sm font-medium text-gray-200">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data disclaimer */}
      <section>
        <h2 className="text-lg font-bold text-white mb-3">Data & Disclaimer</h2>
        <div className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-5">
          <p className="text-sm text-gray-300 leading-relaxed">
            <strong className="text-white">Data sources:</strong> Adjusted efficiency metrics (adjOE, adjDE, adjEM),
            shooting stats (eFG%, 3P rate, FT rate), and tempo are sourced from{' '}
            <span className="text-orange-400">Barttorvik / T-Rank</span> for the 2025–26 season.
            Seed matchup upset rates are derived from historical NCAA Tournament results (1985–2025).
          </p>
          <p className="text-sm text-gray-400 mt-3 leading-relaxed">
            MadnessLab is for entertainment and analytical exploration only. Stats reflect regular-season performance
            and do not account for injuries, lineup changes, or other real-time factors. Not intended for wagering.
          </p>
        </div>
      </section>
    </div>
  )
}
