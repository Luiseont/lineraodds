import { getEvents } from './getEvents';
import { getTeams } from './getTeams';
import { updateTeamPower } from './updateTeamPower';
import { Selection } from '../types';
import { config } from '../../config';
import {
    fetchGoalDifference,
    calculateBasePower,
    calculateFormPoints,
    calculateGoalDiffPoints,
    fetchAPI
} from './updatePowerRankings';

export async function updatePowerAfterMatch(
    eventId: string,
    winner: Selection,
    homeScore: string,
    awayScore: string
) {
    try {
        console.log(`Recalculating Power Ranking for Event ${eventId}...`);

        // 1. Get Event to find Team IDs
        const events = await getEvents();
        const event = events.find(e => e.id === eventId);

        if (!event) {
            console.error(`Event ${eventId} not found for power update.`);
            return;
        }

        const homeId = event.teams.home.id;
        const awayId = event.teams.away.id;

        // 2. Get Current Team Stats
        const teams = await getTeams();
        const homeTeam = teams.find(t => t.id === homeId);
        const awayTeam = teams.find(t => t.id === awayId);

        if (!homeTeam || !awayTeam) {
            console.error(`Teams not found for power update: Home ${homeId}, Away ${awayId}`);
            return;
        }

        const hScore = parseInt(homeScore);
        const aScore = parseInt(awayScore);

        // 3. Calculate New Stats

        let newHome = { ...homeTeam };
        let newAway = { ...awayTeam };

        if (!config.demoMode) {
            console.log("Production Mode: Fetching real data from API...");

            // Find League Configuration
            // event.league is the name (e.g. "Premier League")
            const leagueConfig = config.leagues.find(l => l.name === event.league);

            if (!leagueConfig) {
                console.warn(`League '${event.league}' not configured. Skipping API update.`);
                return;
            }

            // Fetch Standings for the whole league to get Rank & Form
            const standingsUrl = `${config.api}/standings?league=${leagueConfig.id}&season=${leagueConfig.season}`;
            // We need to define the response type locally or import it if exported. 
            // For brevity, using any or redeclaring minimal interface
            const standingsResponse = await fetchAPI<any>(standingsUrl);
            const standings = standingsResponse.response?.[0]?.league?.standings?.[0];

            if (!standings) {
                console.warn(`No standings found for league ${leagueConfig.id}`);
                return;
            }

            // Helper to process a single team
            const processRealTeamData = async (teamId: string, currentTeam: any) => {
                const teamData = standings.find((s: any) => s.team.id.toString() === teamId);
                if (!teamData) {
                    console.warn(`Team ${teamId} not found in standings.`);
                    return currentTeam;
                }

                const rank = teamData.rank;
                const formString = teamData.form;

                // Fetch Goal Difference (last 5 matches)
                const goalDiff = await fetchGoalDifference(teamId, leagueConfig.id, leagueConfig.season);

                return {
                    ...currentTeam,
                    power: calculateBasePower(rank), // Recalculate based on real rank
                    form: calculateFormPoints(formString), // Recalculate based on real form
                    goal_average: calculateGoalDiffPoints(goalDiff) // Recalculate based on real goal diff
                };
            };

            // Update Home
            newHome = await processRealTeamData(homeId, homeTeam);
            // Update Away
            newAway = await processRealTeamData(awayId, awayTeam);

        } else {
            console.log("Demo Mode: Simulating power updates...");

            // Rules:
            // Power: Win (+3), Loss (-3), Tie (0)
            // Form: Win (+2), Loss (-2), Tie (0)
            // Goal Avg: + Diff

            let hPowerDelta = 0;
            let aPowerDelta = 0;
            let hFormDelta = 0;
            let aFormDelta = 0;

            if (winner === Selection.Home) {
                hPowerDelta = 3;
                aPowerDelta = -3;
                hFormDelta = 2;
                aFormDelta = -2;
            } else if (winner === Selection.Away) {
                hPowerDelta = -3;
                aPowerDelta = 3;
                hFormDelta = -2;
                aFormDelta = 2;
            } else {
                // Tie
                hPowerDelta = 0;
                aPowerDelta = 0;
                hFormDelta = 0;
                aFormDelta = 0;
            }

            // Apply Updates
            newHome = {
                ...homeTeam,
                power: Math.max(0, (homeTeam.power || 0) + hPowerDelta),
                form: (homeTeam.form || 0) + hFormDelta,
                goal_average: (homeTeam.goal_average || 0) + (Number(homeScore) - Number(awayScore))
            };

            newAway = {
                ...awayTeam,
                power: Math.max(0, (awayTeam.power || 0) + aPowerDelta),
                form: (awayTeam.form || 0) + aFormDelta,
                goal_average: (awayTeam.goal_average || 0) + (Number(awayScore) - Number(homeScore))
            };
        }

        console.log(`${newHome.name}: Power ${homeTeam.power}->${newHome.power}, Form ${homeTeam.form}->${newHome.form}, GD ${homeTeam.goal_average}->${newHome.goal_average}`);
        console.log(`${newAway.name}: Power ${awayTeam.power}->${newAway.power}, Form ${awayTeam.form}->${newAway.form}, GD ${awayTeam.goal_average}->${newAway.goal_average}`);

        // 4. Update Contract
        await updateTeamPower(
            newHome.id,
            newHome.name,
            newHome.power,
            newHome.form,
            newHome.goal_average
        );

        await updateTeamPower(
            newAway.id,
            newAway.name,
            newAway.power,
            newAway.form,
            newAway.goal_average
        );

        console.log(`Power Ranking updated for ${homeTeam.name} and ${awayTeam.name}`);

    } catch (error) {
        console.error(`Error updating power after match:`, error);
        // Don't throw, we don't want to break the resolveEvent flow if this aux task fails
    }
}
