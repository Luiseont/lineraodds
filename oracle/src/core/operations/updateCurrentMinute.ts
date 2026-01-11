import { config } from '../../config';
import { GraphQLResponse } from '../types';

export async function updateCurrentMinute(
    eventId: string,
    currentMinute: number
): Promise<void> {
    const url = `${config.serviceUrl}/chains/${config.chainId}/applications/${config.appId}`;

    const mutation = `
        mutation($eventId: String!, $currentMinute: Int!) {
            updateCurrentMinute(
                eventId: $eventId,
                currentMinute: $currentMinute
            )
        }
    `;

    const variables = {
        eventId,
        currentMinute
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: mutation, variables })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const result: GraphQLResponse = await response.json() as GraphQLResponse;

        if (result.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }

        console.log(`⏱️  Updated current minute for event ${eventId}: ${currentMinute}'`);

    } catch (error) {
        // Don't throw - log error but allow simulation to continue
        console.error(`❌ Error updating current minute for ${eventId} (continuing simulation):`, error);
    }
}
