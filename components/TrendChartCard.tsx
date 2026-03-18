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
    <div style={{
      borderRadius: 12,
      border: '1px solid #e8e0d0',
      background: '#ffffff',
      overflow: 'hidden',
    }} className={className}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e8e0d0',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1625', fontFamily: '"Playfair Display", Georgia, serif' }}>
          {title}
        </h3>
        {subtitle && <p style={{ fontSize: 12, color: '#8b7d6b', marginTop: 2 }}>{subtitle}</p>}
      </div>
      <div style={{ padding: 20 }}>
        {children}
      </div>
    </div>
  )
}

// Preset: Seed upset rates bar chart
export function SeedUpsetRatesChart() {
  const data = [
    { matchup: '1v16', upsetPct: 1.25 },
    { matchup: '2v15', upsetPct: 10 },
    { matchup: '3v14', upsetPct: 12.5 },
    { matchup: '4v13', upsetPct: 18.1 },
    { matchup: '5v12', upsetPct: 36.3 },
    { matchup: '6v11', upsetPct: 37.5 },
    { matchup: '7v10', upsetPct: 40.6 },
    { matchup: '8v9',  upsetPct: 47.5 },
  ]

  const getColor = (pct: number) => {
    if (pct >= 40) return '#b45309'
    if (pct >= 30) return '#d97706'
    if (pct >= 15) return '#a0832a'
    return '#2563eb'
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <XAxis dataKey="matchup" tick={{ fill: '#8b7d6b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#8b7d6b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 55]} />
        <Tooltip
          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e8e0d0', borderRadius: '8px', fontSize: '12px', color: '#1a1625' }}
          labelStyle={{ color: '#1a1625' }}
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
    { year: '2021', adjEM: 24.6 },
    { year: '2022', adjEM: 28.2 },
    { year: '2023', adjEM: 21.4 },
    { year: '2024', adjEM: 28.7 },
    { year: '2025', adjEM: 30.1 },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d0" />
        <XAxis dataKey="year" tick={{ fill: '#8b7d6b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#8b7d6b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[15, 35]} />
        <Tooltip
          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e8e0d0', borderRadius: '8px', fontSize: '12px', color: '#1a1625' }}
          formatter={(v: number) => [v.toFixed(1), 'adjEM']}
        />
        <Line type="monotone" dataKey="adjEM" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Preset: Conference championships bar chart
export function ConferenceChampionshipChart() {
  const data = [
    { conference: 'ACC', titles: 3 },
    { conference: 'Big 12', titles: 2 },
    { conference: 'Big Ten', titles: 2 },
    { conference: 'Big East', titles: 2 },
    { conference: 'SEC', titles: 2 },
    { conference: 'Pac-12', titles: 1 },
    { conference: 'AAC', titles: 1 },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <XAxis dataKey="conference" tick={{ fill: '#8b7d6b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#8b7d6b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e8e0d0', borderRadius: '8px', fontSize: '12px', color: '#1a1625' }}
          formatter={(v: number) => [v, 'Championships']}
        />
        <Bar dataKey="titles" radius={[4, 4, 0, 0]} fill="#a0832a" />
      </BarChart>
    </ResponsiveContainer>
  )
}
