
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
    CreateEvent { id: String, type_event: String, league: String, home: String, away: String, home_odds: u64, away_odds: u64, tie_odds: u64, start_time: Timestamp },
    UpdateEventStatus { event_id: String, status: String },
    UpdateEventOdds { event_id: String, home_odds: u64, away_odds: u64, tie_odds: u64 },
    ResolveEvent { event_id: String, winner: String, home_score: String, away_score: String },
    //userChain
    PlaceBet{ home: String, away: String, league: String, start_time: Timestamp, odd: u64, selection: String, bid: Amount, event_id: String},
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
   //toAppChain
   NewEventCreated{event_id: String, event: Event},
   EventUpdated{event_id: String, event: Event}
}

#[derive(Debug, Serialize, Deserialize)]
pub enum Bet {
    NewEventBet { event_id: String, user_odd: UserOdd },
}

