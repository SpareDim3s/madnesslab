import InteractiveBracket from '@/components/InteractiveBracket'
import { ALL_TEAMS } from '@/lib/realData'
import type { BracketTeam } from '@/components/InteractiveBracket'

export const metadata = {
  title: 'Fill Your Bracket — MadnessLab',
  description: 'Pick winners round by round in the 2026 NCAA Tournament. Win probabilities powered by real T-Rank stats.',
}

export default function BracketPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-3 py-6 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <InteractiveBracket teams={ALL_TEAMS as BracketTeam[]} />
      </div>
    </main>
  )
}
