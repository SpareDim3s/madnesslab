# MadnessLab

**Smarter than a bracket picker.**

> Every bracket is wrong. Ours tells you why.

MadnessLab is a stats-first NCAA Tournament intelligence app. It combines Monte Carlo simulation, a 4-layer prediction engine, historical trend analysis, AI-powered matchup explanations, and a "Historical Twins" feature into a single polished web app.

---

## What It Is

Most bracket tools are either:
1. AI models guessing game outcomes (unreliable, no statistical grounding)
2. Simple seed-based pickers with no real analytics

MadnessLab is neither. The prediction engine uses adjusted efficiency metrics, matchup analysis, tournament priors, and variance modeling. The AI layer is strictly for plain-English explanation — it never drives predictions.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Database | PostgreSQL via Prisma |
| Caching | Redis (for rate limiting + cache) |
| Validation | Zod |
| AI Providers | Anthropic Claude / OpenAI (optional) |

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd madnesslab
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# For mock data mode (no DB required):
USE_MOCK_DATA=true

# For real DB:
DATABASE_URL=postgresql://user:password@localhost:5432/madnesslab
REDIS_URL=redis://localhost:6379

# For AI explanations (optional):
AI_PROVIDER=anthropic   # or "openai" or "none"
AI_API_KEY=your-key
AI_MODEL=claude-haiku-4-5
```

### 3. Run in mock data mode (no DB needed)

```bash
npm run dev
```

That's it. With `USE_MOCK_DATA=true`, the app runs entirely from in-memory mock data. No database, no Redis required.

Open [http://localhost:3000](http://localhost:3000).

---

## Database Setup (optional, for full persistence)

Only needed if you want bracket persistence, user brackets, or pool scoring.

```bash
# Start PostgreSQL (Docker example)
docker run -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Set DATABASE_URL in .env, then:
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to DB
npm run db:seed       # Seed with 2026 tournament data
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `USE_MOCK_DATA` | No | `true` | Run with in-memory mock data, no DB needed |
| `DATABASE_URL` | If not mock | — | PostgreSQL connection string |
| `REDIS_URL` | No | — | Redis for caching. Falls back gracefully |
| `AI_PROVIDER` | No | `none` | `anthropic`, `openai`, or `none` |
| `AI_API_KEY` | If AI | — | API key for AI provider |
| `AI_MODEL` | No | model default | Override AI model name |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Used for metadata |

---

## Mock Data Mode

When `USE_MOCK_DATA=true`:

- All 68 teams are loaded from `lib/mockData.ts` with realistic (but simulated) KenPom-style stats
- The prediction engine runs entirely in TypeScript — no external data calls
- The simulation engine runs fully in memory
- Historical data (upset rates, champion profiles) is loaded from `lib/historicalData.ts`
- The AI explanation layer falls back to deterministic rule-based explanations

All mock stats are labeled as estimates. They are NOT real KenPom data.

---

## Plugging In Real Data (Barttorvik / T-Rank)

MadnessLab ships with a built-in fetcher for **Barttorvik (T-Rank)** — a free, publicly accessible source of KenPom-equivalent adjusted efficiency stats.

### One-command real data setup

```bash
npm run data:fetch
```

This runs `scripts/fetchTRankData.ts`, which:
1. Fetches all D1 team stats from `barttorvik.com/teamslicejson.php?year=2026&json=1`
2. Maps them to the `MockTeam` shape (adjOE, adjDE, adjEM, tempo, 3P%, turnover rates, rebound rates, etc.)
3. Cross-references the 2026 bracket (hardcoded seed/region assignments)
4. Writes `lib/realData.ts` — a drop-in replacement for `lib/mockData.ts`

Then switch the app to real data:

```bash
# In .env:
USE_MOCK_DATA=false
```

The app's `lib/dataService.ts` automatically loads `lib/realData.ts` when `USE_MOCK_DATA=false`.

### What changes with real data
- `adjOE`, `adjDE`, `adjEM`, `tempo` — real Barttorvik values
- `efgPct`, `threePointPct`, `turnoverRate`, `offReboundRate`, `defReboundRate` — real values
- `kenpomRank` — T-Rank ranking (equivalent to KenPom rank)
- `luckFactor`, `sosRank` — derived from Barttorvik data
- `recentForm`, `titleProfileScore`, `upsetVulnerability` — computed from real power ratings

### Other data sources
- **KenPom** — Higher accuracy (paid subscription required); implement `lib/dataProviders/kenpomProvider.ts`
- **Sports Reference** — Historical game data
- **NCAA Stats** — Official stats feed

---

## How the Prediction Engine Works

### Layer 1 — Base Team Strength
- Adjusted efficiency margin (adjEM) as the primary signal
- Strength of schedule bonus/penalty
- Recent form (last 5/10 games, streak)
- Combined via a logistic function

### Layer 2 — Matchup Adjustments
- 3-point rate vs 3-point defense interaction
- Turnover creation vs susceptibility
- Offensive vs defensive rebounding battle
- Tempo mismatch advantage

### Layer 3 — Tournament Priors
- Empirical seed matchup upset rates (1985–2025)
- 12-seeds win 36% vs 5-seeds; 8v9 is a 47.5% toss-up
- Blended at 20% weight

### Layer 4 — Variance Model
- High 3-point reliance → more volatile
- Extreme tempo mismatches → chaotic
- Tight quality gaps → pull toward 50/50

Final output: win probability, confidence tier, volatility score, upset alert tier, deciding factors.

---

## How the AI Explanation Layer Works

The AI layer receives **only structured matchup data** — team stats, win probabilities, volatility, deciding factors, and historical upset rates. It is instructed:

- Use only the provided fields
- Never fabricate injuries, rankings, or records not given
- Mention when the edge is small
- Keep tone sharp and readable, not corny

If no `AI_API_KEY` is set, a deterministic fallback generates explanations from the same structured data. The fallback is lower quality but fully grounded.

Supported providers: `anthropic` (Claude), `openai` (GPT).

---

## Routes

| Route | Description |
|---|---|
| `/` | Home — metrics, contenders, upset alerts |
| `/bracket` | Bracket simulator with Monte Carlo |
| `/teams` | All 68 teams by region |
| `/teams/[slug]` | Team detail: stats, twins, path, matchup |
| `/matchups/[gameId]` | Matchup deep dive with AI analysis |
| `/trends` | Seed trends, archetypes, conference data |
| `/about` | How it works |
| `/api/teams` | GET all teams |
| `/api/teams/[teamId]` | GET team + twins + first-round prediction |
| `/api/games` | GET R64 games |
| `/api/games/[gameId]` | GET game + full prediction |
| `/api/simulate` | POST run simulation |
| `/api/trends` | GET historical trends data |
| `/api/explain-matchup` | GET/POST AI matchup explanation |

---

## Tradeoffs & Future Improvements

### Current tradeoffs
- **No Python service**: Simulation is TypeScript-only. For large-scale Monte Carlo (10,000+ sims), a Python/Rust service would be faster.
- **No real-time data**: Stats are seeded from mock data. A cron job to pull fresh KenPom/T-Rank would make this production-grade.
- **Simple bracket UI**: Responsive HTML bracket; no animated canvas. Trades visual flair for accessibility and performance.
- **No auth**: User brackets use anonymous session IDs. Full auth would enable persistent bracket sharing.

### Future improvements
1. Real-time data provider integration (KenPom, T-Rank, ESPN)
2. Streaming simulation for live bracket animation
3. Full pool optimizer with opponent modeling
4. Push notifications for bracket updates
5. Historical bracket tracking (compare your bracket to the model)
6. More archetype detection (e.g., classifying teams automatically by style)
7. Player-level data integration for injury modeling

---

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Lint
npm run data:fetch   # Fetch real stats from Barttorvik (generates lib/realData.ts)
npm run db:studio    # Open Prisma Studio (requires DB)
```

---

## Notes

- All team stats are mock data for demonstration. Do not use for real bracket decisions.
- MadnessLab is not affiliated with the NCAA, ESPN, or KenPom.
- Built for March Madness 2026. For entertainment only.
