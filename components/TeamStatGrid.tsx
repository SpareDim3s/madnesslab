import { cn } from '@/lib/utils'
import type { MockTeam } from '@/lib/mockData'

interface StatItem {
  label: string
  value: string | number
  subLabel?: string
  color?: string
}

interface TeamStatGridProps {
  team: MockTeam
  className?: string
}

export function TeamStatGrid({ team, className }: TeamStatGridProps) {
  const s = team.stats

  const stats: StatItem[] = [
    { label: 'Adj. EM', value: s.adjEM.toFixed(1), subLabel: 'Efficiency Margin',
      color: s.adjEM > 25 ? '#16a34a' : s.adjEM > 15 ? '#15803d' : s.adjEM > 5 ? '#a0832a' : '#dc2626' },
    { label: 'Adj. OE', value: s.adjOE.toFixed(1), subLabel: 'Offensive Efficiency',
      color: s.adjOE > 118 ? '#16a34a' : s.adjOE > 113 ? '#15803d' : '#1a1625' },
    { label: 'Adj. DE', value: s.adjDE.toFixed(1), subLabel: 'Defensive Efficiency',
      color: s.adjDE < 90 ? '#16a34a' : s.adjDE < 95 ? '#15803d' : s.adjDE < 100 ? '#a0832a' : '#dc2626' },
    { label: 'Tempo', value: s.tempo.toFixed(0), subLabel: 'Pace (pos/40m)', color: '#2563eb' },
    { label: '3P Rate', value: `${Math.round(s.threePointRate * 100)}%`, subLabel: 'Of FGA from 3',
      color: s.threePointRate > 0.42 ? '#b45309' : '#1a1625' },
    { label: '3P%', value: `${Math.round(s.threePointPct * 100)}%`, subLabel: '3-point shooting',
      color: s.threePointPct > 0.37 ? '#16a34a' : '#1a1625' },
    { label: 'TO Rate', value: `${s.turnoverRate.toFixed(1)}%`, subLabel: 'Turnovers per 100',
      color: s.turnoverRate < 14 ? '#16a34a' : s.turnoverRate < 16 ? '#a0832a' : '#dc2626' },
    { label: 'TO Force', value: `${s.turnoverForcedRate.toFixed(1)}%`, subLabel: 'Forced per 100',
      color: s.turnoverForcedRate > 20 ? '#16a34a' : '#1a1625' },
    { label: 'OReb%', value: `${s.offReboundRate.toFixed(1)}%`, subLabel: 'Offensive boards',
      color: s.offReboundRate > 32 ? '#16a34a' : '#1a1625' },
    { label: 'DReb%', value: `${s.defReboundRate.toFixed(1)}%`, subLabel: 'Defensive boards',
      color: s.defReboundRate > 75 ? '#16a34a' : '#1a1625' },
    { label: 'FT Rate', value: `${Math.round(s.ftRate * 100)}%`, subLabel: 'FTA/FGA', color: '#1a1625' },
    { label: 'SOS Rank', value: `#${s.sosRank}`, subLabel: 'Strength of schedule',
      color: s.sosRank < 30 ? '#16a34a' : s.sosRank < 80 ? '#a0832a' : '#dc2626' },
    { label: 'eFG%', value: `${(s.efgPct * 100).toFixed(1)}%`, subLabel: 'Effective FG%',
      color: s.efgPct > 0.54 ? '#16a34a' : s.efgPct > 0.50 ? '#a0832a' : '#1a1625' },
    { label: 'Luck', value: s.luckFactor > 0 ? `+${s.luckFactor.toFixed(3)}` : s.luckFactor.toFixed(3),
      subLabel: 'Luck factor',
      color: s.luckFactor > 0.04 ? '#b45309' : s.luckFactor < -0.02 ? '#16a34a' : '#a0832a' },
  ]

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3', className)}>
      {stats.map((stat) => (
        <div key={stat.label} style={{
          borderRadius: 8,
          border: '1px solid #e8e0d0',
          background: '#ffffff',
          padding: 12,
          transition: 'border-color 0.15s',
        }}>
          <p style={{ fontSize: 10, color: '#8b7d6b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            {stat.label}
          </p>
          <p style={{ fontSize: 18, fontWeight: 700, color: stat.color ?? '#1a1625', fontFamily: '"Playfair Display", Georgia, serif' }}>
            {stat.value}
          </p>
          {stat.subLabel && (
            <p style={{ fontSize: 10, color: '#8b7d6b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {stat.subLabel}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
