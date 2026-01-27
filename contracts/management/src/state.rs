use linera_sdk::views::{linera_views, RegisterView, RootView, ViewStorageContext, MapView };
use linera_sdk::linera_base_types::{ChainId, Timestamp, Amount};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use async_graphql::{SimpleObject, Enum};

#[derive(RootView, SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct ManagementState {
    pub events: MapView<String, Event>,
    pub event_odds: MapView<String, Vec<UserOdd>>,
    pub oracle: RegisterView<Option<ChainId>>,
    pub token_supp: RegisterView<Amount>,
    pub leaderboard:RegisterView<LeaderboardData>,// <LeaderboardData>

    pub power_ranking: MapView<String, TeamInfo>,
    //state for local instance
    pub user_odds: RegisterView<Vec<UserOdds>>,
    pub user_balance: RegisterView<Amount>,
    pub nonce: RegisterView<u64>,
    pub bonus_claimed: RegisterView<bool>,
    pub user_votes: RegisterView<Vec<UserVotes>>,
}


#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, Default)]
#[serde(rename_all = "camelCase")]
pub struct Event {
    pub id: String,
    pub status: MatchStatus,
    pub type_event: TypeEvent,
    pub league: String,
    pub teams: Teams,
    pub odds: Odds,
    pub start_time: Timestamp,
    pub result: MatchResult,
    pub live_score: LiveScore,
    pub match_events: Vec<MatchEvent>,
    pub last_updated: Timestamp,
    pub current_minute: Option<u32>,
    pub predictions: Vec<LivePrediction>,
}

#[derive(Clone, Debug, Copy, Eq, PartialEq, Serialize, Deserialize, Enum, Default)]
pub enum MatchStatus {
    #[default] Scheduled,
    Live,
    Finished,
    Postponed,
}

#[derive(Clone, Debug, Copy, Eq, PartialEq, Serialize, Deserialize, Enum, Default)]
pub enum TypeEvent {
    #[default] Football,
    Esports,
    Baseball,
}

#[derive(Clone, Debug, Copy, Eq, PartialEq, Serialize, Deserialize, Enum, Default)]
pub enum Selection {
    #[default] Home,
    Away,
    Tie,
}

#[derive(Clone, Debug, Copy, Eq, PartialEq, Serialize, Deserialize, Enum, Default)]
pub enum BetStatus {
    #[default] Placed,
    Won,
    Lost,
    Cancelled
}

#[derive(Clone, Debug, Copy, Eq, PartialEq, Serialize, Deserialize, Enum, Default)]
pub enum MatchEventType {
    #[default] None,
    Goal,
    YellowCard,
    RedCard,
    Substitution,
    Corner,
    Penalty,
}

//#[derive(Clone, Debug, Copy, Eq, PartialEq, Serialize, Deserialize, Default)]
#[derive(Clone, Debug, Copy, Eq, PartialEq, Serialize, Deserialize)]
pub enum PredictionType {
    //#[default] 
    None,
    NextGoal(Selection), 
    RedCard, 
    TotalGoalsOver(u8),
    TotalGoalsUnder(u8),
    BTTS,
    GoalInNext10Mins(u32), 
}

impl Default for PredictionType {
    fn default() -> Self {
        PredictionType::None
    }
}

// Treat this enum as a JSON scalar for GraphQL
async_graphql::scalar!(PredictionType);


#[derive(Clone, Debug, Serialize, Deserialize, Default, SimpleObject)]
pub struct Teams {
    pub home: Team,
    pub away: Team,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, SimpleObject)]
pub struct Team {
    pub id: String,
    pub name: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default,SimpleObject)]
pub struct Odds {
    pub home: u64,
    pub away: u64,
    pub tie: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, SimpleObject)]
pub struct MatchResult {
    pub winner: Selection,
    pub home_score: String,
    pub away_score: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject)]
pub struct UserOdd {
    pub user_id: String,
    pub odd: u64,
    pub selection: Selection,
    pub placed_at: Timestamp,
    pub bid: Amount,
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, Default)]
pub struct UserOdds {
    pub teams: Teams,
    pub league: String,
    pub start_time: Timestamp,
    pub odd: u64,
    pub selection: Selection,
    pub placed_at: Timestamp,
    pub bid: Amount,
    pub event_id: String,
    pub status: BetStatus
}

#[derive(Clone, Debug, SimpleObject)]
pub struct BetsSummary {
    pub total_staked: String,
    pub potential_winnings: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, SimpleObject)]
pub struct LiveScore {
    pub home: String,
    pub away: String,
    pub updated_at: Timestamp,
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, Default)]
pub struct MatchEvent {
    pub event_type: MatchEventType,
    pub time: String,  // minuto del partido
    pub team: String,
    pub player: Option<String>,
    pub detail: Option<String>,
    pub timestamp: Timestamp,
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, Default)]
pub struct UserStats {
    pub total_staked: Amount,
    pub total_winnings: Amount,
    pub total_bets: u64,
    pub total_wins: u64,
    pub total_losses: u64,
    pub win_rate: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, Default)]
pub struct LeaderboardWinner {
    pub user: String,
    pub rank: u64,
    pub prize: Amount,
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, Default)]
pub struct LeaderboardData {
    pub week: u64,
    pub year: u64,
    pub winners: HashMap<String, Vec<LeaderboardWinner>>,   // "year-week" -> Vec<LeaderboardWinners>
    pub user_stats: HashMap<String, UserStats>,              // user -> UserStats
    pub prize_pool: Amount,
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, Default)]
pub struct TeamInfo {
    pub id: String,
    pub name: String,
    pub power: u64,       
    pub form: i64,
    pub goal_average: i64,
    pub last_updated: Timestamp,
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, Default)]
pub struct LivePrediction {
    pub id: u64,         
    pub creator: String,       
    pub prediction_type: PredictionType, 
    pub question: String,       
    pub pool_yes: Amount,         
    pub pool_no: Amount,          
    pub resolved: bool,         
    pub outcome: Option<bool>,  
    pub created_at: Timestamp,
    pub votes: Vec<Vote>
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, Default)]
pub struct Vote {
    pub user: String,
    pub amount: Amount,           
    pub choice: bool,           
    pub claimed: bool,          
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, Default)]
pub struct UserVotes {
    pub id: u64, //id market
    pub event_id: String,
    pub prediction_type: PredictionType,
    pub amount: Amount,
    pub choice: bool,
    pub claimed: bool,
}