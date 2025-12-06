use async_graphql::{Request, Response};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{ChainId, ContractAbi, ServiceAbi, Amount},
};
use serde::{Deserialize, Serialize};

pub struct UsdlAbi;

impl ContractAbi for UsdlAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for UsdlAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
    Receive { amount: Amount },
    UpdateSupply { amount: Amount }
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    Transfer {
        destination: ChainId,
        amount: Amount,
    },
    Mint { amount: Amount },
}
