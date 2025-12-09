import { config } from '../config';
import https from 'https';

/**
 * Updates the application blob hash via GraphQL mutation
 * @param blobHash - The hash of the blob to update
 * @returns The response from the GraphQL mutation
 */
export async function updateAppBlob(blobHash: string) {
    const url = `${config.serviceUrl}/chains/${config.chainId}/applications/${config.appId}`;

    const mutation = `mutation($blob: DataBlobHash!) {
        updateBlobHash(blobHash: $blob)
    }`;

    const variables = {
        blob: blobHash
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

        console.log('App blob updated successfully:', result);

    } catch (error) {
        console.error('Error updating app blob:', error);
        throw error;
    }
}