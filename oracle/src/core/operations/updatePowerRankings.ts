import { config } from '../../config';
import { updateTeamPower } from './updateTeamPower';

interface StandingResponse {
    response: Array<{
        league: {
            id: number;
            standings: Array<Array<{
                rank: number;
                team: {
                    id: number;
                    name: string;
                };
                form: string; // "WLWWW"
            }>>;
        };
    }>;
}

interface FixtureResponse {
    response: Array<{
        teams: {
            home: { id: number; winner: boolean | null };
            away: { id: number; winner: boolean | null };
        };
        goals: {
            home: number;
            away: number;
        };
    }>;
}

/**
 * Updates power rankings for all configured leagues
 */
export async function updateGlobalPowerRankings() {
    console.log('🌍 Starting Global Power Ranking Update...');

    const leagues = config.leagues;

    for (const league of leagues) {
        console.log(`📊 Processing league: ${league.name} (${league.id})`);
        try {
            await processLeague(league);
        } catch (error) {
            console.error(`❌ Error processing league ${league.name}:`, error);
        }
    }

    console.log('✅ Global Power Ranking Update Finished');
}

async function processLeague(league: { id: string; season: string }) {
    // 1. Fetch Standings (Rank & Form)
    const standingsUrl = `${config.api}/standings?league=${league.id}&season=${league.season}`;
    const standings = await fetchAPI<StandingResponse>(standingsUrl);

    if (!standings.response?.[0]?.league?.standings?.[0]) {
        console.warn(`⚠️ No standings found for league ${league.id}`);
        return;
    }

    const teams = standings.response[0].league.standings[0];

    for (const teamData of teams) {
        try {
            const teamId = teamData.team.id.toString();
            const teamName = teamData.team.name;
            const rank = teamData.rank;
            const formString = teamData.form; // e.g. "WLWWW"

            // 2. Fetch Last 5 Matches (Goal Average)
            const goalDiff = await fetchGoalDifference(teamId, league.id, league.season);

            // 3. Calculate Stats
            const power = calculateBasePower(rank);
            const formPoints = calculateFormPoints(formString);
            const goalAvgPoints = calculateGoalDiffPoints(goalDiff);

            // 4. Update Contract
            // console.log(`   Update: ${teamName} (${teamId}) -> Power: ${power}, Form: ${formPoints}, GD: ${goalAvgPoints} (Raw: ${goalDiff})`);

            await updateTeamPower(
                teamId,
                teamName,
                power,
                formPoints,
                goalAvgPoints
            );

            // Rate limit updates slightly
            await new Promise(r => setTimeout(r, 200));

        } catch (error) {
            console.error(`   ❌ Failed to update team ${teamData.team.name}:`, error);
        }
    }
}

export async function fetchGoalDifference(teamId: string, leagueId: string, season: string): Promise<number> {
    const url = `${config.api}/fixtures?league=${leagueId}&season=${season}&team=${teamId}&last=5`;
    const data = await fetchAPI<FixtureResponse>(url);

    let goalsFor = 0;
    let goalsAgainst = 0;

    data.response?.forEach(match => {
        const isHome = match.teams.home.id.toString() === teamId;
        if (isHome) {
            goalsFor += match.goals.home || 0;
            goalsAgainst += match.goals.away || 0;
        } else {
            goalsFor += match.goals.away || 0;
            goalsAgainst += match.goals.home || 0;
        }
    });

    return goalsFor - goalsAgainst;
}


// --- Calculation Helpers ---

export function calculateBasePower(rank: number): number {
    // Rank 1-4: 90-98 (Intocables)
    if (rank <= 4) return mapRange(rank, 1, 4, 98, 90);
    // Rank 5-7: 82-89 (Europa)
    if (rank <= 7) return mapRange(rank, 5, 7, 89, 82);
    // Rank 8-14: 70-80 (Mid Table)
    if (rank <= 14) return mapRange(rank, 8, 14, 80, 70);
    // Rank 15-17: 60-69 (Luchadores)
    if (rank <= 17) return mapRange(rank, 15, 17, 69, 60);
    // Rank 18-20: 50-59 (Descenso)
    return mapRange(rank, 18, 20, 59, 50);
}

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return Math.floor((value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin);
}

export function calculateFormPoints(form: string): number {
    if (!form) return 0;
    // +2 per W, -2 per L, 0 per D
    let points = 0;
    for (const char of form) {
        if (char === 'W') points += 2;
        if (char === 'L') points -= 2;
    }
    return points;
}

export function calculateGoalDiffPoints(gd: number): number {
    if (gd >= 8) return 5;
    if (gd >= 4) return 3;
    if (gd >= 1) return 1;
    if (gd === 0) return 0;
    if (gd >= -3) return -1; // -1 to -3
    if (gd >= -7) return -3; // -4 to -7
    return -5; // <= -8
}


// --- API Helper ---

export async function fetchAPI<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'x-apisports-key': config.apiKey,
            'x-rapidapi-host': 'v3.football.api-sports.io'
        }
    });

    if (!response.ok) {
        throw new Error(`API HTTP error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as T;
}
