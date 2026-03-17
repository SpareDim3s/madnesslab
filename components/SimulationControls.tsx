'use client'

import { cn } from '@/lib/utils'
import { Play, RotateCcw, Loader2 } from 'lucide-react'

interface SimulationControlsProps {
  numSims: number
  onNumSimsChange: (n: number) => void
  onRun: () => void
  onReset: () => void
  isRunning: boolean
  hasResults: boolean
  className?: string
}

const SIM_OPTIONS = [1, 10, 100, 1000] as const

export function SimulationControls({
  numSims,
  onNumSimsChange,
  onRun,
  onReset,
  isRunning,
  hasResults,
  className,
}: SimulationControlsProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Sim count selector */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-900 p-1">
        {SIM_OPTIONS.map(n => (
          <button
            key={n}
            onClick={() => onNumSimsChange(n)}
            disabled={isRunning}
            className={cn(
              'rounded px-3 py-1.5 text-sm font-medium transition-all',
              numSims === n
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            )}
          >
            {n}×
          </button>
        ))}
      </div>

      {/* Run button */}
      <button
        onClick={onRun}
        disabled={isRunning}
        className={cn(
          'flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all',
          isRunning
            ? 'bg-orange-500/50 text-orange-200 cursor-not-allowed'
            : 'bg-orange-500 text-white hover:bg-orange-400 active:scale-95'
        )}
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Simulating...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Run {numSims === 1 ? 'Simulation' : `${numSims} Simulations`}
          </>
        )}
      </button>

      {/* Reset button */}
      {hasResults && !isRunning && (
        <button
          onClick={onReset}
          className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-all"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      )}

      {/* Info */}
      <p className="text-xs text-gray-500 hidden sm:block">
        {numSims === 1 ? 'Single bracket simulation' : `Runs ${numSims} simulations and aggregates odds`}
      </p>
    </div>
  )
}
