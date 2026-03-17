import { cn, getUpsetTierColor } from '@/lib/utils'
import { AlertTriangle, Zap } from 'lucide-react'

interface UpsetAlertBadgeProps {
  tier: string
  reasons?: string[]
  className?: string
  showLabel?: boolean
}

export function UpsetAlertBadge({ tier, reasons, className, showLabel = true }: UpsetAlertBadgeProps) {
  if (tier === 'none' || !tier) return null

  const label = {
    high: 'High Upset Risk',
    medium: 'Upset Alert',
    low: 'Mild Upset Risk',
  }[tier] ?? 'Upset Alert'

  const Icon = tier === 'high' ? Zap : AlertTriangle

  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold', getUpsetTierColor(tier), className)}>
      <Icon className="h-3 w-3 shrink-0" />
      {showLabel && <span>{label}</span>}
    </div>
  )
}
