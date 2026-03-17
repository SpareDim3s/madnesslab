import { NextResponse } from 'next/server'
import {
  SEED_MATCHUP_RECORDS,
  SEED_FINAL_FOUR_RATE,
  SEED_TITLE_RATE,
  HISTORICAL_CHAMPIONS,
  CONFERENCE_TOURNAMENT_STATS,
  ARCHETYPE_PERFORMANCES,
  HISTORICAL_TWIN_CANDIDATES,
} from '@/lib/historicalData'
import { ALL_TEAMS, getTopContenders } from '@/lib/mockData'

export async function GET() {
  const topContenders = getTopContenders(8)
  const upsetAlertTeams = ALL_TEAMS
    .filter(t => !t.isFirstFour && t.upsetVulnerability > 55 && t.seed <= 10)
    .sort((a, b) => b.upsetVulnerability - a.upsetVulnerability)
    .slice(0, 5)

  return NextResponse.json({
    seedMatchupRecords: SEED_MATCHUP_RECORDS,
    seedFinalFourRates: SEED_FINAL_FOUR_RATE,
    seedTitleRates: SEED_TITLE_RATE,
    historicalChampions: HISTORICAL_CHAMPIONS,
    conferenceStats: CONFERENCE_TOURNAMENT_STATS,
    archetypePerformances: ARCHETYPE_PERFORMANCES,
    historicalTwinCandidates: HISTORICAL_TWIN_CANDIDATES,
    currentTournament: {
      topContenders,
      upsetAlerts: upsetAlertTeams,
    },
    source: 'mock',
  })
}
