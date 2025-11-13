#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Schema};
use linera_sdk::{
    graphql::GraphQLMutationRoot, linera_base_types::{WithServiceAbi, ChainId}, views::{View}, Service,
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
        let user_bets_pairs: Vec<(String, UserOdds)> = self
            .state
            .user_odds 
            .index_values()
            .await
            .expect("Failed to read user_odds");

        let user_bets: Vec<UserOdds> = user_bets_pairs
            .into_iter()
            .map(|(_k, v)| v)
            .collect();

        // Collect all odds from the event_odds map
       let odds_pairs: Vec<(String, UserOdd)> = self
            .state
            .event_odds
            .index_values()
            .await
            .expect("Failed to read event_odds");

        let odds_event: Vec<UserOdd> = odds_pairs
            .into_iter()
            .map(|(_k, v)| v)
            .collect();

        let event_pairs: Vec<(String, Event)> = self
            .state
            .events
            .index_values()
            .await
            .expect("Failed to read events");

        let all_events: Vec<Event> = event_pairs
            .into_iter()
            .map(|(_k, v)| v)
            .collect();

        Schema::build(
            QueryRoot {
                odds: odds_event,
                events: all_events,
                my_odds: user_bets,
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
    odds: Vec<UserOdd>,
    events: Vec<Event>,
    my_odds: Vec<UserOdds>,
}

#[Object]
impl QueryRoot {
    async fn odds(&self) -> &Vec<UserOdd> {
        &self.odds
    }
    async fn events(&self) -> &Vec<Event> {
        &self.events
    }
    async fn my_odds(&self) -> &Vec<UserOdds> {
        &self.my_odds
    }
}

