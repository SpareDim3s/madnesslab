import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  subValue?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  accent?: 'orange' | 'blue' | 'red' | 'green' | 'purple'
  className?: string
}

const accentClasses = {
  orange: 'border-orange-500/30 bg-orange-500/5',
  blue: 'border-blue-500/30 bg-blue-500/5',
  red: 'border-red-500/30 bg-red-500/5',
  green: 'border-green-500/30 bg-green-500/5',
  purple: 'border-purple-500/30 bg-purple-500/5',
}

const iconAccentClasses = {
  orange: 'text-orange-400',
  blue: 'text-blue-400',
  red: 'text-red-400',
  green: 'text-green-400',
  purple: 'text-purple-400',
}

export function MetricCard({ label, value, subValue, icon, trend, accent = 'orange', className }: MetricCardProps) {
  return (
    <div className={cn(
      'rounded-xl border p-5 transition-colors',
      accentClasses[accent],
      className
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white truncate">{value}</p>
          {subValue && (
            <p className="mt-1 text-sm text-gray-400 truncate">{subValue}</p>
          )}
        </div>
        {icon && (
          <div className={cn('shrink-0 mt-0.5', iconAccentClasses[accent])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
