import { config } from '../config';
import https from 'https';

export async function subscribe() {
    const url = `${config.serviceUrl}/chains/${config.chainId}/applications/${config.appId}`;
    const main_chain = config.main_chain;

    const mutation = `mutation($chainId: ChainId!) {
            subscribe(chainId: $chainId)
        }`;

    const variables = {
        chainId: main_chain
    };

    try {
        console.log('Sending GraphQL mutation to:', url);
        console.log('Variables:', variables);

        // Agent to disable SSL verification (for development/testing only)
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: mutation,
                variables: variables
            }),
            // @ts-ignore - agent is valid but TypeScript may not recognize it
            agent: agent
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const result = await response.json();

        console.log('Subscribed sccessfully:', result);

    } catch (error) {
        console.error('Error updating app blob:', error);
        throw error;
    }
}