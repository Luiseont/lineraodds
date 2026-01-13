import { config } from '../config';
import { Event } from './types';
import { transformFixtureToEvent } from '../utils/transformFixture';

interface LeagueConfig {
    id: string;
    name: string;
    season: string;
}

interface APIFootballResponse {
    response: any[];  // Array of fixture objects
    results: number;
}

export async function getNextEvents() {
    const apiKey = config.apiKey;
    const currentYear = '2025';//new Date().getFullYear().toString();

    console.log('Checking existing SCHEDULED events...');
    const { getEvents } = await import('./operations/getEvents');

    let initialScheduledCount = 0;
    let existingEvents: any[] = []; // Declare outside try block for later use
    const MAX_SCHEDULED_EVENTS = 10;

    try {
        existingEvents = await getEvents();
        const scheduledEvents = existingEvents.filter(
            (event: any) => event.status.toUpperCase() === 'SCHEDULED'
        );

        initialScheduledCount = scheduledEvents.length;
        console.log(`Found ${initialScheduledCount} SCHEDULED events in contract`);

        const eventsNeeded = MAX_SCHEDULED_EVENTS - initialScheduledCount;

        if (eventsNeeded <= 0) {
            console.log(`Already have ${initialScheduledCount} SCHEDULED events (max: ${MAX_SCHEDULED_EVENTS})`);
            return [];
        }

        console.log(`Need ${eventsNeeded} more events to reach ${MAX_SCHEDULED_EVENTS}`);

    } catch (error) {
        console.error('Error checking existing events:', error);
    }

    // Configuración de ligas a consultar
    const leagues: LeagueConfig[] = [
        { id: '140', name: 'La Liga', season: currentYear },      // España
        { id: '39', name: 'Premier League', season: currentYear }, // Inglaterra
        { id: '78', name: 'Bundesliga', season: currentYear },    // Alemania
        { id: '135', name: 'Serie A', season: currentYear },      // Italia
        { id: '61', name: 'Ligue 1', season: currentYear }        // Francia
    ];

    console.log('Fetching upcoming fixtures from API-Sports...');

    const allFixtures = [];

    try {
        for (const league of leagues) {
            console.log(`Fetching fixtures for ${league.name}...`);

            // Construir URL con parámetros
            const url = `${config.api}/fixtures?league=${league.id}&season=${league.season}&next=36`;
            //const url = `${config.api}/fixtures?league=${league.id}&season=${league.season}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-apisports-key': apiKey,
                    'x-rapidapi-host': 'v3.football.api-sports.io'
                }
            });

            if (!response.ok) {
                console.error(`HTTP error for ${league.name}! status: ${response.status}`);
                continue;
            }

            const data = await response.json() as APIFootballResponse;

            if (data.response && data.response.length > 0) {
                console.log(`Found ${data.response.length} fixtures for ${league.name}`);
                allFixtures.push({
                    league: league.name,
                    leagueId: league.id,
                    fixtures: data.response
                });
            } else {
                console.log(`No fixtures found for ${league.name}`);
            }

            // Rate limiting: esperar 1 segundo entre requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Combinar todos los fixtures en un solo array
        const allFixturesFlat = allFixtures.flatMap(league =>
            league.fixtures.map(fixture => ({
                ...fixture,
                leagueName: league.league,
                leagueId: league.leagueId
            }))
        );

        // Seleccionar aleatoriamente 10 fixtures
        const shuffled = allFixturesFlat.sort(() => 0.5 - Math.random());
        const selectedFixtures = shuffled.slice(0, 10);

        console.log(`Total fixtures fetched: ${allFixturesFlat.length}`);
        console.log(`Selected ${selectedFixtures.length} random fixtures`);

        // Transformar fixtures a tipo Event (con fetch de odds en paralelo)
        console.log('Fetching odds for selected fixtures...');
        const events: Event[] = await Promise.all(
            selectedFixtures.map(fixture =>
                transformFixtureToEvent(fixture, fixture.leagueName)
            )
        );

        console.log('Transformed events:', events);

        const eventsToCreate = MAX_SCHEDULED_EVENTS - initialScheduledCount;

        if (eventsToCreate <= 0) {
            console.log('No events needed');
            return events;
        }

        // Create a Set of existing event IDs to prevent duplicates
        const existingEventIds = new Set(existingEvents.map((e: any) => e.id));

        // Filter out events that already exist
        const newEvents = events.filter(event => !existingEventIds.has(event.id));
        const duplicateCount = events.length - newEvents.length;

        if (duplicateCount > 0) {
            const duplicateIds = events
                .filter(event => existingEventIds.has(event.id))
                .map(e => e.id)
                .join(', ');
            console.log(`🔍 Filtered out ${duplicateCount} duplicate event(s) (IDs: ${duplicateIds})`);
        }

        const { createEvent } = await import('./operations/createEvents');
        const eventsToSubmit = newEvents.slice(0, eventsToCreate);
        console.log(`Creating ${eventsToSubmit.length} events in Linera contract...`);

        // Import global event monitor
        const { eventMonitor } = await import('../index');

        for (const event of eventsToSubmit) {
            try {
                await createEvent(event);
                console.log(`✅ Created event: ${event.teams.home} vs ${event.teams.away}`);

                // Add to global monitor if it exists
                if (eventMonitor) {
                    eventMonitor.addEvent(event.id, event.id, event.league);
                    console.log(`🔍 Added event ${event.id} to monitor`);
                }
            } catch (error) {
                console.error(`Failed to create event ${event.id}:`, error);
            }
        }

        console.log(`Finished creating ${eventsToSubmit.length} events`);

        // In demo mode, reload events in simulator to pick up newly created events
        if (config.demoMode) {
            const { demoSimulator } = await import('../index');
            if (demoSimulator) {
                await demoSimulator.loadExistingEvents();
                console.log('🔄 Reloaded events in demo simulator');
            }
        }

        return events;

    } catch (error) {
        console.error('Error fetching fixtures:', error);
        throw error;
    }
}