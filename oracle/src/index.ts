import http from 'http';
import { config, validateConfig } from './config';
import { subscribe } from './core/subscribe';
import { getNextEvents } from './core/getNextEvents';
import { scheduleWeeklyEventUpdate } from './scheduler/eventScheduler';
import { scheduleLeaderboardManagement } from './scheduler/leaderboardScheduler';
import { DemoEventSimulator } from './workers/demoEventSimulator';

// Global instances (accessible from other modules)
export let demoSimulator: DemoEventSimulator | null = null;
export let eventMonitor: any | null = null;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Oracle service running\n');
});

server.listen(9998, async () => {
    try {
        validateConfig();
        console.log(`Chain ID: ${config.chainId}`);
        console.log(`Application ID: ${config.appId}`);
        console.log(`Linera Faucet: ${config.lineraFaucet}`);
        console.log(`Service URL: ${config.serviceUrl}`);

        try {
            // Check if teams exist in power ranking
            const { getTeams } = await import('./core/operations/getTeams');
            const teams = await getTeams();

            if (teams.length === 0) {
                console.log('⚠️ No teams found in contract. Initializing Power Rankings...');
                const { updateGlobalPowerRankings } = await import('./core/operations/updatePowerRankings');
                await updateGlobalPowerRankings();
            } else {
                console.log(`✅ Power Rankings already initialized (${teams.length} teams found). Skipping update.`);
            }
        } catch (error) {
            console.error('Error checking/initializing power rankings:', error);
        }

        // Inicializar scheduler para actualizaciones
        await subscribe();
        scheduleWeeklyEventUpdate();

        // Inicializar leaderboard
        if (config.leaderboardEnabled) {
            console.log('Initializing leaderboard...');

            // Import leaderboard operations
            const { checkExistingLeaderboard } = await import('./core/operations/checkExistingLeaderboard');
            const { startLeaderboardWeek } = await import('./core/operations/startLeaderboardWeek');
            const { getWeekNumber } = await import('./utils/getWeekNumber');

            try {
                // Check if leaderboard exists for current week
                const existing = await checkExistingLeaderboard();
                console.log('Existing leaderboard:', existing);

                const now = new Date();
                const currentWeek = getWeekNumber(now);
                const currentYear = now.getFullYear();

                if (!existing || existing.week !== currentWeek || existing.year !== currentYear) {
                    console.log(`No leaderboard found for week ${currentYear}-${currentWeek}, creating...`);
                    await startLeaderboardWeek();
                } else {
                    console.log(`Leaderboard for week ${currentYear}-${currentWeek} already exists`);
                }

                // Now set up the scheduler
                scheduleLeaderboardManagement();
            } catch (error) {
                console.error('Error initializing leaderboard:', error);
                console.log('Continuing without leaderboard...');
            }

        } else {
            console.log('Leaderboard management is DISABLED');
        }

        // Inicializar event monitor o demo simulator según el modo
        if (config.demoMode) {
            // Demo mode: usar simulador
            demoSimulator = new DemoEventSimulator();
            await demoSimulator.start();
            console.log('Demo event simulator initialized');

            // Inicializar servidor de status con simulador
            const { initStatusServer } = await import('./api/statusServer');
            initStatusServer(demoSimulator as any);
        } else {
            // Production mode: usar monitor real
            const { EventMonitor } = await import('./workers/eventMonitor');
            eventMonitor = new EventMonitor();
            eventMonitor.start();
            console.log('Event monitor initialized');

            // Inicializar servidor de status
            const { initStatusServer } = await import('./api/statusServer');
            initStatusServer(eventMonitor);
        }

        // Ejecutar una vez al inicio para poblar eventos
        console.log('Running initial event fetch...');
        await getNextEvents();

    } catch (error) {
        console.error('Error al ejecutar el comando Linera:', error);
        process.exit(1);
    }
});