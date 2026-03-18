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
    <div style={{
      borderRadius: 12,
      border: '1px solid #e8e0d0',
      background: '#ffffff',
      overflow: 'hidden',
    }} className={className}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid #e8e0d0',
        background: '#fdfcf8',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {currentSource === 'ai' ? (
            <Sparkles style={{ width: 16, height: 16, color: '#a0832a' }} />
          ) : (
            <Cpu style={{ width: 16, height: 16, color: '#2563eb' }} />
          )}
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1625' }}>
            {currentSource === 'ai' ? 'AI Analysis' : 'Statistical Analysis'}
          </span>
          <span style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 20,
            border: '1px solid',
            borderColor: currentSource === 'ai' ? '#e8d5a3' : '#bfdbfe',
            color: currentSource === 'ai' ? '#a0832a' : '#2563eb',
            background: currentSource === 'ai' ? '#fdf8ed' : '#eff6ff',
          }}>
            {currentSource === 'ai' ? 'LLM' : 'Deterministic'}
          </span>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isPending}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: '#8b7d6b',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            opacity: isPending ? 0.5 : 1,
          }}
        >
          <RefreshCw style={{ width: 14, height: 14, animation: isPending ? 'spin 1s linear infinite' : 'none' }} />
          Regenerate
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: 20 }}>
        {isPending ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : explanation ? (
          <div>
            {explanation.split('\n\n').map((para, i) => (
              <p key={i} style={{ fontSize: 14, color: '#4a4560', lineHeight: 1.7, marginBottom: 12 }}>
                {para}
              </p>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Bot style={{ width: 32, height: 32, color: '#e8e0d0', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: '#8b7d6b' }}>No explanation available yet.</p>
            <button
              onClick={handleRefresh}
              style={{
                marginTop: 12,
                fontSize: 12,
                color: '#2563eb',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Generate analysis
            </button>
          </div>
        )}

        {currentSource === 'fallback' && !isPending && (
          <p style={{
            marginTop: 16,
            fontSize: 11,
            color: '#8b7d6b',
            borderTop: '1px solid #e8e0d0',
            paddingTop: 12,
          }}>
            This analysis uses deterministic rules from the prediction engine.{' '}
            Set AI_PROVIDER and AI_API_KEY in your .env to enable LLM explanations.
          </p>
        )}
      </div>
    </div>
  )
}
