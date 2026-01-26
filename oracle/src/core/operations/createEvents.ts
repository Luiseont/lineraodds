import { config } from '../../config';
import { Event, GraphQLResponse } from '../types';

export async function createEvent(event: Event) {
    const url = `${config.serviceUrl}/chains/${config.chainId}/applications/${config.appId}`;

    const mutation = `
        mutation($id: String!, $typeEvent: String!, $league: String!, $homeId: String!, $awayId: String!, $startTime: String!) {
            createEvent(
                id: $id,
                typeEvent: $typeEvent,
                league: $league,
                homeId: $homeId,
                awayId: $awayId,
                startTime: $startTime
            )
        }
    `;

    const variables = {
        id: event.id,
        typeEvent: event.type_event,
        league: event.league,
        homeId: event.teams.home.id,
        awayId: event.teams.away.id,
        startTime: event.start_time
    };

    try {
        console.log(`Creating event: ${event.teams.home.name} vs ${event.teams.away.name}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: mutation,
                variables: variables
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

        console.log(`Event created successfully: ${event.id}`);

        // If demo mode, add event to simulator
        if (config.demoMode) {
            const { demoSimulator } = await import('../../index');
            if (demoSimulator) {
                // Use event.id as both eventId and fixtureId for demo purposes
                demoSimulator.addEvent(event.id, event.id);
                console.log(`Event ${event.id} added to demo simulator`);
            }
        }
        return result;

    } catch (error) {
        console.error(`Error creating event ${event.id}:`, error);
        throw error;
    }
}