declare global {
    namespace NodeJS {
        interface ProcessEnv {
            APPID: string;
            CHAIN_ID?: string;
            LINERA_FAUCET?: string;
            SERVICE_URL?: string;
            NODE_ENV?: 'development' | 'production' | 'test';
        }
    }
}

export { };
