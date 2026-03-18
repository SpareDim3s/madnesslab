'use client'

import { useState } from 'react'
import { Zap, Edit3 } from 'lucide-react'
import InteractiveBracket, { type BracketTeam } from '@/components/InteractiveBracket'
import SimulateBracket from '@/components/SimulateBracket'

type Tab = 'simulate' | 'pick'

export default function BracketPageClient({ teams }: { teams: BracketTeam[] }) {
  const [activeTab, setActiveTab] = useState<Tab>('simulate')

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div
        className="flex items-center gap-1 rounded-xl p-1 w-fit"
        style={{ background: 'white', border: '1px solid #e8e0d0', boxShadow: '0 1px 6px rgba(160,131,42,0.08)' }}
      >
        <button
          onClick={() => setActiveTab('simulate')}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
          style={{
            background: activeTab === 'simulate' ? '#2563eb' : 'transparent',
            color: activeTab === 'simulate' ? 'white' : '#6b7280',
          }}
        >
          <Zap className="h-4 w-4" />
          Simulate Tournament
        </button>
        <button
          onClick={() => setActiveTab('pick')}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
          style={{
            background: activeTab === 'pick' ? '#1a1625' : 'transparent',
            color: activeTab === 'pick' ? 'white' : '#6b7280',
          }}
        >
          <Edit3 className="h-4 w-4" />
          Pick Your Bracket
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'simulate' ? (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <SimulateBracket allTeams={teams as any[]} />
      ) : (
        <InteractiveBracket teams={teams} />
      )}
    </div>
  )
}
