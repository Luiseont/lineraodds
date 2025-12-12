/**
 * Team logo mapping for major European football leagues
 * Maps team names to their API-Football team IDs
 * Logo URL format: https://media.api-sports.io/football/teams/{teamId}.png
 */

export interface TeamLogoMap {
    [teamName: string]: number
}

// Comprehensive mapping of team names to API-Football IDs
export const teamLogos: TeamLogoMap = {
    // La Liga (Spain)
    'Real Madrid': 541,
    'Barcelona': 529,
    'Atletico Madrid': 530,
    'Sevilla': 536,
    'Real Sociedad': 548,
    'Real Betis': 543,
    'Villarreal': 533,
    'Athletic Club': 531,
    'Valencia': 532,
    'Osasuna': 727,
    'Celta Vigo': 538,
    'Rayo Vallecano': 728,
    'Mallorca': 798,
    'Getafe': 546,
    'Girona': 547,
    'Las Palmas': 533,
    'Alaves': 542,
    'Cadiz': 724,
    'Almeria': 723,
    'Granada': 715,

    // Premier League (England)
    'Manchester City': 50,
    'Arsenal': 42,
    'Liverpool': 40,
    'Aston Villa': 66,
    'Tottenham': 47,
    'Chelsea': 49,
    'Newcastle': 34,
    'Manchester United': 33,
    'West Ham': 48,
    'Brighton': 51,
    'Wolves': 39,
    'Fulham': 36,
    'Bournemouth': 35,
    'Crystal Palace': 52,
    'Brentford': 55,
    'Everton': 45,
    'Nottingham Forest': 65,
    'Luton': 163,
    'Burnley': 44,
    'Sheffield United': 62,

    // Bundesliga (Germany)
    'Bayern Munich': 157,
    'Bayer Leverkusen': 168,
    'RB Leipzig': 173,
    'Borussia Dortmund': 165,
    'Union Berlin': 28,
    'SC Freiburg': 160,
    'Eintracht Frankfurt': 169,
    'Wolfsburg': 178,
    'Hoffenheim': 181,
    'Borussia Monchengladbach': 163,
    'Werder Bremen': 162,
    'Augsburg': 164,
    'VfB Stuttgart': 174,
    'Mainz': 164,
    'Heidenheim': 180,
    'Bochum': 172,
    'FC Koln': 161,
    'Darmstadt': 176,

    // Serie A (Italy)
    'Inter': 505,
    'Juventus': 496,
    'AC Milan': 489,
    'Atalanta': 499,
    'Roma': 497,
    'Lazio': 487,
    'Napoli': 492,
    'Fiorentina': 502,
    'Bologna': 500,
    'Torino': 503,
    'Monza': 1579,
    'Genoa': 495,
    'Lecce': 867,
    'Udinese': 494,
    'Cagliari': 490,
    'Empoli': 511,
    'Frosinone': 512,
    'Verona': 504,
    'Salernitana': 488,
    'Sassuolo': 498,

    // Ligue 1 (France)
    'PSG': 85,
    'Monaco': 91,
    'Brest': 96,
    'Lille': 79,
    'Nice': 81,
    'Lens': 116,
    'Marseille': 81,
    'Rennes': 94,
    'Lyon': 80,
    'Reims': 547,
    'Toulouse': 97,
    'Montpellier': 82,
    'Strasbourg': 83,
    'Nantes': 83,
    'Le Havre': 84,
    'Lorient': 99,
    'Metz': 545,
    'Clermont Foot': 99,
}

export const getTeamLogoUrl = (teamName: string): string => {
    const teamId = teamLogos[teamName]
    if (!teamId) {
        // Try to find a partial match (case-insensitive)
        const normalizedName = teamName.toLowerCase()
        const matchingKey = Object.keys(teamLogos).find(key =>
            key.toLowerCase().includes(normalizedName) || normalizedName.includes(key.toLowerCase())
        )

        if (matchingKey) {
            return `https://media.api-sports.io/football/teams/${teamLogos[matchingKey]}.png`
        }

        // Return default team logo if no match found
        return '/default-team-logo.svg'
    }

    return `https://media.api-sports.io/football/teams/${teamId}.png`
}

// Helper to get both home and away team logos
export const getTeamLogos = (homeTeam: string, awayTeam: string) => {
    return {
        home: getTeamLogoUrl(homeTeam),
        away: getTeamLogoUrl(awayTeam)
    }
}
