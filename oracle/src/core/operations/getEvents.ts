import { config } from '../../config';
import { GetEventsResponse } from '../types';

export async function getEvents() {
    const url = `${config.serviceUrl}/chains/${config.chainId}/applications/${config.appId}`;

    const query = `
        query {
            events {
                id
                status
                typeEvent
                league
                teams {
                    home
                    away
                }
                odds {
                    home
                    away
                    tie
                }
                startTime
                result {
                    winner
                    homeScore
                    awayScore
                }
                liveScore {
                    home
                    away
                    updatedAt
                }
                matchEvents {
                    eventType
                    time
                    team
                    player
                    detail
                    timestamp
                }
                lastUpdated
                currentMinute
            }
        }
    `;

    try {
        console.log('Querying events from contract...');

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const result: GetEventsResponse = await response.json() as GetEventsResponse;

        if (result.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }

        const events = result.data?.events || [];
        console.log(`Found ${events.length} events in contract`);
        return events.map(transformToEvent);

    } catch (error) {
        console.error('Error querying events:', error);
        throw error;
    }
}

// Transform GraphQL camelCase to Event snake_case
function transformToEvent(gqlEvent: any): any {
    return {
        id: gqlEvent.id,
        status: gqlEvent.status,
        type_event: gqlEvent.typeEvent,
        league: gqlEvent.league,
        teams: gqlEvent.teams,
        odds: gqlEvent.odds,
        start_time: gqlEvent.startTime,
        result: gqlEvent.result ? {
            winner: gqlEvent.result.winner,
            homeScore: gqlEvent.result.homeScore,
            awayScore: gqlEvent.result.awayScore
        } : { winner: '', homeScore: 0, awayScore: 0 },
        live_score: gqlEvent.liveScore,
        match_events: gqlEvent.matchEvents?.map((e: any) => ({
            event_type: e.eventType,
            time: e.time,
            team: e.team,
            player: e.player,
            detail: e.detail,
            timestamp: e.timestamp
        })) || [],
        last_updated: gqlEvent.lastUpdated,
        current_minute: gqlEvent.currentMinute
    };
}