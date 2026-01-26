import { Event, MatchStatus, TypeEvent, MatchResult, Selection } from '../core/types';
import { fetchRealOdds } from './fetchOdds';

/**
 * Transforma un fixture de API-Sports al formato Event del contrato Linera
 * @param fixture - Objeto fixture de API-Sports
 * @param leagueName - Nombre de la liga
 * @returns Event formateado para Linera
 */
export async function transformFixtureToEvent(fixture: any, leagueName: string): Promise<Event> {
    const id = `${fixture.fixture.id}`;

    const startTime = fixture.fixture.timestamp;//(fixture.fixture.timestamp * 1000000).toString();

    const typeEvent = TypeEvent.Football;

    let status: MatchStatus;
    switch (fixture.fixture.status.short) {
        case 'NS':
        case 'TBD':
            status = MatchStatus.Scheduled;
            break;
        case '1H':
        case 'HT':
        case '2H':
        case 'ET':
        case 'P':
            status = MatchStatus.Live;
            break;
        case 'FT':
        case 'AET':
        case 'PEN':
            status = MatchStatus.Finished;
            break;
        case 'PST':
        case 'CANC':
        case 'ABD':
            status = MatchStatus.Postponed;
            break;
        default:
            status = MatchStatus.Scheduled;
    }

    // Obtener odds reales de API-Football
    const odds = await fetchRealOdds(id);

    const result: MatchResult = {
        winner: Selection.Home,
        home_score: fixture.goals?.home?.toString() || '0',
        away_score: fixture.goals?.away?.toString() || '0'
    };

    return {
        id,
        status,
        type_event: typeEvent,
        league: leagueName,
        teams: {
            home: {
                id: fixture.teams.home.id.toString(),
                name: fixture.teams.home.name
            },
            away: {
                id: fixture.teams.away.id.toString(),
                name: fixture.teams.away.name
            }
        },
        odds,
        start_time: startTime,
        result
    };
}
