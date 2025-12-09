import cron from 'node-cron';
import { getNextEvents } from '../core/getNextEvents';

/**
 * Programa la ejecución de getNextEvents cada lunes a las 00:00
 */
export function scheduleWeeklyEventUpdate() {

    const task = cron.schedule('0 0 * * 1', async () => {
        console.log('Running scheduled weekly event update (Monday 00:00)...');
        try {
            await getNextEvents();
            console.log('Weekly event update completed successfully');
        } catch (error) {
            console.error('Error in scheduled event update:', error);
        }
    }, {
        timezone: "America/New_York"
    });

    console.log('Weekly event scheduler initialized');

    return task;
}


export function runEventUpdateNow() {
    console.log('Running immediate event update...');
    return getNextEvents();
}
