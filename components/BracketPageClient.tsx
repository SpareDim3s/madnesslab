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
      <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('simulate')}
          className={[
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
            activeTab === 'simulate'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
          ].join(' ')}
        >
          <Zap className="h-4 w-4" />
          Simulate Tournament
        </button>
        <button
          onClick={() => setActiveTab('pick')}
          className={[
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
            activeTab === 'pick'
              ? 'bg-gray-800 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
          ].join(' ')}
        >
          <Edit3 className="h-4 w-4" />
          Pick Your Bracket
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'simulate' ? (
        <SimulateBracket />
      ) : (
        <InteractiveBracket teams={teams} />
      )}
    </div>
  )
}
