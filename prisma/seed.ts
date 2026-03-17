/**
 * MadnessLab Database Seed Script
 *
 * Populates the database with 2026 tournament mock data.
 * Run with: npm run db:seed
 *
 * Note: This requires DATABASE_URL to point to a real PostgreSQL instance.
 * For local dev without a DB, set USE_MOCK_DATA=true and skip seeding.
 */

import { PrismaClient } from '@prisma/client'
import { ALL_TEAMS } from '../lib/mockData'
import { predictMatchup } from '../lib/predictionEngine'
import { HISTORICAL_TWIN_CANDIDATES, HISTORICAL_CHAMPIONS } from '../lib/historicalData'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting MadnessLab seed...')

  // 1. Create tournament
  const tournament = await prisma.tournament.upsert({
    where: { year: 2026 },
    update: {},
    create: {
      year: 2026,
      name: '2026 NCAA Men\'s Basketball Tournament',
      status: 'upcoming',
      startDate: new Date('2026-03-17'),
      endDate: new Date('2026-04-06'),
      venue: 'Various | Final Four: Indianapolis',
    },
  })
  console.log(`✓ Tournament: ${tournament.name}`)

  // 2. Create teams
  let teamCount = 0
  for (const mockTeam of ALL_TEAMS) {
    const team = await prisma.team.upsert({
      where: { slug: mockTeam.slug },
      update: {
        name: mockTeam.name,
        abbreviation: mockTeam.abbreviation,
        conference: mockTeam.conference,
        programTier: mockTeam.programTier,
        primaryColor: mockTeam.primaryColor,
      },
      create: {
        id: mockTeam.id,
        name: mockTeam.name,
        slug: mockTeam.slug,
        abbreviation: mockTeam.abbreviation,
        conference: mockTeam.conference,
        programTier: mockTeam.programTier,
        primaryColor: mockTeam.primaryColor,
      },
    })

    // Season stats
    await prisma.teamSeasonStats.upsert({
      where: { teamId: team.id },
      update: { ...mockTeam.stats, titleProfileScore: mockTeam.titleProfileScore, upsetVulnerability: mockTeam.upsetVulnerability },
      create: {
        teamId: team.id,
        ...mockTeam.stats,
        titleProfileScore: mockTeam.titleProfileScore,
        upsetVulnerability: mockTeam.upsetVulnerability,
      },
    })

    // Recent form
    await prisma.teamRecentForm.upsert({
      where: { teamId: team.id },
      update: mockTeam.recentForm,
      create: { teamId: team.id, ...mockTeam.recentForm },
    })

    // Tournament team entry
    await prisma.tournamentTeam.upsert({
      where: { tournamentId_teamId: { tournamentId: tournament.id, teamId: team.id } },
      update: {},
      create: {
        tournamentId: tournament.id,
        teamId: team.id,
        seed: mockTeam.seed,
        region: mockTeam.region,
        isFirstFour: mockTeam.isFirstFour,
      },
    })

    teamCount++
  }
  console.log(`✓ Created/updated ${teamCount} teams`)

  // 3. Create R64 games with predictions
  const regions = ['South', 'East', 'West', 'Midwest'] as const
  const r64Pairings = [[1,16],[8,9],[5,12],[4,13],[6,11],[3,14],[7,10],[2,15]] as const

  let gameCount = 0
  for (const region of regions) {
    const regionTeams = ALL_TEAMS.filter(t => t.region === region && !t.isFirstFour)

    for (const [seed1, seed2] of r64Pairings) {
      const team1 = regionTeams.find(t => t.seed === seed1)
      const team2 = regionTeams.find(t => t.seed === seed2)
      if (!team1 || !team2) continue

      const pred = predictMatchup(team1, team2)

      const game = await prisma.game.upsert({
        where: { id: `r64_${region}_${seed1}v${seed2}` },
        update: {
          team1WinProb: pred.team1WinProb,
          team2WinProb: pred.team2WinProb,
          volatilityScore: pred.volatilityScore,
          upsetAlertTier: pred.upsetAlertTier,
          upsetAlertReasons: JSON.stringify(pred.upsetAlertReasons),
        },
        create: {
          id: `r64_${region}_${seed1}v${seed2}`,
          tournamentId: tournament.id,
          round: 1,
          roundName: 'Round of 64',
          region,
          bracketPosition: r64Pairings.findIndex(p => p[0] === seed1) + 1,
          team1Id: team1.id,
          team2Id: team2.id,
          team1Seed: seed1,
          team2Seed: seed2,
          team1WinProb: pred.team1WinProb,
          team2WinProb: pred.team2WinProb,
          volatilityScore: pred.volatilityScore,
          upsetAlertTier: pred.upsetAlertTier,
          upsetAlertReasons: JSON.stringify(pred.upsetAlertReasons),
        },
      })

      // Game prediction
      await prisma.gamePrediction.upsert({
        where: { gameId: game.id },
        update: {},
        create: {
          gameId: game.id,
          team1WinProb: pred.team1WinProb,
          team2WinProb: pred.team2WinProb,
          decidingFactors: JSON.stringify(pred.decidingFactors),
          confidenceTier: pred.confidenceTier,
          fallbackExplanation: `${team1.name} vs ${team2.name}: ${pred.confidenceTier} prediction.`,
        },
      })

      gameCount++
    }
  }
  console.log(`✓ Created ${gameCount} R64 games with predictions`)

  // 4. Historical team profiles
  let histCount = 0
  for (const candidate of HISTORICAL_TWIN_CANDIDATES) {
    await prisma.historicalTeamProfile.upsert({
      where: { id: candidate.id },
      update: {},
      create: {
        id: candidate.id,
        year: candidate.year,
        teamName: candidate.teamName,
        seed: candidate.seed,
        region: candidate.region,
        conference: 'Unknown',
        programTier: 'power',
        adjOE: candidate.adjOE,
        adjDE: candidate.adjDE,
        adjEM: candidate.adjEM,
        tempo: candidate.tempo,
        sosRank: candidate.kenpomRank,
        threePointRate: candidate.threePointRate,
        turnoverRate: candidate.turnoverRate,
        offReboundRate: candidate.offReboundRate,
        defReboundRate: 72.0,
        tournamentResult: candidate.tournamentResult,
        roundsWon: candidate.roundsWon,
        profileVector: JSON.stringify([candidate.seed, candidate.adjEM, candidate.adjDE, candidate.tempo, candidate.threePointRate]),
      },
    })
    histCount++
  }
  console.log(`✓ Created ${histCount} historical team profiles`)

  // 5. Default pool rule sets
  await prisma.poolRuleSet.upsert({
    where: { id: 'standard' },
    update: {},
    create: {
      id: 'standard',
      name: 'Standard (ESPN)',
      roundMultipliers: JSON.stringify({ '1': 1, '2': 2, '3': 4, '4': 8, '5': 16, '6': 32 }),
      upsetBonus: 0,
      seedBonus: 0,
      description: 'Points double each round. Most common pool format.',
    },
  })

  await prisma.poolRuleSet.upsert({
    where: { id: 'upset-bonus' },
    update: {},
    create: {
      id: 'upset-bonus',
      name: 'Upset Bonus',
      roundMultipliers: JSON.stringify({ '1': 1, '2': 2, '3': 4, '4': 8, '5': 16, '6': 32 }),
      upsetBonus: 5,
      seedBonus: 0,
      description: '+5 bonus points for each correct upset pick.',
    },
  })

  console.log('✓ Created pool rule sets')
  console.log('\n✅ Seed complete! MadnessLab database is ready.')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
