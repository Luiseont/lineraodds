import { config } from '../../config';
import { GraphQLResponse } from '../types';

export async function updateEventOdds(
    eventId: string,
    homeOdds: number,
    awayOdds: number,
    tieOdds: number
): Promise<void> {
    const url = `${config.serviceUrl}/chains/${config.chainId}/applications/${config.appId}`;

    const mutation = `
        mutation($eventId: String!, $homeOdds: Int!, $awayOdds: Int!, $tieOdds: Int!) {
            updateEventOdds(
                eventId: $eventId,
                homeOdds: $homeOdds,
                awayOdds: $awayOdds,
                tieOdds: $tieOdds
            )
        }
    `;

    const variables = {
        eventId,
        homeOdds,
        awayOdds,
        tieOdds
    };

    try {
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

        const result: GraphQLResponse = await response.json() as GraphQLResponse;

        if (result.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }

        console.log(`Updated odds for event ${eventId}`);

    } catch (error) {
        console.error(`Error updating event odds for ${eventId}:`, error);
        throw error;
    }
}
