import { MatchStatus, MatchEvent } from '../core/types';

export interface MonitoringJob {
    fixtureId: string;
    eventId: string;
    status: MatchStatus;
    lastChecked: number;
    pollInterval: number;
    retryCount: number;
    league: string;
}

export interface EventQueue {
    jobs: MonitoringJob[];
    lastUpdated: number;
}

export interface FixtureStatusResponse {
    response: Array<{
        fixture: {
            id: number;
            status: {
                short: string;
                long: string;
            };
        };
        goals: {
            home: number | null;
            away: number | null;
        };
        score: {
            fulltime: {
                home: number | null;
                away: number | null;
            };
        };
    }>;
}

export interface DemoEvent {
    eventId: string;
    fixtureId: string;
    status: MatchStatus;
    createdAt: number;
    startDelay: number;  // Random delay in ms before going live (30s - 5min)
    liveAt?: number;
    finishedAt?: number;
}

export interface MatchSimulation {
    eventId: string;
    matchMinute: number;
    homeScore: number;
    awayScore: number;
    lastSentHomeScore?: number;  // Track last sent score to avoid redundant updates
    lastSentAwayScore?: number;  // Track last sent score to avoid redundant updates
    lastEventCount: number;  // Track event count to detect when new events occur
    events: MatchEvent[];
    startedAt: number;
    interval?: any;  // NodeJS.Timeout - Single 30s interval for time-based simulation
}


