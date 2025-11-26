#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Schema};
use linera_sdk::{
    graphql::GraphQLMutationRoot, linera_base_types::{WithServiceAbi, Amount}, views::{View}, Service,
    ServiceRuntime,
};

use management::Operation;

use self::state::{ManagementState, Event, UserOdd, UserOdds};

pub struct ManagementService {
    state: ManagementState,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(ManagementService);

impl WithServiceAbi for ManagementService {
    type Abi = management::ManagementAbi;
}

impl Service for ManagementService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = ManagementState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        ManagementService {
            state,
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, query: Self::Query) -> Self::QueryResponse {

        let mut all_events = Vec::new();
        match self.state.events.indices().await {
            Ok(event_ids) => {
                for event_id in event_ids {
                    if let Ok(Some(event)) = self.state.events.get(&event_id).await {
                        all_events.push(event);
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to get event indices: {:?}", e);
            }
        }

        Schema::build(
            QueryRoot {
                events: all_events,
                runtime: self.runtime.clone(),
                storage_context:  self.runtime.root_view_storage_context()
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
    events: Vec<Event>,
    runtime: Arc<ServiceRuntime<ManagementService>>,
    storage_context: linera_sdk::views::ViewStorageContext,
}

#[Object]
impl QueryRoot {
    async fn events(&self) -> &Vec<Event> {
        &self.events
    }

    async fn event_odds(&self, event_id: String ) -> Vec<UserOdd> {
        match ManagementState::load(self.storage_context.clone()).await{
            Ok(state) => {
                state.event_odds.get(&event_id).await.expect("Event not found").unwrap_or_default()
            }
            Err(e) => {
                eprintln!("Failed to load state: {:?}", e);
                Vec::new()
            }
        }
    }

    async fn my_odds(&self) -> Vec<UserOdds>{
        match ManagementState::load(self.storage_context.clone()).await{
            Ok(state) => {
                state.user_odds.get().clone()
            }
            Err(e) => {
                eprintln!("Failed to load state: {:?}", e);
                Vec::new()
            }
        }
    }

    async fn balance(&self) -> Amount {
                match ManagementState::load(self.storage_context.clone()).await{
            Ok(state) => {
                state.user_balance.get().clone()
            }
            Err(e) => {
                eprintln!("Failed to load state: {:?}", e);
                Amount::from_tokens(0)
            }
        }
    }   
}
