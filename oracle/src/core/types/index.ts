// Match Rust enum: MatchStatus
export enum MatchStatus {
    Scheduled = "Scheduled",
    Live = "Live",
    Finished = "Finished",
    Postponed = "Postponed"
}

// Match Rust enum: TypeEvent
export enum TypeEvent {
    Football = "Football",
    Esports = "Esports",
    Baseball = "Baseball"
}

// Match Rust enum: Selection
export enum Selection {
    Home = "Home",
    Away = "Away",
    Tie = "Tie"
}

// Match Rust enum: BetStatus
export enum BetStatus {
    Placed = "Placed",
    Won = "Won",
    Lost = "Lost",
    Cancelled = "Cancelled"
}

// Match Rust struct: Teams
export interface Teams {
    home: string;
    away: string;
}

// Match Rust struct: Odds
export interface Odds {
    home: number;  // u64 in Rust
    away: number;  // u64 in Rust
    tie: number;   // u64 in Rust
}

// Match Rust struct: MatchResult
export interface MatchResult {
    winner: Selection;
    home_score: string;
    away_score: string;
}

// Match Rust struct: Event
export interface Event {
    id: string;
    status: MatchStatus;
    type_event: TypeEvent;
    league: string;
    teams: Teams;
    odds: Odds;
    start_time: string;  // Timestamp as string (micros since epoch)
    result: MatchResult;
}

// Match Rust struct: UserOdd
export interface UserOdd {
    user_id: string;
    odd: number;  // u64 in Rust
    selection: Selection;
    placed_at: string;  // Timestamp as string
    bid: string;  // Amount as string
}

// Match Rust struct: UserOdds
export interface UserOdds {
    teams: Teams;
    league: string;
    start_time: string;  // Timestamp as string
    odd: number;  // u64 in Rust
    selection: Selection;
    placed_at: string;  // Timestamp as string
    bid: string;  // Amount as string
    event_id: string;
    status: BetStatus;
}

// GraphQL response type
export interface GraphQLResponse {
    data?: any;
    errors?: any[];
}

// Specific response type for getEvents query
export interface GetEventsResponse {
    data?: {
        events: Array<{
            id: string;
            status: string;
            typeEvent: string;
            league: string;
            teams: {
                home: string;
                away: string;
            };
            odds: {
                home: number;
                away: number;
                tie: number;
            };
            startTime: string;
        }>;
    };
    errors?: any[];
}