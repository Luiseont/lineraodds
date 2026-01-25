import { config } from '../../config';
import { getWeekNumber } from '../../utils/getWeekNumber';
import { checkExistingLeaderboard } from './checkExistingLeaderboard';

interface GraphQLResponse {
    data?: any;
    errors?: Array<{ message: string }>;
}

/**
 * Start a new leaderboard week
 * Calls the StartNewWeek operation on the contract
 * Checks if week already exists to prevent overwriting on oracle restart
 */
export async function startLeaderboardWeek(): Promise<void> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentWeek = getWeekNumber(now);
    const prizePool = config.leaderboardPrizePool;

    // Check if leaderboard already exists for current week
    const existing = await checkExistingLeaderboard();
    if (existing && existing.week === currentWeek && existing.year === currentYear) {
        console.log(`Leaderboard for week ${currentYear}-${currentWeek} already exists, skipping initialization`);
        return;
    }

    const url = `${config.serviceUrl}/chains/${config.chainId}/applications/${config.appId}`;
    console.log(`Calling GraphQL endpoint: ${url}`);
    const mutation = `
        mutation($week: Int!, $year: Int!, $prizePool: Amount!) {
            startNewWeek(
                week: $week,
                year: $year,
                prizePool: $prizePool
            )
        }
    `;

    const variables = {
        week: currentWeek,
        year: currentYear,
        prizePool
    };

    try {
        console.log(`Starting leaderboard week ${currentYear}-${currentWeek} with prize pool ${prizePool}...`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: mutation,
                variables
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const result = await response.json() as GraphQLResponse;

        if (result.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }

        console.log(`Leaderboard week ${currentYear}-${currentWeek} started successfully`);
    } catch (error) {
        console.error(`Error starting leaderboard week:`, error);
        throw error;
    }
}

