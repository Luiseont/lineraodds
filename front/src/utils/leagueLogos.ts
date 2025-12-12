/**
 * League logo mapping
 * Maps league names to their API-Football league IDs for logo retrieval
 * Logo URL format: https://media.api-sports.io/football/leagues/{leagueId}.png
 */

export interface LeagueLogoMap {
    [leagueName: string]: number
}

// Static mapping of league names to their API-Football IDs
export const leagueLogos: LeagueLogoMap = {
    'La Liga': 140,
    'Premier League': 39,
    'Bundesliga': 78,
    'Serie A': 135,
    'Ligue 1': 61
}

export const getLeagueLogoUrl = (leagueId: number): string => {
    return `https://media.api-sports.io/football/leagues/${leagueId}.png`
}

export const getLeagueLogoUrlByName = (leagueName: string): string => {
    const leagueId = leagueLogos[leagueName]
    if (!leagueId) {
        // Return default league logo if not found
        return '/default-league-logo.svg'
    }
    return getLeagueLogoUrl(leagueId)
}
