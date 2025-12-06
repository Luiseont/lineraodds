#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Schema};
use linera_sdk::{
    graphql::GraphQLMutationRoot, linera_base_types::WithServiceAbi, views::View, Service,
    ServiceRuntime,
};

use usdl::Operation;

use self::state::UsdlState;

pub struct UsdlService {
    state: UsdlState,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(UsdlService);

impl WithServiceAbi for UsdlService {
    type Abi = usdl::UsdlAbi;
}

impl Service for UsdlService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = UsdlState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        UsdlService {
            state,
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, query: Self::Query) -> Self::QueryResponse {
        Schema::build(
            QueryRoot {
                balance: self.state.balance.get().clone().to_string(),
            },
            Operation::mutation_root(self.runtime.clone()),
            EmptySubscription,
        )
        .finish()
        .execute(query)
        .await
    }
}

struct QueryRoot {
    balance: String,
}

#[Object]
impl QueryRoot {
    async fn balance(&self) -> &String {
        &self.balance
    }
}