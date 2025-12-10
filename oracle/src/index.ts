import http from 'http';
import { config, validateConfig } from './config';
import { subscribe } from './core/subscribe';
import { getNextEvents } from './core/getNextEvents';
import { scheduleWeeklyEventUpdate } from './scheduler/eventScheduler';
import { DemoEventSimulator } from './workers/demoEventSimulator';

// Global instance for demo simulator (accessible from other modules)
export let demoSimulator: DemoEventSimulator | null = null;

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

        // Log demo mode status
        if (config.demoMode) {
            console.log('Demo Mode ENABLED - Events will simulate lifecycle');
        } else {
            console.log('Production Mode - Using real API data');
        }

        // Inicializar scheduler para actualizaciones
        await subscribe();
        scheduleWeeklyEventUpdate();

        // Inicializar event monitor o demo simulator según el modo
        if (config.demoMode) {
            // Demo mode: usar simulador
            demoSimulator = new DemoEventSimulator();
            demoSimulator.start();
            console.log('🎮 Demo event simulator initialized');

            // Inicializar servidor de status con simulador
            const { initStatusServer } = await import('./api/statusServer');
            initStatusServer(demoSimulator as any);
        } else {
            // Production mode: usar monitor real
            const { EventMonitor } = await import('./workers/eventMonitor');
            const monitor = new EventMonitor();
            monitor.start();
            console.log('Event monitor initialized');

            // Inicializar servidor de status
            const { initStatusServer } = await import('./api/statusServer');
            initStatusServer(monitor);
        }

        // Ejecutar una vez al inicio para poblar eventos
        console.log('Running initial event fetch...');
        await getNextEvents();

    } catch (error) {
        console.error('Error al ejecutar el comando Linera:', error);
        process.exit(1);
    }
});