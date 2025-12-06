import http from 'http';
import { config, validateConfig } from './config';
import { updateAppBlob } from './core/update-app-blob';

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Oracle service running\n');
});

server.listen(config.port, async () => {
    try {
        // Validate configuration on startup
        validateConfig();
        console.log(`Chain ID: ${config.chainId}`);
        console.log(`Application ID: ${config.appId}`);
        console.log(`Linera Faucet: ${config.lineraFaucet}`);

        await updateAppBlob('2109026a3add767323835f861de5bcbb7f98173914cee67e66f94cf36c3ab57b');
    } catch (error) {
        console.error('Error al ejecutar el comando Linera:', error);
        process.exit(1);
    }
});