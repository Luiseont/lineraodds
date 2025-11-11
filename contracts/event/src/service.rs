#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Schema};
use linera_sdk::{
    graphql::GraphQLMutationRoot, linera_base_types::WithServiceAbi, views::View, Service,
    ServiceRuntime,
};

use event::Operation;

use self::state::{EventState, EventInfo, TeamsView, OddsView, MatchResultView};

pub struct EventService {
    state: EventState,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(EventService);

impl WithServiceAbi for EventService {
    type Abi = event::EventAbi;
}

impl Service for EventService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = EventState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        EventService {
            state,
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, query: Self::Query) -> Self::QueryResponse {

        Schema::build(
            QueryRoot { 
                info: EventInfo {
                    id: self.state.id.get().clone(),
                    status: self.state.status.get().clone(),
                    type_event: self.state.type_event.get().clone(),
                    league: self.state.league.get().clone(),
                    teams: TeamsView {
                        home: self.state.teams.home.get().clone(),
                        away: self.state.teams.away.get().clone(),
                    },
                    odds: OddsView {
                        home: self.state.odds.home.get().clone(),
                        tie: self.state.odds.tie.get().clone(),
                        away: self.state.odds.away.get().clone(),
                    },
                    start_time: self.state.start_time.get().clone(),
                    result: MatchResultView {
                        winner: self.state.result.winner.get().clone(),
                        score: self.state.result.score.get().clone(),
                    },
                } 
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
    info: EventInfo,
}

#[Object]
impl QueryRoot {
    async fn event_info(&self) -> EventInfo {
        self.info.clone()
    }
}