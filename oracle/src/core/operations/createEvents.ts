import { config } from '../../config';
import { Event, GraphQLResponse } from '../types';

export async function createEvent(event: Event) {
    const url = `${config.serviceUrl}/chains/${config.chainId}/applications/${config.appId}`;

    const mutation = `
        mutation($id: String!, $typeEvent: String!, $league: String!, $home: String!, $away: String!, $homeOdds: Int!, $awayOdds: Int!, $tieOdds: Int!, $startTime: String!) {
            createEvent(
                id: $id,
                typeEvent: $typeEvent,
                league: $league,
                home: $home,
                away: $away,
                homeOdds: $homeOdds,
                awayOdds: $awayOdds,
                tieOdds: $tieOdds,
                startTime: $startTime
            )
        }
    `;

    const variables = {
        id: event.id,
        typeEvent: event.type_event,
        league: event.league,
        home: event.teams.home,
        away: event.teams.away,
        homeOdds: event.odds.home,
        awayOdds: event.odds.away,
        tieOdds: event.odds.tie,
        startTime: event.start_time
    };

    try {
        console.log(`Creating event: ${event.teams.home} vs ${event.teams.away}`);

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

        console.log(`✓ Event created successfully: ${event.id}`);
        return result;

    } catch (error) {
        console.error(`Error creating event ${event.id}:`, error);
        throw error;
    }
}