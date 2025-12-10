import { MatchStatus } from '../core/types';

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
    liveAt?: number;
    finishedAt?: number;
}
