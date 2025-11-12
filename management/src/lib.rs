
use async_graphql::{Request, Response};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{ContractAbi, ServiceAbi},
};
use serde::{Deserialize, Serialize};


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
    CreateEvent{ id: String, type_event: String, league: String, home:String, away:String, home_odds:u64, away_odds:u64, tie_odds:u64, start_time:u64},
    UpdateEventStatus{ chain: String, status: String },
    UpdateEventOdds{ chain: String, home_odds:u64, away_odds:u64, tie_odds:u64 },
    PlaceBet{ chain_id: String, selection: String, odds: u64, bid: u64},
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
   SetEventData { id: String, type_event: String, league: String, home:String, away:String, home_odds:u64, away_odds:u64, tie_odds:u64, start_time:u64 },
   EventUpdateStatus { status: String },
   UpdateOdds { home_odds:u64, away_odds:u64, tie_odds:u64 },
   NewUserBet { selection: String, odds: u64, bid: u64},
   NewBetPlaced { home: String, away: String, league: String, start_time: u64, odd: u64, selection: String, bid: u64, status: String },
}

