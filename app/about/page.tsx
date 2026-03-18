export const dynamic = 'force-dynamic'

import { FlaskConical, Layers, Zap, GitMerge, Sparkles, Database, Code2 } from 'lucide-react'

export const metadata = {
  title: 'About — MadnessLab',
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          width: 48,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          background: '#f0e8d0',
          border: '1px solid #e8e0d0',
          flexShrink: 0,
        }}>
          <FlaskConical style={{ width: 24, height: 24, color: '#a0832a' }} />
        </div>
        <div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#1a1625',
            fontFamily: '"Playfair Display", Georgia, serif',
          }}>
            About MadnessLab
          </h1>
          <p style={{ fontSize: 13, color: '#8b7d6b' }}>Smarter than a bracket picker.</p>
        </div>
      </div>

      <p style={{ fontSize: 14, color: '#4a4560', lineHeight: 1.7, marginBottom: 32 }}>
        MadnessLab is a stats-first NCAA Tournament intelligence app. Unlike bracket pickers that let an AI guess game outcomes,
        MadnessLab uses a 4-layer statistical prediction engine grounded in adjusted efficiency metrics, matchup analysis,
        historical tournament patterns, and variance modeling. The AI layer is used only for natural-language explanations —
        it never drives predictions.
      </p>

      {/* How it works */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#1a1625',
          fontFamily: '"Playfair Display", Georgia, serif',
          marginBottom: 16,
        }}>
          Prediction Engine
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              icon: <Layers style={{ width: 18, height: 18, color: '#2563eb' }} />,
              title: 'Layer 1 — Base Team Strength',
              desc: 'Adjusted efficiency margin (adjEM), tempo, strength of schedule, luck factor, and recent form. Weighted using a KenPom-style logistic model.',
              accent: '#eff6ff',
              border: '#bfdbfe',
            },
            {
              icon: <Zap style={{ width: 18, height: 18, color: '#b45309' }} />,
              title: 'Layer 2 — Matchup Adjustments',
              desc: '3-point rate vs 3-point defense, turnover creation vs susceptibility, rebounding battles, pace interaction, and inside/outside scoring profiles.',
              accent: '#fffbeb',
              border: '#fde68a',
            },
            {
              icon: <Database style={{ width: 18, height: 18, color: '#7c3aed' }} />,
              title: 'Layer 3 — Tournament Priors',
              desc: 'Historical seed matchup upset rates (1985–2025). 12-seeds win 36% of the time against 5-seeds. 8v9 is a near coin flip. These priors are blended in (20% weight).',
              accent: '#faf5ff',
              border: '#e9d5ff',
            },
            {
              icon: <FlaskConical style={{ width: 18, height: 18, color: '#dc2626' }} />,
              title: 'Layer 4 — Variance & Chaos Model',
              desc: '3-point dependence, turnover variance, tempo extremes, foul risk, and quality gap all adjust the probability toward 50/50 when conditions are chaotic.',
              accent: '#fef2f2',
              border: '#fecaca',
            },
          ].map(layer => (
            <div key={layer.title} style={{
              display: 'flex',
              gap: 16,
              borderRadius: 10,
              border: `1px solid ${layer.border}`,
              background: layer.accent,
              padding: 16,
            }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>{layer.icon}</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1625' }}>{layer.title}</p>
                <p style={{ fontSize: 13, color: '#4a4560', marginTop: 4, lineHeight: 1.6 }}>{layer.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Simulation */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#1a1625',
          fontFamily: '"Playfair Display", Georgia, serif',
          marginBottom: 12,
        }}>
          Monte Carlo Simulation
        </h2>
        <p style={{ fontSize: 14, color: '#4a4560', lineHeight: 1.7, marginBottom: 12 }}>
          The bracket simulator runs N complete tournament simulations. Each game uses the prediction engine's win probability
          as the basis for a random draw. Running more simulations (100+) gives stable championship odds; 1× gives a single bracket result.
        </p>
        <p style={{ fontSize: 14, color: '#4a4560', lineHeight: 1.7 }}>
          Aggregate results show title odds, Final Four odds, Elite Eight odds, and Sweet 16 odds for every team —
          a much richer output than a single bracket pick.
        </p>
      </section>

      {/* AI layer */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Sparkles style={{ width: 18, height: 18, color: '#a0832a' }} />
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#1a1625',
            fontFamily: '"Playfair Display", Georgia, serif',
          }}>
            AI Explanation Layer
          </h2>
        </div>
        <div style={{
          borderRadius: 10,
          border: '1px solid #e8d5a3',
          background: '#fdf8ed',
          padding: 20,
          marginBottom: 16,
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#a0832a', marginBottom: 8 }}>
            Core Rule: AI explains. AI never predicts.
          </p>
          <p style={{ fontSize: 13, color: '#4a4560', lineHeight: 1.6 }}>
            The LLM receives structured matchup data and is instructed to explain what the stats mean —
            not to invent facts. It cannot access the internet, cannot fabricate injuries, and cannot override
            the statistical output.
          </p>
        </div>
        <p style={{ fontSize: 13, color: '#4a4560', lineHeight: 1.7 }}>
          When no API key is configured (the default), a deterministic rule-based fallback generates explanations
          using the same structured data. The output quality is lower but grounded in the same facts.
          Set <code style={{ color: '#a0832a' }}>AI_PROVIDER</code> and <code style={{ color: '#a0832a' }}>AI_API_KEY</code> to enable LLM explanations.
        </p>
      </section>

      {/* Bracket Twins */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <GitMerge style={{ width: 18, height: 18, color: '#7c3aed' }} />
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#1a1625',
            fontFamily: '"Playfair Display", Georgia, serif',
          }}>
            Bracket Twins
          </h2>
        </div>
        <p style={{ fontSize: 13, color: '#4a4560', lineHeight: 1.7 }}>
          For each 2026 team, we compute a weighted Euclidean distance across normalized features against a
          curated library of past tournament teams (2012–2025): adjEM (35%), seed (25%), adjDE (18%), adjOE (12%),
          eFG% (6%), and 3-point rate (4%). The 3 most statistically similar <em>historical</em> teams are shown
          along with how far they went — Champion, Final Four, Elite Eight, etc. — giving you a data-grounded
          precedent for what a team like this tends to accomplish in March.
        </p>
      </section>

      {/* Tech stack */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Code2 style={{ width: 18, height: 18, color: '#2563eb' }} />
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#1a1625',
            fontFamily: '"Playfair Display", Georgia, serif',
          }}>
            Tech Stack
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Framework', value: 'Next.js 14 (App Router)' },
            { label: 'Language', value: 'TypeScript' },
            { label: 'Styling', value: 'Tailwind CSS + inline styles' },
            { label: 'Charts', value: 'Recharts' },
            { label: 'Stats Data', value: 'Barttorvik / T-Rank' },
            { label: 'Database', value: 'PostgreSQL via Prisma' },
            { label: 'Validation', value: 'Zod' },
            { label: 'AI Providers', value: 'Anthropic Claude / OpenAI' },
          ].map(item => (
            <div key={item.label} style={{
              borderRadius: 8,
              border: '1px solid #e8e0d0',
              background: '#ffffff',
              padding: 12,
            }}>
              <p style={{ fontSize: 11, color: '#8b7d6b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1625', marginTop: 2 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data disclaimer */}
      <section>
        <h2 style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#1a1625',
          fontFamily: '"Playfair Display", Georgia, serif',
          marginBottom: 12,
        }}>
          Data & Disclaimer
        </h2>
        <div style={{
          borderRadius: 10,
          border: '1px solid #e8e0d0',
          background: '#fdfcf8',
          padding: 20,
        }}>
          <p style={{ fontSize: 13, color: '#4a4560', lineHeight: 1.7 }}>
            <strong style={{ color: '#1a1625' }}>Data sources:</strong> Adjusted efficiency metrics (adjOE, adjDE, adjEM),
            shooting stats (eFG%, 3P rate, FT rate), and tempo are sourced from{' '}
            <span style={{ color: '#a0832a', fontWeight: 500 }}>Barttorvik / T-Rank</span> for the 2025–26 season.
            Seed matchup upset rates are derived from historical NCAA Tournament results (1985–2025).
          </p>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 12, lineHeight: 1.7 }}>
            MadnessLab is for entertainment and analytical exploration only. Stats reflect regular-season performance
            and do not account for injuries, lineup changes, or other real-time factors. Not intended for wagering.
          </p>
        </div>
      </section>
    </div>
  )
}
