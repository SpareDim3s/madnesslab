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

const accentStyles: Record<string, { border: string; iconColor: string; valueColor: string }> = {
  orange: { border: '#a0832a40', iconColor: '#a0832a', valueColor: '#1a1625' },
  blue:   { border: '#2563eb40', iconColor: '#2563eb', valueColor: '#1a1625' },
  red:    { border: '#dc262640', iconColor: '#dc2626', valueColor: '#1a1625' },
  green:  { border: '#16a34a40', iconColor: '#16a34a', valueColor: '#1a1625' },
  purple: { border: '#7c3aed40', iconColor: '#7c3aed', valueColor: '#1a1625' },
}

export function MetricCard({ label, value, subValue, icon, accent = 'orange', className }: MetricCardProps) {
  const styles = accentStyles[accent] ?? accentStyles.orange

  return (
    <div
      className={cn('rounded-xl p-5 transition-all', className)}
      style={{ background: 'white', border: `1px solid ${styles.border}`, boxShadow: '0 1px 4px rgba(26,22,37,0.04)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>{label}</p>
          <p className="text-xl font-bold truncate" style={{ color: styles.valueColor, fontFamily: '"Playfair Display", serif' }}>
            {value}
          </p>
          {subValue && (
            <p className="mt-1 text-xs truncate" style={{ color: '#9ca3af' }}>{subValue}</p>
          )}
        </div>
        {icon && (
          <div className="shrink-0 mt-0.5" style={{ color: styles.iconColor }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
