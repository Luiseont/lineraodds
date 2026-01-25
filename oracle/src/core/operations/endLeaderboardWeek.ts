import { config } from '../../config';
import { getWeekNumber } from '../../utils/getWeekNumber';

interface GraphQLResponse {
    data?: any;
    errors?: Array<{ message: string }>;
}

/**
 * End the current leaderboard week
 * Calls the EndCurrentWeek operation on the contract
 * This will calculate winners and distribute prizes
 */
export async function endLeaderboardWeek(): Promise<void> {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);

    const url = `${config.serviceUrl}/chains/${config.chainId}/applications/${config.appId}`;

    const mutation = `
        mutation($week: Int!, $year: Int!) {
            endCurrentWeek(
                week: $week,
                year: $year
            )
        }
    `;

    const variables = {
        week,
        year
    };

    try {
        console.log(`🏁 Ending leaderboard week ${year}-${week}...`);

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

        console.log(`✅ Leaderboard week ${year}-${week} ended successfully`);
        console.log(`🏆 Winners calculated and prizes distributed`);
    } catch (error) {
        console.error(`❌ Error ending leaderboard week:`, error);
        throw error;
    }
}
