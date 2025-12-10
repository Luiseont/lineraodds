import cron from 'node-cron';
import { getNextEvents } from '../core/getNextEvents';
import { config } from '../config';

/**
 * Programa la ejecución de getNextEvents
 * - Producción: Cada lunes a las 00:00
 * - Demo: Cada 15 minutos
 */
export function scheduleWeeklyEventUpdate() {
    // Production: Every Monday at 00:00
    // Demo: Every 15 minutes
    const cronPattern = config.demoMode ? '*/15 * * * *' : '0 0 * * 1';
    const modeDescription = config.demoMode
        ? 'Demo: every 15 minutes'
        : 'Production: weekly (Monday 00:00)';

    const task = cron.schedule(cronPattern, async () => {
        const mode = config.demoMode ? 'DEMO' : 'SCHEDULED';
        console.log(`${mode} Running event update...`);
        try {
            await getNextEvents();
            console.log(`${mode} Event update completed successfully`);
        } catch (error) {
            console.error(`${mode} Error in event update:`, error);
        }
    }, {
        timezone: "America/New_York"
    });

    console.log(`Event scheduler initialized (${modeDescription})`);

    return task;
}


export function runEventUpdateNow() {
    console.log('Running immediate event update...');
    return getNextEvents();
}
