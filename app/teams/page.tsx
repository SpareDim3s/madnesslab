import { TeamProfileCard } from '@/components/TeamProfileCard'
import { ALL_TEAMS, getTeamsByRegion } from '@/lib/mockData'
import { Users } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Teams — MadnessLab',
  description: 'Browse all 68 teams in the 2026 NCAA Tournament with detailed analytics.',
}

const REGIONS = ['South', 'East', 'West', 'Midwest'] as const

export default function TeamsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/20">
            <Users className="h-5 w-5 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">All Teams</h1>
        </div>
        <p className="text-gray-400">
          2026 NCAA Tournament — {ALL_TEAMS.length} teams across 4 regions, including First Four.
          Click any team for deep analytics.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
          Title profile score
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
          Upset vulnerability
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
          Recent form
        </span>
      </div>

      {/* Regions */}
      {REGIONS.map(region => {
        const teams = getTeamsByRegion(region).filter(t => !t.isFirstFour)
        const firstFour = getTeamsByRegion(region).filter(t => t.isFirstFour)

        return (
          <section key={region} className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{region} Region</h2>
              <span className="text-xs text-gray-500">{teams.length} teams</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {teams.map(team => (
                <TeamProfileCard key={team.id} team={team} />
              ))}
            </div>

            {firstFour.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">First Four</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {firstFour.map(team => (
                    <TeamProfileCard key={team.id} team={team} compact />
                  ))}
                </div>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
