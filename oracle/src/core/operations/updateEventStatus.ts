import { config } from '../../config';
import { MatchStatus, GraphQLResponse } from '../types';

export async function updateEventStatus(eventId: string, status: MatchStatus): Promise<void> {
    const url = `${config.serviceUrl}/chains/${config.chainId}/applications/${config.appId}`;

    const statusString = status.toString();

    const mutation = `
        mutation($eventId: String!, $status: String!) {
            updateEventStatus(
                eventId: $eventId,
                status: $status
            )
        }
    `;

    const variables = {
        eventId,
        status: statusString
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

        console.log(`Updated event ${eventId} status to ${statusString}`);

    } catch (error) {
        console.error(`Error updating event status for ${eventId}:`, error);
        throw error;
    }
}
