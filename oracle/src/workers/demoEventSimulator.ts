import { MatchStatus, Selection, MatchEventType, MatchEvent, Event } from '../core/types';
import { updateEventStatus } from '../core/operations/updateEventStatus';
import { updateEventScore } from '../core/operations/updateEventScore';
import { updateCurrentMinute } from '../core/operations/updateCurrentMinute';
import { addMatchEvent } from '../core/operations/addMatchEvent';
import { resolveEvent } from '../core/operations/resolveEvent';
import { DemoEvent, MatchSimulation } from './types';
import { getEvents } from '../core/operations/getEvents';

export class DemoEventSimulator {
    private events: Map<string, DemoEvent> = new Map();
    private liveMatches: Map<string, MatchSimulation> = new Map();
    private checkInterval: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;

    // Event limits
    private readonly MAX_LIVE_EVENTS = 3;
    private readonly MAX_SCHEDULED_EVENTS = 3;

    // Configuración de tiempo: 10 segundos reales = 1 minuto de partido
    private readonly MATCH_DURATION_MINUTES = 90;
    private readonly MINUTE_INTERVAL = 6667; // 10 segundos reales = 1 minuto partido

    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('🎮 Demo event simulator already running');
            return;
        }

        this.isRunning = true;
        console.log('🎮 Starting demo event simulator with live score updates...');

        // Load existing events from the contract
        await this.loadExistingEvents();

        // Resume live events that were in progress
        const allEvents = await getEvents();
        console.log(`📋 Found ${allEvents.length} total events in contract`);

        // Log status of each event
        allEvents.forEach(e => {
            console.log(`  - Event ${e.id}: status=${e.status}, current_minute=${e.current_minute}`);
        });

        const liveEvents = allEvents.filter(e => e.status.toLowerCase() === 'live');

        if (liveEvents.length > 0) {
            console.log(`🔄 Resuming ${liveEvents.length} live event(s)...`);
            for (const event of liveEvents) {
                await this.resumeLiveEvent(event);
            }
        } else {
            console.log(`ℹ️  No live events to resume`);
        }

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
            startDelay: Math.random() * (5 * 60 * 1000 - 30 * 1000) + 30 * 1000  // 30s - 5min
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
                        status: event.status as MatchStatus,
                        createdAt: now,
                        startDelay: Math.random() * (5 * 60 * 1000 - 30 * 1000) + 30 * 1000, // 30s - 5min
                    }

                    // If already live, set liveAt timestamp
                    // DON'T start simulation here - let resumeLiveEvent handle it with correct current_minute
                    if (normalizedStatus === MatchStatus.Live) {
                        demoEvent.liveAt = now;
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
        const elapsed = now - event.createdAt;

        // Use the fixed random delay assigned to this event
        if (elapsed >= event.startDelay) {
            // Check if we already have 6 live events
            const liveCount = this.liveMatches.size;

            if (liveCount >= this.MAX_LIVE_EVENTS) {
                // Reset delay to try again later (add 1-2 minutes)
                const additionalDelay = Math.random() * (2 * 60 * 1000 - 1 * 60 * 1000) + 1 * 60 * 1000; // 1-2 min
                event.startDelay = elapsed + additionalDelay;
                event.createdAt = now; // Reset creation time
                this.events.set(event.eventId, event);

                console.log(`⏸️  Event ${event.eventId} delayed - already ${liveCount} live events (max: ${this.MAX_LIVE_EVENTS})`);
                return;
            }

            const delayMinutes = (event.startDelay / 1000 / 60).toFixed(1);
            console.log(`🟢 Event ${event.eventId} → LIVE after ${delayMinutes}min (${liveCount + 1}/${this.MAX_LIVE_EVENTS} live events)`);

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

        // Single interval: every 30 seconds = 1 match minute
        const interval = setInterval(async () => {
            try {
                const sim = this.liveMatches.get(eventId);
                if (!sim) {
                    console.log(`⚠️  Simulation ${eventId} not found, stopping interval`);
                    clearInterval(interval);
                    return;
                }

                // Increment minute
                sim.matchMinute++;

                // Update current minute in contract
                await updateCurrentMinute(eventId, sim.matchMinute);

                // Probabilistic event generation (only one event per minute)
                await this.tryGenerateEvents(sim);

                // Update score if changed
                await updateEventScore(
                    eventId,
                    sim.homeScore.toString(),
                    sim.awayScore.toString()
                );

                console.log(`⚽ ${eventId} - Min ${sim.matchMinute}: ${sim.homeScore}-${sim.awayScore}`);

                // Halftime
                if (sim.matchMinute === 45) {
                    console.log(`⏸️  HALFTIME: ${sim.homeScore}-${sim.awayScore}`);
                }

                // Check if match should end
                if (sim.matchMinute >= this.MATCH_DURATION_MINUTES) {
                    await this.finishMatch(eventId, sim);
                }
            } catch (error) {
                console.error(`❌ Error in match simulation ${eventId}:`, error);
                const sim = this.liveMatches.get(eventId);
                if (sim) {
                    await this.finishMatch(eventId, sim);
                } else {
                    clearInterval(interval);
                }
            }
        }, this.MINUTE_INTERVAL);

        simulation.interval = interval;
        console.log(`⚽ Match simulation started for event ${eventId}`);
    }

    private async tryGenerateEvents(simulation: MatchSimulation): Promise<void> {
        const minute = simulation.matchMinute;

        // Goal: 3% probability per minute (~2.7 goals in 90 minutes)
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

            console.log(`⚽ GOAL! ${team.toUpperCase()} - Min ${minute} (${simulation.homeScore}-${simulation.awayScore})`);
            return; // Only one event per minute
        }

        // Yellow card: 4% probability
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
            return; // Only one event per minute
        }

        // Red card: 0.5% probability
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
            return; // Only one event per minute
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
            return; // Only one event per minute
        }

        // If no event occurred, the minute passes without events
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

    private async resumeLiveEvent(event: Event): Promise<void> {
        const eventId = event.id;

        // Don't resume if already simulating
        if (this.liveMatches.has(eventId)) {
            console.log(`⚠️  Event ${eventId} already being simulated`);
            return;
        }

        // Get current minute from event
        const currentMinute = event.current_minute || 0;

        // Don't resume if match is over
        if (currentMinute >= this.MATCH_DURATION_MINUTES) {
            console.log(`⚠️  Event ${eventId} already finished (min ${currentMinute}), resolving...`);
            // Resolve the event
            const homeScore = parseInt(event.live_score?.home || '0');
            const awayScore = parseInt(event.live_score?.away || '0');
            let winner: Selection;
            if (homeScore > awayScore) winner = Selection.Home;
            else if (awayScore > homeScore) winner = Selection.Away;
            else winner = Selection.Tie;

            await resolveEvent(eventId, winner, homeScore.toString(), awayScore.toString());
            return;
        }

        console.log(`🔄 Resuming event ${eventId} from minute ${currentMinute}`);
        console.log(`   📊 Event data: current_minute=${event.current_minute}, live_score=${JSON.stringify(event.live_score)}`);

        // Create simulation state from existing event data
        const simulation: MatchSimulation = {
            eventId,
            matchMinute: currentMinute,
            homeScore: parseInt(event.live_score?.home || '0'),
            awayScore: parseInt(event.live_score?.away || '0'),
            events: event.match_events || [],
            startedAt: Date.now() - (currentMinute * this.MINUTE_INTERVAL)
        };

        this.liveMatches.set(eventId, simulation);

        // Start simulation interval from current minute
        const interval = setInterval(async () => {
            try {
                const sim = this.liveMatches.get(eventId);
                if (!sim) {
                    clearInterval(interval);
                    return;
                }

                // Increment minute
                sim.matchMinute++;

                // Update current minute in contract
                await updateCurrentMinute(eventId, sim.matchMinute);

                // Probabilistic event generation
                await this.tryGenerateEvents(sim);

                // Update score
                await updateEventScore(
                    eventId,
                    sim.homeScore.toString(),
                    sim.awayScore.toString()
                );

                console.log(`⚽ ${eventId} - Min ${sim.matchMinute}: ${sim.homeScore}-${sim.awayScore} (RESUMED)`);

                // Halftime
                if (sim.matchMinute === 45) {
                    console.log(`⏸️  HALFTIME: ${sim.homeScore}-${sim.awayScore}`);
                }

                // Check if match should end
                if (sim.matchMinute >= this.MATCH_DURATION_MINUTES) {
                    await this.finishMatch(eventId, sim);
                }
            } catch (error) {
                console.error(`❌ Error in resumed match simulation ${eventId}:`, error);
                const sim = this.liveMatches.get(eventId);
                if (sim) {
                    await this.finishMatch(eventId, sim);
                } else {
                    clearInterval(interval);
                }
            }
        }, this.MINUTE_INTERVAL);

        simulation.interval = interval;

        console.log(`✅ Event ${eventId} resumed successfully from minute ${currentMinute}`);
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
