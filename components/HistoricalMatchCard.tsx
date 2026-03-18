'use client'

import type { HistoricalBracketMatch } from '@/lib/historicalTwins'
import { GitMerge, Trophy } from 'lucide-react'

interface HistoricalMatchCardProps {
  match: HistoricalBracketMatch
  rank?: number
  className?: string
}

function resultColor(result: string): string {
  if (result === 'Champion')  return '#a0832a'
  if (result === 'Runner-up') return '#b45309'
  if (result === 'F4')        return '#2563eb'
  if (result === 'E8')        return '#7c3aed'
  return '#8b7d6b'
}

function resultLabel(result: string): string {
  const labels: Record<string, string> = {
    Champion: '🏆 Champion',
    'Runner-up': 'Runner-up',
    F4: 'Final Four',
    E8: 'Elite Eight',
    S16: 'Sweet 16',
    R32: 'Round of 32',
    R64: 'Round of 64',
  }
  return labels[result] ?? result
}

export function HistoricalMatchCard({ match, rank, className }: HistoricalMatchCardProps) {
  const { candidate: c, similarityScore, explanation } = match

  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid #e8e0d0',
      background: '#ffffff',
      padding: 16,
      transition: 'border-color 0.15s',
    }} className={className}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {rank && (
            <span style={{
              display: 'flex',
              width: 24,
              height: 24,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: '#f0e8d0',
              border: '1px solid #e8e0d0',
              fontSize: 11,
              fontWeight: 700,
              color: '#a0832a',
              flexShrink: 0,
            }}>
              {rank}
            </span>
          )}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1625' }}>
              {c.teamName}{' '}
              <span style={{ color: '#8b7d6b', fontWeight: 400 }}>'{String(c.year).slice(2)}</span>
            </p>
            <p style={{ fontSize: 11, color: '#8b7d6b' }}>{c.region} Region · KenPom #{c.kenpomRank}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <GitMerge style={{ width: 12, height: 12, color: '#a0832a' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a0832a' }}>{similarityScore}%</span>
            <span style={{ fontSize: 11, color: '#8b7d6b' }}>match</span>
          </div>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: 20,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 600,
            background: '#f0e8d0',
            color: '#1a1625',
            border: '1px solid #e8e0d0',
          }}>
            #{c.seed} seed
          </span>
        </div>
      </div>

      {/* Key stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Adj EM',  value: c.adjEM.toFixed(1) },
          { label: 'Off Eff', value: c.adjOE.toFixed(1) },
          { label: 'Def Eff', value: c.adjDE.toFixed(1) },
        ].map(stat => (
          <div key={stat.label} style={{
            borderRadius: 6,
            background: '#f5f0e6',
            padding: '6px 8px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 10, color: '#8b7d6b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#1a1625' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tournament result */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Trophy style={{ width: 12, height: 12, color: '#8b7d6b' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: resultColor(c.tournamentResult) }}>
          {resultLabel(c.tournamentResult)}
        </span>
      </div>

      {/* Explanation */}
      <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{explanation}</p>
    </div>
  )
}
