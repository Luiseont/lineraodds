#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema};
use linera_sdk::{
    graphql::GraphQLMutationRoot, linera_base_types::WithServiceAbi, views::{View}, Service,
    ServiceRuntime,
};

use odds_contract::Operation;

use self::state::OddsContractState;
use self::state::Match;
use self::state::MatchWithId;

pub struct OddsContractService {
    state: OddsContractState,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(OddsContractService);

impl WithServiceAbi for OddsContractService {
    type Abi = odds_contract::OddsContractAbi;
}

impl Service for OddsContractService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = OddsContractState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        OddsContractService {
            state,
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, query: Self::Query) -> Self::QueryResponse {
  
        let matches_tuples: Vec<(String, Match)> = self.state.matches
            .index_values()
            .await
            .expect("Failed to get all matches from storage");

        let matches_list: Vec<MatchWithId> = matches_tuples
            .into_iter()
            .map(|(id, m)| MatchWithId {
                id, 
                status: m.status,
                league: m.league,
                teams: m.teams,
                odds: m.odds,
                start_time: m.start_time,
                result: m.result,
            })
            .collect();

        Schema::build(
            QueryRoot {
                matches: matches_list
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
    matches: Vec<MatchWithId>,
}

#[Object]
impl QueryRoot {
    async fn matches(&self) -> &Vec<MatchWithId> {
        &self.matches
    }
}