
pub mod state;

use async_graphql::{Request, Response};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{ContractAbi, ServiceAbi, Amount, Timestamp, ChainId},
};
use serde::{Deserialize, Serialize};

pub use self::state::{Event, UserOdd, PredictionType};
pub struct ManagementAbi;

impl ContractAbi for ManagementAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for ManagementAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    //appchain
    Subscribe { chain_id: ChainId },
    Unsubscribe { chain_id: ChainId },
    CreateEvent { id: String, type_event: String, league: String, home_id: String, away_id: String, start_time: Timestamp },
    UpdateEventStatus { event_id: String, status: String },
    UpdateCurrentMinute { event_id: String, current_minute: u32 },
    ResolveEvent { event_id: String, winner: String, home_score: String, away_score: String },
    UpdateEventLiveScore { event_id: String, home_score: String, away_score: String },
    AddMatchEvent { 
        event_id: String, 
        event_type: String,
        time: String,
        team: String,
        player: Option<String>,
        detail: Option<String>,
        timestamp: Timestamp
    },
    //power ranking operations
    UpdateTeamPower { team_id: String, name: String, power: u64, form: i64, goal_average: i64 },
    //leaderboard operations
    StartNewWeek { week: u64, year: u64, prize_pool: Amount },
    EndCurrentWeek { week: u64, year: u64 },
    //userChain
    CreatePrediction { prediction_id: u64, event_id: String, prediction_type: PredictionType, question: String, init_vote: bool, amount: Amount },
    PlaceVote { event_id: String, prediction_id: u64, vote: bool, amount: Amount, prediction_type: PredictionType },
    PlaceBet{ home_id: String, away_id: String, home_name: String, away_name: String, league: String, start_time: Timestamp, odd: u64, selection: String, bid: Amount, event_id: String},
    ClaimReward { event_id: String },
    ClaimPredictionReward { prediction_id: u64, event_id: String },
    RequestMint { amount: Amount },
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
   NewBetPlaced { home: String, away: String, league: String, start_time: Timestamp, odd: u64, selection: String, bid: Amount, status: String, event_id: String },
   NewPredictionCreated { prediction_id: u64, event_id: String, prediction_type: PredictionType, question: String, init_vote: bool, amount: Amount },
   NewVotePlaced { event_id: String, prediction_id: u64, vote: bool, amount: Amount },
   RevertUserBet { event_id: String },
   UserClaimReward { event_id: String },
   SendPredictionReward { prediction_id: u64, event_id: String },
   ClaimResult { event_id: String, result: String},
   MintTokens { amount: Amount },
   Receive { amount: Amount },
   //power ranking cross-messages
   UpdateTeamPower { team_id: String, name: String, power: u64, form: i64, goal_average: i64 },
   //toAppChain
   NewEventCreated{event_id: String, event: Event},
   //Delta messages
   EventStatusUpdated { event_id: String, status: state::MatchStatus },
   EventScoreUpdated { event_id: String, home_score: String, away_score: String },
   EventMinuteUpdated { event_id: String, minute: u32 },
   EventMatchEventAdded { event_id: String, match_event: state::MatchEvent },
   EventOutcomeResolved { event_id: String, winner: state::Selection, home_score: String, away_score: String },
   //leaderboard cross-messages
   NewWeekStarted { week: u64, year: u64, prize_pool: Amount },
   CurrentWeekEnded { week: u64, year: u64},
}

#[derive(Debug, Serialize, Deserialize)]
pub enum Bet {
    NewEventBet { event_id: String, user_odd: UserOdd },
}

