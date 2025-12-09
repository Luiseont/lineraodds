import { config } from '../config';
import { QueueManager } from './queueManager';
import { MonitoringJob, FixtureStatusResponse } from './types';
import { MatchStatus, Selection } from '../core/types';
import { updateEventStatus } from '../core/operations/updateEventStatus';
import { updateEventOdds } from '../core/operations/updateEventOdds';
import { resolveEvent } from '../core/operations/resolveEvent';
import { fetchRealOdds } from '../utils/fetchOdds';

export class EventMonitor {
    private queueManager: QueueManager;
    private isRunning: boolean = false;
    private checkInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.queueManager = new QueueManager();
    }

    start(): void {
        if (this.isRunning) {
            console.log('Event monitor already running');
            return;
        }

        this.isRunning = true;
        console.log('Starting event monitor...');

        // Check every 1 minute for jobs that need polling
        // This is just the check frequency, actual API calls depend on job intervals
        this.checkInterval = setInterval(() => {
            this.processJobs();
        }, 60000); // 1 minute

        console.log(`Event monitor started with ${this.queueManager.getJobCount()} jobs`);
    }

    stop(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isRunning = false;
        console.log('Event monitor stopped');
    }

    addEvent(fixtureId: string, eventId: string, league: string): void {
        this.queueManager.addJob(fixtureId, eventId, league);
    }

    private async processJobs(): Promise<void> {
        const jobs = this.queueManager.getJobsDueForCheck();

        if (jobs.length === 0) {
            return;
        }

        console.log(`Processing ${jobs.length} jobs...`);

        for (const job of jobs) {
            try {
                await this.checkFixtureStatus(job);
                this.queueManager.resetRetry(job.eventId);
            } catch (error) {
                console.error(`Error checking fixture ${job.fixtureId}:`, error);
                this.queueManager.incrementRetry(job.eventId);
            }
        }
    }

    private async checkFixtureStatus(job: MonitoringJob): Promise<void> {
        const apiKey = config.apiKey;
        const url = `${config.api}/fixtures?id=${job.fixtureId}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-apisports-key': apiKey,
                'x-rapidapi-host': 'v3.football.api-sports.io'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as FixtureStatusResponse;

        if (!data.response || data.response.length === 0) {
            throw new Error(`No data for fixture ${job.fixtureId}`);
        }

        const fixture = data.response[0];
        const newStatus = this.mapStatus(fixture.fixture.status.short);

        // Check if status changed
        if (newStatus !== job.status) {
            console.log(`Status changed for event ${job.eventId}: ${job.status} → ${newStatus}`);

            await updateEventStatus(job.eventId, newStatus);
            this.queueManager.updateJobStatus(job.eventId, newStatus);

            // If finished, resolve the event
            if (newStatus === MatchStatus.Finished) {
                await this.resolveFinishedEvent(job, fixture);
                this.queueManager.removeJob(job.eventId);
            }
        }

        // Update odds if event is live
        if (newStatus === MatchStatus.Live) {
            try {
                const odds = await fetchRealOdds(job.fixtureId);
                await updateEventOdds(job.eventId, odds.home, odds.away, odds.tie);
            } catch (error) {
                console.error(`Error updating odds for ${job.eventId}:`, error);
            }
        }
    }

    private async resolveFinishedEvent(job: MonitoringJob, fixture: any): Promise<void> {
        const homeScore = fixture.score.fulltime.home?.toString() || '0';
        const awayScore = fixture.score.fulltime.away?.toString() || '0';

        let winner: Selection;
        if (homeScore > awayScore) {
            winner = Selection.Home;
        } else if (awayScore > homeScore) {
            winner = Selection.Away;
        } else {
            winner = Selection.Tie;
        }

        await resolveEvent(job.eventId, winner, homeScore, awayScore);
        console.log(`Event ${job.eventId} resolved: ${winner} (${homeScore}-${awayScore})`);
    }

    private mapStatus(statusCode: string): MatchStatus {
        switch (statusCode) {
            case 'NS':
            case 'TBD':
                return MatchStatus.Scheduled;
            case '1H':
            case 'HT':
            case '2H':
            case 'ET':
            case 'P':
                return MatchStatus.Live;
            case 'FT':
            case 'AET':
            case 'PEN':
                return MatchStatus.Finished;
            case 'PST':
            case 'CANC':
            case 'ABD':
                return MatchStatus.Postponed;
            default:
                return MatchStatus.Scheduled;
        }
    }

    getStatus(): { running: boolean; jobCount: number } {
        return {
            running: this.isRunning,
            jobCount: this.queueManager.getJobCount()
        };
    }
}
