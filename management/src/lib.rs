
pub mod state;

use async_graphql::{Request, Response};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{ContractAbi, ServiceAbi, Amount, Timestamp, ChainId, DataBlobHash},
};
use serde::{Deserialize, Serialize};

pub use self::state::{Event};

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
    UpdateBlobHash{ blob_hash: DataBlobHash },
    //userChain
    PlaceBet{ home: String, away: String, league: String, start_time: Timestamp, odd: u64, selection: String, bid: Amount, event_id: String},
    ClaimReward { event_id: String },
    RequestMint { amount: Amount },
    Subscribe { chain_id: ChainId },
    Unsubscribe { chain_id: ChainId }
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
   NewBetPlaced { home: String, away: String, league: String, start_time: Timestamp, odd: u64, selection: String, bid: Amount, status: String, event_id: String },
   RevertUserBet { event_id: String },
   UserClaimReward { event_id: String },
   ClaimResult { event_id: String, result: String},
   MintTokens { amount: Amount },
   Receive { amount: Amount },
   RequestEventBlob,
   SyncEventsBlob{ blob_hash: DataBlobHash },
   ProcessFromOracle { blob_hash: DataBlobHash },
}

#[derive(Debug, Serialize, Deserialize)]
pub enum Matches {
    HandleBlob { blob_hash: DataBlobHash },
}

