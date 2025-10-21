use async_graphql::{Request, Response};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{ContractAbi, ServiceAbi},
};
use serde::{Deserialize, Serialize};

pub struct OddsContractAbi;

impl ContractAbi for OddsContractAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for OddsContractAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    AddMatch { 
        id: String, 
        league: String, 
        home_team: String, 
        away_team: String, 
        home_odds: u64, 
        away_odds: u64, 
        start_time: u64 
    },
    UpdateOdds {
        match_id: String,
        home_odds: u64,
        away_odds: u64,
    },
    SetMatchResult {
        match_id: String,
        winner: String,
        score: String,
    },
}
