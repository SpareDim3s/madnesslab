import type { Metadata } from 'next'
import './globals.css'
import { AppHeader } from '@/components/AppHeader'

export const metadata: Metadata = {
  title: 'MadnessLab — NCAA Tournament Intelligence',
  description: 'Every bracket is wrong. Ours tells you why. Advanced March Madness analytics with AI-powered matchup explanations, simulation, and historical trends.',
  keywords: 'NCAA tournament, March Madness, bracket simulator, college basketball analytics',
  openGraph: {
    title: 'MadnessLab',
    description: 'Smarter than a bracket picker.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-950 text-gray-100">
        <AppHeader />
        <main className="pt-16">
          {children}
        </main>
        <footer className="mt-20 border-t border-gray-800 py-8 text-center text-sm text-gray-500">
          <p>
            MadnessLab · 2025–26 T-Rank Data · For entertainment purposes only
          </p>
          <p className="mt-1">
            Efficiency stats sourced from Barttorvik/T-Rank. Predictions are models, not guarantees.
          </p>
        </footer>
      </body>
    </html>
  )
}
