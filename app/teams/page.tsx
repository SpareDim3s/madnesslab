export const dynamic = 'force-dynamic'

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
          <div style={{
            display: 'flex', width: 36, height: 36, alignItems: 'center',
            justifyContent: 'center', borderRadius: 8, background: '#f0e8d0', border: '1px solid #e8e0d0',
          }}>
            <Users style={{ width: 18, height: 18, color: '#a0832a' }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif' }}>
            All Teams
          </h1>
        </div>
        <p style={{ fontSize: 14, color: '#8b7d6b' }}>
          2026 NCAA Tournament — {ALL_TEAMS.length} teams across 4 regions, including First Four.
          Click any team for deep analytics.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6" style={{ fontSize: 12, color: '#8b7d6b' }}>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#a0832a', display: 'inline-block' }} />
          Title profile score
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
          Upset vulnerability
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
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
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif' }}>
                {region} Region
              </h2>
              <span style={{ fontSize: 12, color: '#8b7d6b' }}>{teams.length} teams</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {teams.map(team => (
                <TeamProfileCard key={team.id} team={team} />
              ))}
            </div>

            {firstFour.length > 0 && (
              <div className="mt-4">
                <p style={{ fontSize: 11, color: '#8b7d6b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  First Four
                </p>
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
