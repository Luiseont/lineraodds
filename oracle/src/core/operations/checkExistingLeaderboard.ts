import { config } from '../../config';

interface GraphQLResponse {
    data?: any;
    errors?: Array<{ message: string }>;
}

/**
 * Check if leaderboard already exists for current week
 * @returns Object with week and year if exists, null otherwise
 */
export async function checkExistingLeaderboard(): Promise<{ week: number; year: number } | null> {
    const url = `${config.serviceUrl}/chains/${config.chainId}/applications/${config.appId}`;

    const query = `
        query {
            leaderboard {
                week
                year
            }
        }
    `;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            return null;
        }

        const result = await response.json() as GraphQLResponse;

        if (result.errors || !result.data?.leaderboard) {
            return null;
        }

        return {
            week: result.data.leaderboard.week,
            year: result.data.leaderboard.year
        };
    } catch (error) {
        console.error('Error checking existing leaderboard:', error);
        throw error;
    }
}
