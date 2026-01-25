

export const config = {
    appId: process.env.APPID || '',
    chainId: process.env.CHAIN_ID || '',
    lineraFaucet: process.env.LINERA_FAUCET || 'https://faucet.testnet-conway.linera.net',
    port: 9999,
    serviceUrl: process.env.SERVICE_URL || 'http://localhost:8080',
    api: process.env.API || 'https://v3.football.api-sports.io',
    apiKey: process.env.API_KEY || '',
    main_chain: process.env.VITE_MAIN_CHAIN_ID || '',
    demoMode: process.env.DEMO_MODE === 'true',
    // Leaderboard configuration
    leaderboardEnabled: process.env.LEADERBOARD_ENABLED !== 'false', // Default: enabled
    leaderboardPrizePool: process.env.LEADERBOARD_PRIZE_POOL || '10000', // 10,000 USDL
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
