'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/bracket', label: 'Bracket' },
  { href: '/teams', label: 'Teams' },
  { href: '/compare', label: 'Compare' },
  { href: '/trends', label: 'Trends' },
  { href: '/about', label: 'About' },
]

export function AppHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm"
      style={{
        backgroundColor: 'rgba(245, 240, 230, 0.97)',
        borderBottom: '1px solid #e8e0d0',
        boxShadow: '0 1px 12px rgba(160, 131, 42, 0.08)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* Art Nouveau monogram badge */}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #a0832a, #c4a84a)',
              boxShadow: '0 2px 8px rgba(160, 131, 42, 0.3)',
            }}
          >
            <span className="text-white font-bold text-sm" style={{ fontFamily: '"Playfair Display", serif' }}>M</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className="font-bold text-lg tracking-tight"
              style={{ fontFamily: '"Playfair Display", serif', color: '#1a1625' }}
            >
              Madness<span style={{ color: '#a0832a' }}>Lab</span>
            </span>
            <span className="hidden sm:inline text-xs font-mono ml-0.5" style={{ color: '#9ca3af' }}>
              2026
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map(link => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'font-semibold'
                    : 'hover:bg-black/5'
                )}
                style={{
                  color: isActive ? '#1a1625' : '#4a4560',
                  backgroundColor: isActive ? '#ede5d0' : undefined,
                }}
              >
                {link.label}
              </Link>
            )
          })}
          <Link
            href="/bracket"
            className="ml-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 hover:opacity-90 hover:shadow-md"
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
            }}
          >
            Simulate →
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg transition-colors hover:bg-black/5"
          style={{ color: '#4a4560' }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div style={{ borderTop: '1px solid #e8e0d0', backgroundColor: '#f5f0e6' }}>
          <nav className="flex flex-col px-4 py-3 gap-1">
            {NAV_LINKS.map(link => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  )}
                  style={{
                    color: isActive ? '#1a1625' : '#4a4560',
                    backgroundColor: isActive ? '#ede5d0' : undefined,
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
            <Link
              href="/bracket"
              onClick={() => setMobileOpen(false)}
              className="mt-1 px-4 py-3 rounded-lg text-sm font-semibold text-center transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#2563eb', color: 'white' }}
            >
              Simulate Tournament →
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
