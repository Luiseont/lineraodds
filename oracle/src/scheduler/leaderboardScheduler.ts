import cron from 'node-cron';
import { startLeaderboardWeek } from '../core/operations/startLeaderboardWeek';
import { endLeaderboardWeek } from '../core/operations/endLeaderboardWeek';
import { config } from '../config';

/**
 * Schedule leaderboard week management
 * - End week: Sundays at 23:59
 * - Start week: Mondays at 00:00
 */
export function scheduleLeaderboardManagement() {
    if (!config.leaderboardEnabled) {
        console.log('Leaderboard management is disabled');
        return;
    }

    // End current week: Sundays at 23:59
    const endWeekTask = cron.schedule('59 23 * * 0', async () => {
        console.log('SCHEDULED: Ending leaderboard week...');
        try {
            await endLeaderboardWeek();
            console.log('Leaderboard week ended successfully');
        } catch (error) {
            console.error('Error in scheduled week end:', error);
        }
    }, {
        timezone: "America/New_York"
    });

    // Start new week: Mondays at 00:00
    const startWeekTask = cron.schedule('0 0 * * 1', async () => {
        console.log('SCHEDULED: Starting new leaderboard week...');
        try {
            await startLeaderboardWeek();
            console.log('New leaderboard week started successfully');
        } catch (error) {
            console.error('Error in scheduled week start:', error);
        }
    }, {
        timezone: "America/New_York"
    });

    console.log('Leaderboard scheduler initialized:');
    console.log('End week: Sundays at 23:59 (America/New_York)');
    console.log('Start week: Mondays at 00:00 (America/New_York)');
    console.log(`Prize pool: ${config.leaderboardPrizePool} USDL`);

    return { endWeekTask, startWeekTask };
}

/**
 * Manually trigger week end (for testing/admin purposes)
 */
export async function runEndWeekNow() {
    console.log('Manual trigger: Ending leaderboard week...');
    return endLeaderboardWeek();
}

/**
 * Manually trigger week start (for testing/admin purposes)
 */
export async function runStartWeekNow() {
    console.log('Manual trigger: Starting leaderboard week...');
    return startLeaderboardWeek();
}
