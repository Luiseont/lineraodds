import fs from 'fs';
import path from 'path';
import { EventQueue, MonitoringJob } from './types';
import { MatchStatus } from '../core/types';

const QUEUE_FILE = '/root/.config/linera/event_queue.json';

const POLL_INTERVAL_SCHEDULED = 5 * 60 * 1000; // 5 minutes (288 requests/day per event)
const POLL_INTERVAL_LIVE = 2 * 60 * 1000;      // 2 minutes (720 requests/day per event)


export class QueueManager {
    private queue: EventQueue;

    constructor() {
        this.queue = this.loadQueue();
    }

    private loadQueue(): EventQueue {
        try {
            if (fs.existsSync(QUEUE_FILE)) {
                const data = fs.readFileSync(QUEUE_FILE, 'utf-8');
                const loaded = JSON.parse(data) as EventQueue;
                console.log(`Loaded ${loaded.jobs.length} monitoring jobs from disk`);
                return loaded;
            }
        } catch (error) {
            console.error('Error loading queue from disk:', error);
        }

        return {
            jobs: [],
            lastUpdated: Date.now()
        };
    }

    private saveQueue(): void {
        try {
            const dir = path.dirname(QUEUE_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            this.queue.lastUpdated = Date.now();
            fs.writeFileSync(QUEUE_FILE, JSON.stringify(this.queue, null, 2));
        } catch (error) {
            console.error('Error saving queue to disk:', error);
        }
    }

    addJob(fixtureId: string, eventId: string, league: string): void {
        // Check if job already exists
        const exists = this.queue.jobs.some(job => job.eventId === eventId);
        if (exists) {
            console.log(`Job for event ${eventId} already exists`);
            return;
        }

        const job: MonitoringJob = {
            fixtureId,
            eventId,
            status: MatchStatus.Scheduled,
            lastChecked: Date.now(),
            pollInterval: POLL_INTERVAL_SCHEDULED,
            retryCount: 0,
            league
        };

        this.queue.jobs.push(job);
        this.saveQueue();
        console.log(`Added monitoring job for event ${eventId} (fixture ${fixtureId})`);
    }

    removeJob(eventId: string): void {
        const initialLength = this.queue.jobs.length;
        this.queue.jobs = this.queue.jobs.filter(job => job.eventId !== eventId);

        if (this.queue.jobs.length < initialLength) {
            this.saveQueue();
            console.log(`Removed monitoring job for event ${eventId}`);
        }
    }

    updateJobStatus(eventId: string, status: MatchStatus): void {
        const job = this.queue.jobs.find(j => j.eventId === eventId);
        if (job) {
            job.status = status;
            job.lastChecked = Date.now();

            // Adjust poll interval based on status
            if (status === MatchStatus.Live) {
                job.pollInterval = POLL_INTERVAL_LIVE;
            } else if (status === MatchStatus.Scheduled) {
                job.pollInterval = POLL_INTERVAL_SCHEDULED;
            }

            this.saveQueue();
        }
    }

    incrementRetry(eventId: string): void {
        const job = this.queue.jobs.find(j => j.eventId === eventId);
        if (job) {
            job.retryCount++;
            this.saveQueue();
        }
    }

    resetRetry(eventId: string): void {
        const job = this.queue.jobs.find(j => j.eventId === eventId);
        if (job) {
            job.retryCount = 0;
            this.saveQueue();
        }
    }

    getJobsDueForCheck(): MonitoringJob[] {
        const now = Date.now();
        return this.queue.jobs.filter(job => {
            // Don't check finished or postponed events
            if (job.status === MatchStatus.Finished || job.status === MatchStatus.Postponed) {
                return false;
            }

            // Remove jobs with too many retries
            if (job.retryCount >= 10) {
                console.warn(`Removing job ${job.eventId} due to max retries`);
                this.removeJob(job.eventId);
                return false;
            }

            // Check if enough time has passed since last check
            return (now - job.lastChecked) >= job.pollInterval;
        });
    }

    getAllJobs(): MonitoringJob[] {
        return [...this.queue.jobs];
    }

    getJobCount(): number {
        return this.queue.jobs.length;
    }
}
