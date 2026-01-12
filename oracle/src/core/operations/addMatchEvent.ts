import { config } from '../../config';
import { GraphQLResponse, MatchEvent } from '../types';

export async function addMatchEvent(
    eventId: string,
    matchEvent: MatchEvent
): Promise<void> {
    const url = `${config.serviceUrl}/chains/${config.chainId}/applications/${config.appId}`;

    const mutation = `
        mutation(
            $eventId: String!, 
            $eventType: String!, 
            $time: String!, 
            $team: String!, 
            $player: String, 
            $detail: String, 
            $timestamp: String!
        ) {
            addMatchEvent(
                eventId: $eventId,
                eventType: $eventType,
                time: $time,
                team: $team,
                player: $player,
                detail: $detail,
                timestamp: $timestamp
            )
        }
    `;

    const variables = {
        eventId,
        eventType: matchEvent.event_type,
        time: matchEvent.time,
        team: matchEvent.team,
        player: matchEvent.player,
        detail: matchEvent.detail,
        timestamp: matchEvent.timestamp
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

        console.log(`✅ Added match event for ${eventId}: ${matchEvent.event_type} at ${matchEvent.time}'`);

    } catch (error) {
        console.error(`❌ Error adding match event for ${eventId}:`, error);
        throw error;
    }
}
