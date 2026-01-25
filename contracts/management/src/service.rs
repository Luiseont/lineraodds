#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{Object, Schema, Response, EmptySubscription };
use futures::stream::{Stream, StreamExt};
use std::pin::Pin;
use linera_sdk::{
    graphql::GraphQLMutationRoot, linera_base_types::{WithServiceAbi, Amount, DataBlobHash}, views::{View}, Service,
    ServiceRuntime
};
use management::Operation;

use self::state::{ManagementState, Event, UserOdd, UserOdds, MatchStatus, TypeEvent, BetStatus, BetsSummary, LeaderboardData};

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
        Schema::build(
            QueryRoot {
                runtime: self.runtime.clone(),
                storage_context:  self.runtime.root_view_storage_context()
            },
            Operation::mutation_root(self.runtime.clone()),
            EmptySubscription
        )   
        .finish()
        .execute(query)
        .await
    }
}

struct QueryRoot {
    runtime: Arc<ServiceRuntime<ManagementService>>,
    storage_context: linera_sdk::views::ViewStorageContext,
}

#[Object]
impl QueryRoot {
    async fn events(&self) -> Vec<Event> {
        match ManagementState::load(self.storage_context.clone()).await{
            Ok(state) => {
                let mut all_events = Vec::new();
                match state.events.indices().await {
                    Ok(event_ids) => {
                        for event_id in event_ids {
                            if let Ok(Some(event)) = state.events.get(&event_id).await {
                                all_events.push(event);
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("Failed to get event indices: {:?}", e);
                    }
                }
                all_events
            }
            Err(e) => {
                eprintln!("Failed to load state: {:?}", e);
                Vec::new()
            }
        }
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

    async fn bets_summary(&self) -> BetsSummary {
        match ManagementState::load(self.storage_context.clone()).await {
            Ok(state) => {
                let all_bets: Vec<UserOdds> = state.user_odds.get().clone();
                
                let mut total_staked = 0u128;
                let mut potential_winnings = 0u128;
                
                for bet in all_bets.iter() {
                    if matches!(bet.status, BetStatus::Placed) {
                        let bid_amount: u128 = bet.bid.try_into().unwrap_or(0);
                        total_staked += bid_amount;
                        // Calculate potential winnings: bid * (odd / 100)
                        potential_winnings += (bid_amount * (bet.odd as u128)) / 100;
                    }
                }
                
                BetsSummary {
                    total_staked: total_staked.to_string(),
                    potential_winnings: potential_winnings.to_string(),
                }
            }
            Err(e) => {
                eprintln!("Failed to load state: {:?}", e);
                BetsSummary  {
                    total_staked: "0".to_string(),
                    potential_winnings: "0".to_string(),
                }
            }
        }
    }

    async fn bonus_claimed(&self) -> bool {
        match ManagementState::load(self.storage_context.clone()).await{
            Ok(state) => {
                state.bonus_claimed.get().clone()
            }
            Err(e) => {
                eprintln!("Failed to load state: {:?}", e);
                false
            }
        }
    }

    async fn leaderboard(&self) -> LeaderboardData {
        match ManagementState::load(self.storage_context.clone()).await{
            Ok(state) => {
                state.leaderboard.get().clone()
            }
            Err(e) => {
                eprintln!("Failed to load state: {:?}", e);
                LeaderboardData::default()
            }
        }
    }
}