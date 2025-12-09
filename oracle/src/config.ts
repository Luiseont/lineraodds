
export const config = {
    appId: process.env.APPID || '',
    chainId: process.env.CHAIN_ID || '',
    lineraFaucet: process.env.LINERA_FAUCET || 'https://faucet.testnet-conway.linera.net',
    port: 9999,
    serviceUrl: process.env.SERVICE_URL || 'http://localhost:8080',
    api: process.env.API || 'https://v3.football.api-sports.io',
    apiKey: process.env.API_KEY || '',
    main_chain: process.env.VITE_MAIN_CHAIN_ID || '',

} as const;

export function validateConfig(): void {
    const requiredVars = {
        APPID: config.appId,
        API: config.api,
        API_KEY: config.apiKey,
        VITE_MAIN_CHAIN_ID: config.main_chain,
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
