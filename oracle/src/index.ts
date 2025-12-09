import http from 'http';
import { config, validateConfig } from './config';
import { subscribe } from './core/subscribe';
import { getNextEvents } from './core/getNextEvents';
import { scheduleWeeklyEventUpdate } from './scheduler/eventScheduler';

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


        // Inicializar scheduler para actualizaciones semanales
        await subscribe();
        scheduleWeeklyEventUpdate();

        // Inicializar event monitor para seguimiento de estados
        const { EventMonitor } = await import('./workers/eventMonitor');
        const monitor = new EventMonitor();
        monitor.start();
        console.log('Event monitor initialized');

        // Inicializar servidor de status
        const { initStatusServer } = await import('./api/statusServer');
        initStatusServer(monitor);

        // Ejecutar una vez al inicio para poblar eventos
        console.log('Running initial event fetch...');
        await getNextEvents();

    } catch (error) {
        console.error('Error al ejecutar el comando Linera:', error);
        process.exit(1);
    }
});