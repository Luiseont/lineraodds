import { config } from '../../config';
import { GraphQLResponse } from '../types';

export async function updateTeamPower(
    teamId: string,
    name: string,
    power: number,
    form: number,
    goalAverage: number
) {
    const url = `${config.serviceUrl}/chains/${config.chainId}/applications/${config.appId}`;

    const mutation = `
        mutation($teamId: String!, $name: String!, $power: Int!, $form: Int!, $goalAverage: Int!) {
            updateTeamPower(
                teamId: $teamId,
                name: $name,
                power: $power,
                form: $form,
                goalAverage: $goalAverage
            )
        }
    `;

    const variables = {
        teamId,
        name,
        power,
        form,
        goalAverage
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: mutation,
                variables: variables
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const result = await response.json() as GraphQLResponse;

        if (result.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }

        // console.log(`Updated power for team ${name} (${teamId})`);
        return result;

    } catch (error) {
        console.error(`Error updating team power for ${name}:`, error);
        throw error;
    }
}
