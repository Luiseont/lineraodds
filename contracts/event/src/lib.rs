use async_graphql::{Request, Response};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{ContractAbi, ServiceAbi},
};
use serde::{Deserialize, Serialize};

pub struct EventAbi;

impl ContractAbi for EventAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for EventAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    SetStatus { status: String },
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
   
}


