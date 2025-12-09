import http from 'http';
import { EventMonitor } from '../workers/eventMonitor';
import { QueueManager } from '../workers/queueManager';

const PORT = 9999;

let monitor: EventMonitor | null = null;

export function initStatusServer(eventMonitor: EventMonitor): void {
    monitor = eventMonitor;

    const server = http.createServer((req, res) => {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');

        if (req.url === '/status' && req.method === 'GET') {
            if (!monitor) {
                res.statusCode = 503;
                res.end(JSON.stringify({ error: 'Monitor not initialized' }));
                return;
            }

            const status = monitor.getStatus();
            const queueManager = new QueueManager();
            const jobs = queueManager.getAllJobs();

            const response = {
                monitor: status,
                jobs: jobs.map(job => ({
                    eventId: job.eventId,
                    fixtureId: job.fixtureId,
                    status: job.status,
                    league: job.league,
                    lastChecked: new Date(job.lastChecked).toISOString(),
                    pollInterval: `${job.pollInterval / 1000}s`,
                    retryCount: job.retryCount
                })),
                summary: {
                    total: jobs.length,
                    byStatus: {
                        scheduled: jobs.filter(j => j.status === 'Scheduled').length,
                        live: jobs.filter(j => j.status === 'Live').length,
                        finished: jobs.filter(j => j.status === 'Finished').length,
                        postponed: jobs.filter(j => j.status === 'Postponed').length
                    }
                }
            };

            res.statusCode = 200;
            res.end(JSON.stringify(response, null, 2));
        } else if (req.url === '/health' && req.method === 'GET') {
            res.statusCode = 200;
            res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    });

    server.listen(PORT, () => {
        console.log(`Status server listening on http://localhost:${PORT}`);
        console.log(`View monitoring status: http://localhost:${PORT}/status`);
    });
}
