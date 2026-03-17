'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { Sparkles, RefreshCw, Bot, Cpu } from 'lucide-react'
import { Skeleton } from './LoadingSkeleton'

interface AIExplanationCardProps {
  gameId: string
  initialExplanation?: string
  source?: 'ai' | 'fallback'
  className?: string
}

export function AIExplanationCard({ gameId, initialExplanation, source = 'fallback', className }: AIExplanationCardProps) {
  const [explanation, setExplanation] = useState(initialExplanation ?? '')
  const [currentSource, setCurrentSource] = useState(source)
  const [isPending, startTransition] = useTransition()
  const [hasRefreshed, setHasRefreshed] = useState(false)

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/explain-matchup?gameId=${gameId}`)
        if (res.ok) {
          const data = await res.json() as { explanation: string; source: 'ai' | 'fallback' }
          setExplanation(data.explanation)
          setCurrentSource(data.source)
          setHasRefreshed(true)
        }
      } catch (err) {
        console.error('Failed to refresh explanation:', err)
      }
    })
  }

  return (
    <div className={cn('rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900/80">
        <div className="flex items-center gap-2">
          {currentSource === 'ai' ? (
            <Sparkles className="h-4 w-4 text-orange-400" />
          ) : (
            <Cpu className="h-4 w-4 text-blue-400" />
          )}
          <span className="text-sm font-semibold text-gray-200">
            {currentSource === 'ai' ? 'AI Analysis' : 'Statistical Analysis'}
          </span>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full border',
            currentSource === 'ai'
              ? 'text-orange-400 bg-orange-400/10 border-orange-400/30'
              : 'text-blue-400 bg-blue-400/10 border-blue-400/30'
          )}>
            {currentSource === 'ai' ? 'LLM' : 'Deterministic'}
          </span>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isPending && 'animate-spin')} />
          Regenerate
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full mt-3" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : explanation ? (
          <div className="prose prose-sm prose-invert max-w-none">
            {explanation.split('\n\n').map((para, i) => (
              <p key={i} className="text-gray-300 leading-relaxed text-sm mb-3 last:mb-0">
                {para}
              </p>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bot className="h-8 w-8 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No explanation available yet.</p>
            <button
              onClick={handleRefresh}
              className="mt-3 text-xs text-orange-400 hover:text-orange-300"
            >
              Generate analysis
            </button>
          </div>
        )}

        {currentSource === 'fallback' && !isPending && (
          <p className="mt-4 text-xs text-gray-600 border-t border-gray-800 pt-3">
            This analysis uses deterministic rules from the prediction engine.{' '}
            Set AI_PROVIDER and AI_API_KEY in your .env to enable LLM explanations.
          </p>
        )}
      </div>
    </div>
  )
}
