
pub mod state;

use async_graphql::{Request, Response};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{ContractAbi, ServiceAbi, Amount, Timestamp, ChainId},
};
use serde::{Deserialize, Serialize};

pub use self::state::{Event, UserOdd};
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
    PlaceBet{ home_id: String, away_id: String, home_name: String, away_name: String, league: String, start_time: Timestamp, odd: u64, selection: String, bid: Amount, event_id: String},
    ClaimReward { event_id: String },
    RequestMint { amount: Amount },
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
   NewBetPlaced { home: String, away: String, league: String, start_time: Timestamp, odd: u64, selection: String, bid: Amount, status: String, event_id: String },
   RevertUserBet { event_id: String },
   UserClaimReward { event_id: String },
   ClaimResult { event_id: String, result: String},
   MintTokens { amount: Amount },
   Receive { amount: Amount },
   //power ranking cross-messages
   UpdateTeamPower { team_id: String, name: String, power: u64, form: i64, goal_average: i64 },
   //toAppChain
   NewEventCreated{event_id: String, event: Event},
   EventUpdated{event_id: String, event: Event},
   //leaderboard cross-messages
   NewWeekStarted { week: u64, year: u64, prize_pool: Amount },
   CurrentWeekEnded { week: u64, year: u64},
}

#[derive(Debug, Serialize, Deserialize)]
pub enum Bet {
    NewEventBet { event_id: String, user_odd: UserOdd },
}

