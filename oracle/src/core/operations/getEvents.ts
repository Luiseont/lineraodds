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
        return events;

    } catch (error) {
        console.error('Error querying events:', error);
        throw error;
    }
}