import Link from 'next/link'
import { FlaskConical, ChevronRight, TrendingUp, Users, BarChart2 } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 sm:px-6 pt-16 pb-12">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-5xl text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm text-orange-400 mb-6">
          <FlaskConical className="h-4 w-4" />
          <span>March Madness 2026 · Live T-Rank Data</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4 leading-tight">
          Every bracket is wrong.
          <br />
          <span className="text-orange-400">Ours tells you why.</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Stats-first NCAA tournament intelligence. Simulation, upset alerts, AI explanations, historical twins, and trend analysis — all in one place.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
          <Link
            href="/bracket"
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-8 py-4 text-base font-semibold text-white hover:bg-orange-400 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            Run Simulation
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/trends"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-700 px-8 py-4 text-base font-semibold text-gray-300 hover:text-white hover:border-gray-600 hover:bg-gray-800/50 transition-all"
          >
            <TrendingUp className="h-4 w-4" />
            Explore Trends
          </Link>
          <Link
            href="/teams"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-700 px-8 py-4 text-base font-semibold text-gray-300 hover:text-white hover:border-gray-600 hover:bg-gray-800/50 transition-all"
          >
            <Users className="h-4 w-4" />
            Browse Teams
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 text-xs">
          {[
            '4-Layer Prediction Model',
            'Monte Carlo Simulation',
            'Bracket Twins',
            'Upset Alerts',
            'AI Explanations',
            'Trend Explorer',
          ].map(feat => (
            <span
              key={feat}
              className="rounded-full border border-gray-700 bg-gray-800/50 px-3 py-1 text-gray-400"
            >
              {feat}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
