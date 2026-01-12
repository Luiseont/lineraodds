import { config } from '../../config';
import { GraphQLResponse } from '../types';

export async function updateEventScore(
    eventId: string,
    homeScore: string,
    awayScore: string
): Promise<void> {
    const url = `${config.serviceUrl}/chains/${config.chainId}/applications/${config.appId}`;

    const mutation = `
        mutation($eventId: String!, $homeScore: String!, $awayScore: String!) {
            updateEventLiveScore(
                eventId: $eventId,
                homeScore: $homeScore,
                awayScore: $awayScore
            )
        }
    `;

    const variables = {
        eventId,
        homeScore,
        awayScore
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: mutation, variables }),
            signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const result: GraphQLResponse = await response.json() as GraphQLResponse;

        if (result.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }

        console.log(`✅ Updated score for event ${eventId}: ${homeScore}-${awayScore}`);

    } catch (error) {
        // Don't throw - log error but allow simulation to continue
        console.error(`❌ Error updating event score for ${eventId} (continuing simulation):`, error);
    }
}
