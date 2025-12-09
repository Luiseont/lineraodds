
export const config = {
    appId: process.env.APPID || '',
    chainId: process.env.CHAIN_ID || '',
    lineraFaucet: process.env.LINERA_FAUCET || 'https://faucet.testnet-conway.linera.net',
    port: 9999,
    serviceUrl: process.env.SERVICE_URL || 'http://localhost:8080',
} as const;

export function validateConfig(): void {
    const requiredVars = {
        APPID: config.appId,
    };

    const missingVars = Object.entries(requiredVars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missingVars.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingVars.join(', ')}`
        );
    }
}
