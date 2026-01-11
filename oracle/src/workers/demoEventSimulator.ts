import { MatchStatus, Selection, MatchEventType, MatchEvent } from '../core/types';
import { updateEventStatus } from '../core/operations/updateEventStatus';
import { updateEventScore } from '../core/operations/updateEventScore';
import { addMatchEvent } from '../core/operations/addMatchEvent';
import { resolveEvent } from '../core/operations/resolveEvent';
import { DemoEvent, MatchSimulation } from './types';
import { getEvents } from '../core/operations/getEvents';

export class DemoEventSimulator {
    private events: Map<string, DemoEvent> = new Map();
    private liveMatches: Map<string, MatchSimulation> = new Map();
    private checkInterval: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;

    // Configuración de tiempo: 1 minuto real = 10 minutos de partido
    private readonly MATCH_DURATION_MINUTES = 90;
    private readonly REAL_TIME_PER_MATCH_MINUTE = 6000; // 6 segundos reales = 1 minuto partido
    private readonly TOTAL_MATCH_DURATION = this.MATCH_DURATION_MINUTES * this.REAL_TIME_PER_MATCH_MINUTE; // 9 minutos

    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('🎮 Demo event simulator already running');
            return;
        }

        this.isRunning = true;
        console.log('🎮 Starting demo event simulator with live score updates...');

        // Load existing events from the contract
        await this.loadExistingEvents();

        // Check every 30 seconds for events that need to transition
        this.checkInterval = setInterval(() => {
            this.processEvents();
        }, 30000); // 30 seconds

        console.log('✅ Demo event simulator started');
    }

    stop(): void {
        console.log('⏹️  Stopping demo event simulator...');

        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        // Stop all live match simulations
        let stoppedCount = 0;
        for (const [eventId, simulation] of this.liveMatches) {
            if (simulation.interval) {
                clearInterval(simulation.interval);
                simulation.interval = undefined;
                stoppedCount++;
                console.log(`  ✅ Stopped simulation for event ${eventId}`);
            }
        }

        this.liveMatches.clear();
        this.events.clear();

        this.isRunning = false;
        console.log(`✅ Demo event simulator stopped (${stoppedCount} active simulations terminated)`);
    }

    addEvent(eventId: string, fixtureId: string): void {
        const event: DemoEvent = {
            eventId,
            fixtureId,
            status: MatchStatus.Scheduled,
            createdAt: Date.now(),
        };

        this.events.set(eventId, event);
        console.log(`📝 Added event ${eventId} to demo simulator`);
    }

    private async loadExistingEvents(): Promise<void> {
        try {
            console.log('📂 Loading existing events...');
            const existingEvents = await getEvents();

            if (!existingEvents || existingEvents.length === 0) {
                console.log('📭 No existing events found');
                return;
            }

            const now = Date.now();
            let loadedCount = 0;

            for (const event of existingEvents) {
                // Normalize status from uppercase to PascalCase
                const normalizedStatus = event.status.charAt(0).toUpperCase() +
                    event.status.slice(1).toLowerCase();

                // Only load Scheduled or Live events
                if (normalizedStatus === MatchStatus.Scheduled || normalizedStatus === MatchStatus.Live) {
                    const demoEvent: DemoEvent = {
                        eventId: event.id,
                        fixtureId: event.id,
                        status: normalizedStatus as MatchStatus,
                        createdAt: now - (Math.random() * 60000),
                    };

                    // If already live, set liveAt timestamp and start simulation
                    if (normalizedStatus === MatchStatus.Live) {
                        demoEvent.liveAt = now - (Math.random() * 60000);
                        // Start simulation for already live events
                        await this.startMatchSimulation(event.id);
                    }

                    this.events.set(event.id, demoEvent);
                    loadedCount++;
                }
            }

            console.log(`✅ Loaded ${loadedCount} existing events into simulator`);
        } catch (error) {
            console.error('❌ Error loading existing events:', error);
        }
    }

    private async processEvents(): Promise<void> {
        const now = Date.now();

        for (const [eventId, event] of this.events.entries()) {
            try {
                if (event.status === MatchStatus.Scheduled) {
                    await this.checkScheduledToLive(event, now);
                } else if (event.status === MatchStatus.Live) {
                    // La simulación del partido se maneja en su propio intervalo
                    // Solo verificamos si debe terminar por timeout
                    await this.checkLiveTimeout(event, now);
                }
            } catch (error) {
                console.error(`❌ Error processing demo event ${eventId}:`, error);
            }
        }
    }

    private async checkScheduledToLive(event: DemoEvent, now: number): Promise<void> {
        // Random interval between 1-3 minutes before going live
        const minInterval = 1 * 60 * 1000;
        const maxInterval = 3 * 60 * 1000;
        const randomInterval = Math.random() * (maxInterval - minInterval) + minInterval;

        const elapsed = now - event.createdAt;

        if (elapsed >= randomInterval) {
            console.log(`🟢 Event ${event.eventId} → LIVE (starting match simulation)`);

            await updateEventStatus(event.eventId, MatchStatus.Live);

            event.status = MatchStatus.Live;
            event.liveAt = now;
            this.events.set(event.eventId, event);

            // Start match simulation
            await this.startMatchSimulation(event.eventId);
        }
    }

    private async startMatchSimulation(eventId: string): Promise<void> {
        const simulation: MatchSimulation = {
            eventId,
            matchMinute: 0,
            homeScore: 0,
            awayScore: 0,
            events: [],
            startedAt: Date.now()
        };

        this.liveMatches.set(eventId, simulation);

        // Update every match minute
        const interval = setInterval(async () => {
            try {
                const sim = this.liveMatches.get(eventId);
                if (!sim) {
                    // Simulation was removed, clean up interval
                    console.log(`⚠️  Simulation ${eventId} not found, stopping interval`);
                    clearInterval(interval);
                    return;
                }
                await this.updateMatchMinute(eventId);
            } catch (error) {
                console.error(`❌ Error updating match ${eventId}:`, error);
                // Clean up on error
                const sim = this.liveMatches.get(eventId);
                if (sim) {
                    await this.finishMatch(eventId, sim);
                } else {
                    clearInterval(interval);
                }
            }
        }, this.REAL_TIME_PER_MATCH_MINUTE);

        // Save interval reference
        simulation.interval = interval;

        console.log(`⚽ Match simulation started for event ${eventId}`);
    }

    private async updateMatchMinute(eventId: string): Promise<void> {
        const simulation = this.liveMatches.get(eventId);
        if (!simulation) return;

        simulation.matchMinute++;

        // Simulate match events
        await this.simulateMatchEvents(simulation);

        // Update score in blockchain
        await updateEventScore(
            eventId,
            simulation.homeScore.toString(),
            simulation.awayScore.toString()
        );

        console.log(`⚽ ${eventId} - Min ${simulation.matchMinute}: ${simulation.homeScore}-${simulation.awayScore}`);

        // Halftime
        if (simulation.matchMinute === 45) {
            console.log(`⏸️  HALFTIME: ${simulation.homeScore}-${simulation.awayScore}`);
        }

        // End of match
        if (simulation.matchMinute >= this.MATCH_DURATION_MINUTES) {
            await this.finishMatch(eventId, simulation);
        }
    }

    private async simulateMatchEvents(simulation: MatchSimulation): Promise<void> {
        const minute = simulation.matchMinute;

        // Goal probability: 3% per minute = ~2.7 goals in 90 minutes
        if (Math.random() < 0.03) {
            const team = Math.random() < 0.5 ? 'home' : 'away';

            if (team === 'home') {
                simulation.homeScore++;
            } else {
                simulation.awayScore++;
            }

            const matchEvent: MatchEvent = {
                event_type: MatchEventType.Goal,
                time: minute.toString(),
                team: team === 'home' ? 'Home Team' : 'Away Team',
                player: this.getRandomPlayer(),
                detail: this.getRandomGoalType(),
                timestamp: Date.now()
            };

            await addMatchEvent(simulation.eventId, matchEvent);
            simulation.events.push(matchEvent);

            console.log(`⚽ GOAL! ${team.toUpperCase()} - Minute ${minute} (${simulation.homeScore}-${simulation.awayScore})`);
        }

        // Yellow card probability: 4% per minute
        if (Math.random() < 0.04) {
            const team = Math.random() < 0.5 ? 'home' : 'away';

            const matchEvent: MatchEvent = {
                event_type: MatchEventType.YellowCard,
                time: minute.toString(),
                team: team === 'home' ? 'Home Team' : 'Away Team',
                player: this.getRandomPlayer(),
                detail: 'Foul',
                timestamp: Date.now()
            };

            await addMatchEvent(simulation.eventId, matchEvent);
            simulation.events.push(matchEvent);

            console.log(`🟨 Yellow Card - ${team} - Min ${minute}`);
        }

        // Red card probability: 0.5% per minute
        if (Math.random() < 0.005) {
            const team = Math.random() < 0.5 ? 'home' : 'away';

            const matchEvent: MatchEvent = {
                event_type: MatchEventType.RedCard,
                time: minute.toString(),
                team: team === 'home' ? 'Home Team' : 'Away Team',
                player: this.getRandomPlayer(),
                detail: 'Serious Foul',
                timestamp: Date.now()
            };

            await addMatchEvent(simulation.eventId, matchEvent);
            simulation.events.push(matchEvent);

            console.log(`🟥 Red Card - ${team} - Min ${minute}`);
        }

        // Substitutions (more likely in second half)
        if (minute > 45 && minute % 15 === 0 && Math.random() < 0.6) {
            const team = Math.random() < 0.5 ? 'home' : 'away';

            const matchEvent: MatchEvent = {
                event_type: MatchEventType.Substitution,
                time: minute.toString(),
                team: team === 'home' ? 'Home Team' : 'Away Team',
                player: this.getRandomPlayer(),
                detail: `Out: ${this.getRandomPlayer()}`,
                timestamp: Date.now()
            };

            await addMatchEvent(simulation.eventId, matchEvent);
            simulation.events.push(matchEvent);

            console.log(`🔄 Substitution - ${team} - Min ${minute}`);
        }
    }

    private async finishMatch(eventId: string, simulation: MatchSimulation): Promise<void> {
        // Stop interval
        if (simulation.interval) {
            clearInterval(simulation.interval);
        }

        // Determine winner
        let winner: Selection;
        if (simulation.homeScore > simulation.awayScore) {
            winner = Selection.Home;
        } else if (simulation.awayScore > simulation.homeScore) {
            winner = Selection.Away;
        } else {
            winner = Selection.Tie;
        }

        // Resolve event
        await resolveEvent(
            eventId,
            winner,
            simulation.homeScore.toString(),
            simulation.awayScore.toString()
        );

        console.log(`🏁 MATCH FINISHED: ${simulation.homeScore}-${simulation.awayScore} (${winner})`);
        console.log(`📊 Total events: ${simulation.events.length}`);

        // Cleanup - ensure interval is cleared
        if (simulation.interval) {
            clearInterval(simulation.interval);
            simulation.interval = undefined;
        }

        this.liveMatches.delete(eventId);
        this.events.delete(eventId);

        console.log(`✅ Cleaned up simulation for event ${eventId}`);
    }

    private async checkLiveTimeout(event: DemoEvent, now: number): Promise<void> {
        if (!event.liveAt) return;

        // If match has been running for more than 15 minutes (safety timeout)
        const elapsed = now - event.liveAt;
        const timeout = 15 * 60 * 1000; // 15 minutes

        if (elapsed >= timeout) {
            console.log(`⏱️  Timeout for event ${event.eventId}, forcing finish`);

            const simulation = this.liveMatches.get(event.eventId);
            if (simulation) {
                await this.finishMatch(event.eventId, simulation);
            }
        }
    }

    // Helper methods
    private getRandomPlayer(): string {
        const names = [
            'Silva', 'Fernandes', 'Martinez', 'Rodriguez', 'Santos',
            'Oliveira', 'Costa', 'Pereira', 'Alves', 'Sousa',
            'Ribeiro', 'Carvalho', 'Gomes', 'Ferreira', 'Rodrigues'
        ];
        return names[Math.floor(Math.random() * names.length)];
    }

    private getRandomGoalType(): string {
        const types = [
            'Normal Goal', 'Header', 'Free Kick', 'Penalty',
            'Counter Attack', 'Long Shot', 'Tap-in', 'Volley'
        ];
        return types[Math.floor(Math.random() * types.length)];
    }

    getStatus(): { running: boolean; eventCount: number; liveMatches: number } {
        return {
            running: this.isRunning,
            eventCount: this.events.size,
            liveMatches: this.liveMatches.size
        };
    }
}
