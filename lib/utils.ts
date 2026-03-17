import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPct(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatOdds(probability: number): string {
  if (probability >= 0.99) return '99%'
  if (probability <= 0.01) return '1%'
  return `${Math.round(probability * 100)}%`
}

export function getConfidenceTierLabel(tier: string): string {
  switch (tier) {
    case 'coin_flip': return 'Coin Flip'
    case 'slight_edge': return 'Slight Edge'
    case 'favored': return 'Favored'
    case 'clear_favorite': return 'Clear Favorite'
    default: return tier
  }
}

export function getUpsetTierColor(tier: string): string {
  switch (tier) {
    case 'high': return 'text-red-400 bg-red-400/10 border-red-400/30'
    case 'medium': return 'text-orange-400 bg-orange-400/10 border-orange-400/30'
    case 'low': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
    default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30'
  }
}

export function getVolatilityLabel(score: number): string {
  if (score >= 70) return 'Very High'
  if (score >= 50) return 'High'
  if (score >= 35) return 'Moderate'
  if (score >= 20) return 'Low'
  return 'Very Low'
}

export function getVolatilityColor(score: number): string {
  if (score >= 70) return 'text-red-400'
  if (score >= 50) return 'text-orange-400'
  if (score >= 35) return 'text-yellow-400'
  return 'text-green-400'
}

export function seedColor(seed: number): string {
  if (seed === 1) return 'text-yellow-400'
  if (seed <= 4) return 'text-blue-400'
  if (seed <= 8) return 'text-sky-300'
  if (seed <= 12) return 'text-gray-300'
  return 'text-gray-500'
}

export function winProbColor(prob: number): string {
  if (prob >= 0.80) return 'text-emerald-400'
  if (prob >= 0.65) return 'text-green-400'
  if (prob >= 0.55) return 'text-blue-400'
  if (prob >= 0.45) return 'text-gray-300'
  return 'text-orange-400'
}

export function roundName(round: number): string {
  switch (round) {
    case 0: return 'First Four'
    case 1: return 'Round of 64'
    case 2: return 'Round of 32'
    case 3: return 'Sweet 16'
    case 4: return 'Elite Eight'
    case 5: return 'Final Four'
    case 6: return 'Championship'
    default: return `Round ${round}`
  }
}

export function programTierBadge(tier: string): { label: string; color: string } {
  switch (tier) {
    case 'blueblood':
      return { label: 'Blue Blood', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' }
    case 'power':
      return { label: 'Power Conference', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' }
    case 'mid-major':
      return { label: 'Mid-Major', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' }
    case 'low-major':
      return { label: 'Low-Major', color: 'text-gray-400 bg-gray-400/10 border-gray-400/30' }
    default:
      return { label: tier, color: 'text-gray-400' }
  }
}

export function tournamentResultLabel(result: string): string {
  switch (result) {
    case 'R64': return 'First Round Exit'
    case 'R32': return 'Second Round Exit'
    case 'S16': return 'Sweet 16'
    case 'E8': return 'Elite Eight'
    case 'F4': return 'Final Four'
    case 'Runner-up': return 'Runner-up'
    case 'Champion': return '🏆 Champion'
    default: return result
  }
}
