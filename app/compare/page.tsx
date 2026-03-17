export const dynamic = 'force-dynamic'

import ComparePage from '@/components/ComparePage'
import { ALL_TEAMS } from '@/lib/realData'

export const metadata = {
  title: 'Compare Teams — MadnessLab',
  description: 'Head-to-head comparison of any two 2026 NCAA Tournament teams. Win probability, stats breakdown, and matchup analysis.',
}

export default function Compare() {
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <ComparePage teams={ALL_TEAMS} />
      </div>
    </main>
  )
}
