import { config } from '../../config';

interface Team {
    id: string;
    name: string;
    power: number;
    form: number;
    goal_average: number;
}

interface GraphQLResponse {
    data: {
        teams: Team[];
    };
    errors?: any[];
}

export async function getTeams(): Promise<Team[]> {
    const url = `${config.serviceUrl}/chains/${config.chainId}/applications/${config.appId}`;

    const query = `
        query {
            teams {
                id
                name
                power
                form
                goalAverage
            }
        }
    `;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query
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

        return (result.data.teams || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            power: t.power,
            form: t.form,
            goal_average: t.goalAverage // Map GraphQL camelCase to snake_case
        }));

    } catch (error) {
        console.error('Error fetching teams:', error);
        return [];
    }
}
