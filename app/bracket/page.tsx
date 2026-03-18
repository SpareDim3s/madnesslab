import BracketPageClient from '@/components/BracketPageClient'
import { ALL_TEAMS } from '@/lib/realData'
import type { BracketTeam } from '@/components/InteractiveBracket'

export const metadata = {
  title: 'Bracket — MadnessLab',
  description: 'Simulate the 2026 NCAA Tournament with real T-Rank stats, or fill your own bracket pick by pick.',
}

export default function BracketPage() {
  return (
    <main className="min-h-screen px-3 py-6 sm:px-6" style={{ backgroundColor: '#f5f0e6' }}>
      <div className="mx-auto max-w-[1400px]">
        {/* Page header */}
        <div className="mb-6">
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: '"Playfair Display", serif', color: '#1a1625' }}
          >
            Tournament Bracket
          </h1>
          <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
            Simulate with AI · or fill your own picks
          </p>
        </div>
        <BracketPageClient teams={ALL_TEAMS as BracketTeam[]} />
      </div>
    </main>
  )
}
