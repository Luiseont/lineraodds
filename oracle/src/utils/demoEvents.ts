import { Event, TypeEvent, MatchStatus } from '../core/types';

/**
 * Generates 5 demo events for testing purposes
 */
export function generateDemoEvents(): Event[] {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    const demoEvents: Event[] = [
        {
            id: `demo_${now}_1`,
            status: MatchStatus.Scheduled,
            type_event: TypeEvent.Football,
            league: 'La Liga',
            teams: {
                home: { id: 'team_barcelona', name: 'Barcelona' },
                away: { id: 'team_real_madrid', name: 'Real Madrid' }
            },
            odds: {
                home: 180,  // 1.80
                away: 220,  // 2.20
                tie: 320    // 3.20
            },
            start_time: (now + oneHour) as any,
            result: {
                winner: 'Home' as any,
                home_score: '0',
                away_score: '0'
            },
            live_score: {
                home: '0',
                away: '0',
                updated_at: now as any
            },
            match_events: [],
            last_updated: now as any
        },
        {
            id: `demo_${now}_2`,
            status: MatchStatus.Scheduled,
            type_event: TypeEvent.Football,
            league: 'Premier League',
            teams: {
                home: { id: 'team_man_city', name: 'Manchester City' },
                away: { id: 'team_liverpool', name: 'Liverpool' }
            },
            odds: {
                home: 190,
                away: 210,
                tie: 310
            },
            start_time: (now + oneHour * 2) as any,
            result: {
                winner: 'Home' as any,
                home_score: '0',
                away_score: '0'
            },
            live_score: {
                home: '0',
                away: '0',
                updated_at: now as any
            },
            match_events: [],
            last_updated: now as any
        },
        {
            id: `demo_${now}_3`,
            status: MatchStatus.Scheduled,
            type_event: TypeEvent.Football,
            league: 'Serie A',
            teams: {
                home: { id: 'team_juventus', name: 'Juventus' },
                away: { id: 'team_inter', name: 'Inter Milan' }
            },
            odds: {
                home: 200,
                away: 200,
                tie: 300
            },
            start_time: (now + oneHour * 3) as any,
            result: {
                winner: 'Home' as any,
                home_score: '0',
                away_score: '0'
            },
            live_score: {
                home: '0',
                away: '0',
                updated_at: now as any
            },
            match_events: [],
            last_updated: now as any
        },
        {
            id: `demo_${now}_4`,
            status: MatchStatus.Scheduled,
            type_event: TypeEvent.Football,
            league: 'Bundesliga',
            teams: {
                home: { id: 'team_bayern', name: 'Bayern Munich' },
                away: { id: 'team_dortmund', name: 'Borussia Dortmund' }
            },
            odds: {
                home: 170,
                away: 240,
                tie: 330
            },
            start_time: (now + oneHour * 4) as any,
            result: {
                winner: 'Home' as any,
                home_score: '0',
                away_score: '0'
            },
            live_score: {
                home: '0',
                away: '0',
                updated_at: now as any
            },
            match_events: [],
            last_updated: now as any
        },
        {
            id: `demo_${now}_5`,
            status: MatchStatus.Scheduled,
            type_event: TypeEvent.Football,
            league: 'Ligue 1',
            teams: {
                home: { id: 'team_psg', name: 'PSG' },
                away: { id: 'team_marseille', name: 'Marseille' }
            },
            odds: {
                home: 150,
                away: 280,
                tie: 350
            },
            start_time: (now + oneHour * 5) as any,
            result: {
                winner: 'Home' as any,
                home_score: '0',
                away_score: '0'
            },
            live_score: {
                home: '0',
                away: '0',
                updated_at: now as any
            },
            match_events: [],
            last_updated: now as any
        }
    ];

    return demoEvents;
}

/**
 * Creates 5 demo events in the contract
 */
export async function createDemoEvents(): Promise<void> {
    const { createEvent } = await import('../core/operations/createEvents');
    const events = generateDemoEvents();

    console.log('🎮 Creating 5 demo events...');

    for (const event of events) {
        try {
            await createEvent(event);
            console.log(`✅ Created: ${event.teams.home.name} vs ${event.teams.away.name}`);
        } catch (error) {
            console.error(`❌ Failed to create event ${event.id}:`, error);
        }
    }

    console.log('✅ Finished creating demo events');
}
