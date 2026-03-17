'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { FlaskConical, Menu, X } from 'lucide-react'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/bracket', label: 'Bracket' },
  { href: '/teams', label: 'Teams' },
  { href: '/trends', label: 'Trends' },
  { href: '/about', label: 'About' },
]

export function AppHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/80 bg-gray-950/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 group-hover:bg-orange-400 transition-colors">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            Madness<span className="text-orange-400">Lab</span>
          </span>
          <span className="hidden sm:inline-block text-xs text-gray-500 font-mono ml-1">
            2026
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === link.href || pathname.startsWith(link.href + '/')
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/bracket"
            className="ml-2 px-4 py-2 rounded-md text-sm font-semibold bg-orange-500 text-white hover:bg-orange-400 transition-colors"
          >
            Simulate →
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-gray-400 hover:text-white"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-950">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'px-4 py-3 rounded-md text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/bracket"
              onClick={() => setMobileOpen(false)}
              className="mt-1 px-4 py-3 rounded-md text-sm font-semibold bg-orange-500 text-center text-white"
            >
              Simulate Tournament →
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
