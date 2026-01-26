import { config } from '../../config';
import { Selection, GraphQLResponse } from '../types';
import { updatePowerAfterMatch } from './updatePowerAfterMatch';

export async function resolveEvent(
    eventId: string,
    winner: Selection,
    homeScore: string,
    awayScore: string
): Promise<void> {
    const url = `${config.serviceUrl}/chains/${config.chainId}/applications/${config.appId}`;

    const winnerString = winner.toString();

    const mutation = `
        mutation($eventId: String!, $winner: String!, $homeScore: String!, $awayScore: String!) {
            resolveEvent(
                eventId: $eventId,
                winner: $winner,
                homeScore: $homeScore,
                awayScore: $awayScore
            )
        }
    `;

    const variables = {
        eventId,
        winner: winnerString,
        homeScore,
        awayScore
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

        console.log(`Resolved event ${eventId}: ${winnerString} (${homeScore}-${awayScore})`);

        // Recalculate power rankings for involved teams
        await updatePowerAfterMatch(eventId, winner, homeScore, awayScore);

    } catch (error) {
        console.error(`Error resolving event ${eventId}:`, error);
        throw error;
    }
}
