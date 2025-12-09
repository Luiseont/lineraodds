import { config } from '../config';

interface OddsResponse {
    response: Array<{
        bookmakers: Array<{
            id: number;
            name: string;
            bets: Array<{
                id: number;
                name: string;
                values: Array<{
                    value: string;
                    odd: string;
                }>;
            }>;
        }>;
    }>;
}

/**
 * Obtiene las odds reales de API-Football para un fixture específico
 * @param fixtureId - ID del fixture
 * @returns Objeto con odds ajustadas {home, away, tie}
 */
export async function fetchRealOdds(fixtureId: string): Promise<{ home: number; away: number; tie: number }> {
    const apiKey = config.apiKey;
    const url = `${config.api}/odds?fixture=${fixtureId}&bookmaker=8`; // 8 = Bet365

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-apisports-key': apiKey,
                'x-rapidapi-host': 'v3.football.api-sports.io'
            }
        });

        if (!response.ok) {
            console.warn(`Failed to fetch odds for fixture ${fixtureId}, using defaults`);
            return getDefaultOdds();
        }

        const data = await response.json() as OddsResponse;

        if (!data.response || data.response.length === 0) {
            console.warn(`No odds data for fixture ${fixtureId}, using defaults`);
            return getDefaultOdds();
        }

        // Buscar Bet365 bookmaker
        const bet365 = data.response[0].bookmakers.find(b => b.id === 8);

        if (!bet365) {
            console.warn(`Bet365 odds not found for fixture ${fixtureId}, using defaults`);
            return getDefaultOdds();
        }

        // Buscar Match Winner bet (ID 1)
        const matchWinner = bet365.bets.find(b => b.id === 1);

        if (!matchWinner || matchWinner.values.length < 2) {
            console.warn(`Match Winner odds not found for fixture ${fixtureId}, using defaults`);
            return getDefaultOdds();
        }

        // Extraer odds
        const homeOdd = parseFloat(matchWinner.values.find(v => v.value === 'Home')?.odd || '2.00');
        const awayOdd = parseFloat(matchWinner.values.find(v => v.value === 'Away')?.odd || '2.00');
        const tieOdd = parseFloat(matchWinner.values.find(v => v.value === 'Draw')?.odd || '3.00');

        // Aplicar ajuste si las odds superan 2.00 (reducir 15%)
        const adjustOdd = (odd: number): number => {
            if (odd > 2.00) {
                return odd * 0.85; // Reducir 15%
            }
            return odd;
        };

        // Convertir a formato u64 (multiplicar por 100 y redondear)
        return {
            home: Math.round(adjustOdd(homeOdd) * 100),
            away: Math.round(adjustOdd(awayOdd) * 100),
            tie: Math.round(adjustOdd(tieOdd) * 100)
        };

    } catch (error) {
        console.error(`Error fetching odds for fixture ${fixtureId}:`, error);
        return getDefaultOdds();
    }
}

/**
 * Retorna odds por defecto cuando no se pueden obtener de la API
 */
function getDefaultOdds(): { home: number; away: number; tie: number } {
    return {
        home: 105,
        away: 115,
        tie: 110
    };
}
