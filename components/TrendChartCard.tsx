'use client'

import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from 'recharts'

interface TrendChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

export function TrendChartCard({ title, subtitle, children, className }: TrendChartCardProps) {
  return (
    <div className={cn('rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden', className)}>
      <div className="px-5 py-4 border-b border-gray-800">
        <h3 className="font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}

// Preset: Seed upset rates bar chart
export function SeedUpsetRatesChart() {
  const data = [
    { matchup: '1v16', upsetPct: 1.25, label: '1%' },
    { matchup: '2v15', upsetPct: 10, label: '10%' },
    { matchup: '3v14', upsetPct: 12.5, label: '12.5%' },
    { matchup: '4v13', upsetPct: 18.1, label: '18%' },
    { matchup: '5v12', upsetPct: 36.3, label: '36%' },
    { matchup: '6v11', upsetPct: 37.5, label: '37.5%' },
    { matchup: '7v10', upsetPct: 40.6, label: '41%' },
    { matchup: '8v9', upsetPct: 47.5, label: '47.5%' },
  ]

  const getColor = (pct: number) => {
    if (pct >= 40) return '#f97316'
    if (pct >= 30) return '#fb923c'
    if (pct >= 15) return '#fbbf24'
    return '#22c55e'
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <XAxis dataKey="matchup" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 55]} />
        <Tooltip
          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
          labelStyle={{ color: '#d1d5db' }}
          formatter={(v: number) => [`${v.toFixed(1)}%`, 'Upset Rate']}
        />
        <Bar dataKey="upsetPct" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={getColor(entry.upsetPct)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// Preset: Champion adjEM trend
export function ChampionAdjEMChart() {
  const data = [
    { year: '2012', adjEM: 30.6 },
    { year: '2013', adjEM: 29.6 },
    { year: '2014', adjEM: 20.4 },
    { year: '2015', adjEM: 29.0 },
    { year: '2016', adjEM: 29.4 },
    { year: '2017', adjEM: 27.2 },
    { year: '2018', adjEM: 31.4 },
    { year: '2019', adjEM: 32.6 },
    { year: '2021', adjEM: 31.8 },
    { year: '2022', adjEM: 26.8 },
    { year: '2023', adjEM: 29.6 },
    { year: '2024', adjEM: 32.6 },
    { year: '2025', adjEM: 29.8 },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={[18, 36]} />
        <Tooltip
          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
          labelStyle={{ color: '#d1d5db' }}
          formatter={(v: number) => [v.toFixed(1), 'Champ adjEM']}
        />
        <Line type="monotone" dataKey="adjEM" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Preset: Conference championship rates
export function ConferenceChampionshipChart() {
  const data = [
    { conf: 'Big 12', titles: 3, color: '#3b82f6' },
    { conf: 'SEC', titles: 4, color: '#22c55e' },
    { conf: 'ACC', titles: 3, color: '#a855f7' },
    { conf: 'Big East', titles: 3, color: '#f97316' },
    { conf: 'Big Ten', titles: 2, color: '#f59e0b' },
    { conf: 'American', titles: 2, color: '#06b6d4' },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 40 }}>
        <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 5]} />
        <YAxis type="category" dataKey="conf" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
          labelStyle={{ color: '#d1d5db' }}
          formatter={(v: number) => [v, 'Titles (2012-2025)']}
        />
        <Bar dataKey="titles" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
