import BracketPageClient from '@/components/BracketPageClient'
import { ALL_TEAMS } from '@/lib/realData'
import type { BracketTeam } from '@/components/InteractiveBracket'

export const metadata = {
  title: 'Bracket — MadnessLab',
  description: 'Simulate the 2026 NCAA Tournament with real T-Rank stats, or fill your own bracket pick by pick.',
}

export default function BracketPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-3 py-6 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <BracketPageClient teams={ALL_TEAMS as BracketTeam[]} />
      </div>
    </main>
  )
}
