import { MatchStatus, Selection } from '../core/types';
import { updateEventStatus } from '../core/operations/updateEventStatus';
import { updateEventOdds } from '../core/operations/updateEventOdds';
import { resolveEvent } from '../core/operations/resolveEvent';
import { DemoEvent } from './types';

export class DemoEventSimulator {
    private events: Map<string, DemoEvent> = new Map();
    private checkInterval: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;

    start(): void {
        if (this.isRunning) {
            console.log('🎮 Demo event simulator already running');
            return;
        }

        this.isRunning = true;
        console.log('🎮 Starting demo event simulator...');

        // Check every 30 seconds for events that need to transition
        this.checkInterval = setInterval(() => {
            this.processEvents();
        }, 30000); // 30 seconds

        console.log('🎮 Demo event simulator started');
    }

    stop(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isRunning = false;
        console.log('🎮 Demo event simulator stopped');
    }

    addEvent(eventId: string, fixtureId: string): void {
        const event: DemoEvent = {
            eventId,
            fixtureId,
            status: MatchStatus.Scheduled,
            createdAt: Date.now(),
        };

        this.events.set(eventId, event);
        console.log(`🎮 Added event ${eventId} to demo simulator`);
    }

    private async processEvents(): Promise<void> {
        const now = Date.now();

        for (const [eventId, event] of this.events.entries()) {
            try {
                if (event.status === MatchStatus.Scheduled) {
                    await this.checkScheduledToLive(event, now);
                } else if (event.status === MatchStatus.Live) {
                    await this.checkLiveToFinished(event, now);
                }
            } catch (error) {
                console.error(`🎮 Error processing demo event ${eventId}:`, error);
            }
        }
    }

    private async checkScheduledToLive(event: DemoEvent, now: number): Promise<void> {
        // Random interval between 3-8 minutes (180000-480000 ms)
        const minInterval = 3 * 60 * 1000;
        const maxInterval = 8 * 60 * 1000;
        const randomInterval = Math.random() * (maxInterval - minInterval) + minInterval;

        const elapsed = now - event.createdAt;

        if (elapsed >= randomInterval) {
            console.log(`Event ${event.eventId} transitioning: scheduled → live`);

            await updateEventStatus(event.eventId, MatchStatus.Live);

            event.status = MatchStatus.Live;
            event.liveAt = now;
            this.events.set(event.eventId, event);
        }
    }

    private async checkLiveToFinished(event: DemoEvent, now: number): Promise<void> {
        if (!event.liveAt) return;

        // Random interval between 3-8 minutes (180000-480000 ms)
        const minInterval = 3 * 60 * 1000;
        const maxInterval = 8 * 60 * 1000;
        const randomInterval = Math.random() * (maxInterval - minInterval) + minInterval;

        const elapsed = now - event.liveAt;

        if (elapsed >= randomInterval) {
            console.log(`Event ${event.eventId} transitioning: live → finished`);

            // Generate random winner
            const winners = [Selection.Home, Selection.Away, Selection.Tie];
            const winner = winners[Math.floor(Math.random() * winners.length)];

            // Generate realistic score based on winner
            const { homeScore, awayScore } = this.generateRandomScore(winner);

            await resolveEvent(event.eventId, winner, homeScore, awayScore);

            console.log(`Event ${event.eventId} resolved: ${winner} (${homeScore}-${awayScore})`);

            // Remove from tracking
            this.events.delete(event.eventId);
        }
    }

    private generateRandomScore(winner: Selection): { homeScore: string; awayScore: string } {
        // Generate realistic football scores (0-5 goals)
        let homeScore: number;
        let awayScore: number;

        if (winner === Selection.Home) {
            homeScore = Math.floor(Math.random() * 3) + 2; // 2-4 goals
            awayScore = Math.floor(Math.random() * homeScore); // 0 to homeScore-1
        } else if (winner === Selection.Away) {
            awayScore = Math.floor(Math.random() * 3) + 2; // 2-4 goals
            homeScore = Math.floor(Math.random() * awayScore); // 0 to awayScore-1
        } else {
            // Tie
            const score = Math.floor(Math.random() * 4); // 0-3
            homeScore = score;
            awayScore = score;
        }

        return {
            homeScore: homeScore.toString(),
            awayScore: awayScore.toString(),
        };
    }

    getStatus(): { running: boolean; eventCount: number } {
        return {
            running: this.isRunning,
            eventCount: this.events.size,
        };
    }
}
