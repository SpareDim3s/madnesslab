import { cn } from '@/lib/utils'
import type { MockTeam } from '@/lib/mockData'

interface StatItem {
  label: string
  value: string | number
  subLabel?: string
  color?: string
  tooltip?: string
}

interface TeamStatGridProps {
  team: MockTeam
  className?: string
}

export function TeamStatGrid({ team, className }: TeamStatGridProps) {
  const s = team.stats

  const stats: StatItem[] = [
    { label: 'Adj. EM', value: s.adjEM.toFixed(1), subLabel: 'Efficiency Margin', color: s.adjEM > 25 ? 'text-emerald-400' : s.adjEM > 15 ? 'text-green-400' : s.adjEM > 5 ? 'text-yellow-400' : 'text-red-400' },
    { label: 'Adj. OE', value: s.adjOE.toFixed(1), subLabel: 'Offensive Efficiency', color: s.adjOE > 118 ? 'text-emerald-400' : s.adjOE > 113 ? 'text-green-400' : 'text-gray-300' },
    { label: 'Adj. DE', value: s.adjDE.toFixed(1), subLabel: 'Defensive Efficiency', color: s.adjDE < 90 ? 'text-emerald-400' : s.adjDE < 95 ? 'text-green-400' : s.adjDE < 100 ? 'text-yellow-400' : 'text-red-400' },
    { label: 'Tempo', value: s.tempo.toFixed(0), subLabel: 'Pace (pos/40m)', color: 'text-sky-400' },
    { label: '3P Rate', value: `${Math.round(s.threePointRate * 100)}%`, subLabel: 'Of FGA from 3', color: s.threePointRate > 0.42 ? 'text-orange-400' : 'text-gray-300' },
    { label: '3P%', value: `${Math.round(s.threePointPct * 100)}%`, subLabel: '3-point shooting', color: s.threePointPct > 0.37 ? 'text-emerald-400' : 'text-gray-300' },
    { label: 'TO Rate', value: `${s.turnoverRate.toFixed(1)}%`, subLabel: 'Turnovers per 100', color: s.turnoverRate < 14 ? 'text-emerald-400' : s.turnoverRate < 16 ? 'text-yellow-400' : 'text-red-400' },
    { label: 'TO Force', value: `${s.turnoverForcedRate.toFixed(1)}%`, subLabel: 'Forced per 100', color: s.turnoverForcedRate > 20 ? 'text-emerald-400' : 'text-gray-300' },
    { label: 'OReb%', value: `${s.offReboundRate.toFixed(1)}%`, subLabel: 'Offensive boards', color: s.offReboundRate > 32 ? 'text-emerald-400' : 'text-gray-300' },
    { label: 'DReb%', value: `${s.defReboundRate.toFixed(1)}%`, subLabel: 'Defensive boards', color: s.defReboundRate > 75 ? 'text-emerald-400' : 'text-gray-300' },
    { label: 'FT Rate', value: `${Math.round(s.ftRate * 100)}%`, subLabel: 'FTA/FGA', color: 'text-gray-300' },
    { label: 'SOS Rank', value: `#${s.sosRank}`, subLabel: 'Strength of schedule', color: s.sosRank < 30 ? 'text-emerald-400' : s.sosRank < 80 ? 'text-yellow-400' : 'text-red-400' },
    { label: 'eFG%', value: `${(s.efgPct * 100).toFixed(1)}%`, subLabel: 'Effective FG%', color: s.efgPct > 0.54 ? 'text-emerald-400' : s.efgPct > 0.50 ? 'text-yellow-400' : 'text-gray-300' },
    { label: 'Luck', value: s.luckFactor > 0 ? `+${s.luckFactor.toFixed(3)}` : s.luckFactor.toFixed(3), subLabel: 'Luck factor', color: s.luckFactor > 0.04 ? 'text-orange-400' : s.luckFactor < -0.02 ? 'text-emerald-400' : 'text-gray-300' },
  ]

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3', className)}>
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-lg border border-gray-800 bg-gray-900/50 p-3 hover:border-gray-700 transition-colors">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{stat.label}</p>
          <p className={cn('text-lg font-bold', stat.color ?? 'text-white')}>{stat.value}</p>
          {stat.subLabel && (
            <p className="text-xs text-gray-600 mt-0.5 truncate">{stat.subLabel}</p>
          )}
        </div>
      ))}
    </div>
  )
}
