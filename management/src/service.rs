#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Schema, Response};
use linera_sdk::{
    graphql::GraphQLMutationRoot, linera_base_types::{WithServiceAbi, Amount, DataBlobHash}, views::{View}, Service,
    ServiceRuntime
};
use management::Operation;

use self::state::{ManagementState, Event, UserOdd, UserOdds, MatchStatus, TypeEvent, Teams, Odds, Selection, MatchResult};

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
            EmptySubscription,
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

    async fn events_blob(&self) -> String {
        match ManagementState::load(self.storage_context.clone()).await{
            Ok(state) => {
                let hash = state.events_blob.get().clone();
                match hash {
                    Some(h) => {
                        let blob_content = self.runtime.read_data_blob(h);
                        String::from_utf8(blob_content)
                            .unwrap_or_else(|_| "{}".into())
                    },
                    None => "{}".to_string(),
                }
            }
            Err(e) => {
                eprintln!("Failed to load state: {:?}", e);
                "{}".to_string()
            }
        }
    }

    async fn blob_events(&self) -> Vec<Event> {
        match ManagementState::load(self.storage_context.clone()).await{
            Ok(state) => {
                let hash = state.events_blob.get().clone();
                match hash {
                    Some(h) => {
                        let blob_content = self.runtime.read_data_blob(h);
                        
                        // Deserializar a JSON genérico primero
                        let json_array: Vec<serde_json::Value> = match serde_json::from_slice(&blob_content) {
                            Ok(arr) => arr,
                            Err(e) => {
                                eprintln!("Error parsing JSON array: {}", e);
                                return Vec::new();
                            }
                        };

                        // Mapear manualmente cada evento
                        json_array.into_iter()
                            .filter_map(|json_event| {
                                map_json_to_event(&json_event)
                            })
                            .collect()
                    },
                    None => Vec::new(),
                }
            }
            Err(e) => {
                eprintln!("Failed to load state: {:?}", e);
                Vec::new()
            }
        }
    }

    async fn get_block_height(&self) -> u64 {
        self.runtime.next_block_height().into()
    }
}

fn map_json_to_event(json: &serde_json::Value) -> Option<Event> {
    use linera_sdk::linera_base_types::Timestamp;
    
    let id = json["id"].as_str()?.to_string();
    let league = json["league"].as_str()?.to_string();
    
    // Mapear status
    let status = match json["status"].as_str()? {
        "Scheduled" => MatchStatus::Scheduled,
        "Live" => MatchStatus::Live,
        "Finished" => MatchStatus::Finished,
        "Postponed" => MatchStatus::Postponed,
        _ => MatchStatus::Scheduled,
    };
    
    // Mapear typeEvent
    let type_event = match json["typeEvent"].as_str()? {
        "Football" => TypeEvent::Football,
        "Esports" => TypeEvent::Esports,
        "Baseball" => TypeEvent::Baseball,
        _ => TypeEvent::Football,
    };
    
    // Mapear teams
    let teams = Teams {
        home: json["teams"]["home"].as_str()?.to_string(),
        away: json["teams"]["away"].as_str()?.to_string(),
    };
    
    // Mapear odds
    let odds = Odds {
        home: json["odds"]["home"].as_u64()?,
        away: json["odds"]["away"].as_u64()?,
        tie: json["odds"]["tie"].as_u64()?,
    };
    
    // Mapear startTime
    let start_time = Timestamp::from(json["startTime"].as_u64()?);
    
    // Mapear result
    let winner = match json["result"]["winner"].as_str()? {
        "Home" => Selection::Home,
        "Away" => Selection::Away,
        "Tie" => Selection::Tie,
        _ => Selection::Home,
    };
    
    let result = MatchResult {
        winner,
        home_score: json["result"]["homeScore"].as_str().unwrap_or("").to_string(),
        away_score: json["result"]["awayScore"].as_str().unwrap_or("").to_string(),
    };
    
    Some(Event {
        id,
        status,
        type_event,
        league,
        teams,
        odds,
        start_time,
        result,
    })
}
