#![cfg_attr(target_arch = "wasm32", no_main)]

use linera_sdk::{
    linera_base_types::{
        Amount, WithContractAbi, StreamUpdate
    },
    views::{RootView, View},
    Contract, ContractRuntime,
};

use management::{
    Operation, Message, Matches, Event,
    state::{ManagementState, MatchStatus, Teams, Odds, MatchResult, TypeEvent, UserOdd, UserOdds, Selection, BetStatus}
};

mod contract_helper;
use contract_helper::map_json_to_event;

const STREAM_NAME: &[u8] = b"events";
pub struct ManagementContract {
    state: ManagementState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(ManagementContract);

impl WithContractAbi for ManagementContract {
    type Abi = management::ManagementAbi;
}

impl Contract for ManagementContract {
    type Message = Message;
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = Matches;

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = ManagementState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        ManagementContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        self.runtime.application_parameters();
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        match operation {
            // UserChain operations.
            Operation::Subscribe { chain_id } => {
                let app_id = self.runtime.application_id().forget_abi();
                self.runtime
                    .subscribe_to_events(chain_id, app_id, STREAM_NAME.into());

                let app_chain = self.runtime.application_creator_chain_id();

                self.runtime.prepare_message(
                    Message::RequestEventBlob
                ).with_authentication().send_to(app_chain);
            },
            Operation::Unsubscribe { chain_id } => {
                let app_id = self.runtime.application_id().forget_abi();
                self.runtime
                    .unsubscribe_from_events(chain_id, app_id, STREAM_NAME.into());
            },
            Operation::PlaceBet { home, away, league, start_time, odd, selection, bid, event_id } => {
                let user_chain_id = self.runtime.chain_id();
                let management_chain_id = self.runtime.application_creator_chain_id();
                
                let mut user_balance = self.state.user_balance.get().clone();

                if bid > user_balance {
                    panic!("No tokens enough");
                }

                let new_balance = user_balance.saturating_sub(bid);
                self.state.user_balance.set(new_balance);

                // Record bet locally
                let user_bet = UserOdds {
                    event_id: event_id.clone(),
                    teams: Teams { home: home.clone(), away: away.clone() },
                    league: league.clone(),
                    start_time,
                    odd,
                    selection: match selection.as_str() {
                        "Home" => Selection::Home,
                        "Away" => Selection::Away,
                        "Tie" => Selection::Tie,
                        _ => Selection::Home,
                    },
                    bid: bid,
                    status: BetStatus::Placed,
                    placed_at: self.runtime.system_time(),
                };

                let mut user_odds_vec = self.state.user_odds.get().clone();
                user_odds_vec.push(user_bet);
                self.state.user_odds.set(user_odds_vec);

                // Notify management chain
                self.runtime.prepare_message(
                    Message::NewBetPlaced { home, away, league, start_time, odd, selection, bid, status: "Placed".to_string(), event_id  }
                ).with_authentication().send_to(management_chain_id);
            },
            Operation::ClaimReward{ event_id } => {
                let chain_id = self.runtime.application_creator_chain_id();
                self.runtime.prepare_message(
                    Message::UserClaimReward { event_id: event_id.clone() }
                ).with_authentication().send_to(chain_id);
            },

            Operation::ProcessIncomingMessages => {
                let nonce = *self.state.nonce.get();
                let _ = self.state.nonce.set(nonce + 1);                
            },

            Operation::RequestMint{ amount } => {
                let chain_id = self.runtime.application_creator_chain_id();
                self.runtime.prepare_message(
                    Message::MintTokens { amount: amount.clone() }
                ).with_authentication().send_to(chain_id);  
            },
            //appChain Operations
            Operation::UpdateEventStatus { event_id, status } => {
                assert!(self.runtime.chain_id() != self.runtime.application_creator_chain_id());
            },
            Operation::UpdateEventOdds { event_id, home_odds, away_odds, tie_odds } => {
                assert!(self.runtime.chain_id() != self.runtime.application_creator_chain_id());
            },
            Operation::CreateEvent { id, type_event, league, home, away, home_odds, away_odds, tie_odds, start_time } => {

                assert_eq!(self.runtime.chain_id(), self.runtime.application_creator_chain_id());
                
                let type_eventE = match type_event.as_str() {
                    "Football" => TypeEvent::Football,
                    "Esports" => TypeEvent::Esports,
                    "Baseball" => TypeEvent::Baseball,
                    _ => TypeEvent::Football,
                };

                let event = Event {
                    id : id.clone(),
                    status: MatchStatus::Scheduled,
                    type_event: type_eventE,
                    league: league.clone(),
                    teams: Teams { home: home.clone(), away: away.clone() },
                    odds: Odds { home: home_odds, away: away_odds, tie: tie_odds },
                    start_time,
                    result: MatchResult::default()
                };

                 let _ = self.state.events.insert(&id.clone(), event.clone());
                 self.runtime.emit(STREAM_NAME.into(), &Matches::HandleEvent { event_id: id.clone(), data: event });
            },
            Operation::ResolveEvent { event_id, winner, home_score, away_score } => {
                let mut event = self.state.events.get(&event_id).await.expect("Event not found").unwrap();
                let victory = match winner.as_str() {
                        "Home" => Selection::Home,
                        "Away" => Selection::Away,
                        "Tie" => Selection::Tie,
                        _ => Selection::Home,
                    };

                event.result = MatchResult { winner: victory, home_score: home_score.clone(), away_score: away_score.clone() };
                event.status = MatchStatus::Finished;
                let _ = self.state.events.insert(&event_id, event.clone());
                self.runtime.emit(STREAM_NAME.into(), &Matches::HandleEvent { event_id: event_id.clone(), data: event });
            },
            Operation::UpdateBlobHash{ blob_hash } => {
                self.runtime.assert_data_blob_exists(blob_hash);
                self.state.events_blob.set(Some(blob_hash));

                self.runtime.emit(STREAM_NAME.into(), &Matches::HandleBlob { blob_hash });
            },
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        match message {
            Message::NewBetPlaced { home, away, league, start_time, odd, selection, bid, status, event_id } => {
                let user_id = self.runtime.message_origin_chain_id().unwrap();
                
                // Buscar el evento en el data blob
                let event = match self.state.events_blob.get().clone() {
                    Some(blob_hash) => {
                        let blob_content = self.runtime.read_data_blob(blob_hash);
    
                        // Deserializa a JSON genérico
                        let json_array: Vec<serde_json::Value> = serde_json::from_slice(&blob_content)
                            .expect("Error leyendo JSON genérico"); 

                        // Buscar y mapear el evento específico
                        json_array.into_iter()
                            .find(|e| e["id"].as_str().unwrap_or("") == event_id)
                            .and_then(|json_event| map_json_to_event(&json_event))
                            .expect("Event not found or invalid in blob")
                    },
                    None => {
                        self.runtime.prepare_message(
                            Message::RevertUserBet { event_id: event_id.clone() }
                        ).with_authentication().send_to(user_id);
                        return;
                    }
                };
                
                if event.status != MatchStatus::Scheduled {
                    self.runtime.prepare_message(
                        Message::RevertUserBet { event_id: event_id.clone() }
                    ).with_authentication().send_to(user_id);
                    return;
                }

                // Update event pool
                //event.pool = event.pool.saturating_add(bid);
                //self.state.events.insert(&event_id, event);

                // Record bet
                let mut bets = self.state.event_odds.get(&event_id).await.expect("Event not found").unwrap_or_default();
                let bet = UserOdd {
                    user_id: user_id.to_string(),
                    odd,
                    selection: match selection.as_str() {
                        "Home" => Selection::Home,
                        "Away" => Selection::Away,
                        "Tie" => Selection::Tie,
                        _ => Selection::Home,
                    },
                    placed_at: self.runtime.system_time(),
                    bid,
                };

                bets.push(bet);
                self.state.event_odds.insert(&event_id, bets);
            },

            Message::RevertUserBet { event_id } => {
                let mut user_odds_vec = self.state.user_odds.get().clone(); 
                for user_odd in &mut user_odds_vec {
                    if user_odd.event_id == event_id {
                        user_odd.status = BetStatus::Cancelled;
                    }
                }

                let _ = self.state.user_odds.set(user_odds_vec);
            },

            Message::UserClaimReward { event_id } => {
                let user_id = self.runtime.message_origin_chain_id().unwrap();
                
                // Buscar el evento en el data blob
                let event = match self.state.events_blob.get().clone() {
                    Some(blob_hash) => {
                        let blob_content = self.runtime.read_data_blob(blob_hash);
    
                        // Deserializa a JSON genérico
                        let json_array: Vec<serde_json::Value> = serde_json::from_slice(&blob_content)
                            .expect("Error leyendo JSON genérico"); 

                        // Buscar y mapear el evento específico
                        json_array.into_iter()
                            .find(|e| e["id"].as_str().unwrap_or("") == event_id)
                            .and_then(|json_event| map_json_to_event(&json_event))
                            .expect("Event not found or invalid in blob")
                    },
                    None => {
                        self.runtime.prepare_message(
                            Message::ClaimResult { event_id: event_id.clone(), result: "Placed".to_string() }
                        ).with_authentication().send_to(user_id);
                        return;
                    }
                };
                
                if event.status != MatchStatus::Finished {
                    self.runtime.prepare_message(
                        Message::ClaimResult { event_id: event_id.clone(), result: "Placed".to_string() }
                    ).with_authentication().send_to(user_id);
                    return; 
                }

                let bets = self.state.event_odds.get(&event_id).await.expect("Event not found").unwrap_or_default();
    
                for bet in bets.clone() {
                    if bet.user_id == user_id.to_string() {
                        if bet.selection == event.result.winner {
                            // Calculate prize
                            let prize = calculate_prize(&event, &bet);
                            
                            self.runtime.prepare_message(
                                Message::Receive { amount: prize }
                            ).with_authentication().send_to(user_id);

                            self.runtime.prepare_message(
                                Message::ClaimResult { event_id: event_id.clone(), result: "Won".to_string()  }
                            ).with_authentication().send_to(user_id);
                        } else {
                            self.runtime.prepare_message(
                                Message::ClaimResult { event_id: event_id.clone(), result: "Lost".to_string() }
                            ).with_authentication().send_to(user_id);
                        }
                    }
                }
            },

            Message::ClaimResult { event_id, result } => {
                let mut user_odds_vec = self.state.user_odds.get().clone();
                let res = match result.as_str() {
                        "Won" => BetStatus::Won,
                        "Lost" => BetStatus::Lost,
                        "Cancelled" => BetStatus::Cancelled,
                        _ => BetStatus::Placed,
                    };
                for bet in &mut user_odds_vec {
                    if bet.event_id == event_id {
                        bet.status = res;
                    }
                }
                let _ = self.state.user_odds.set(user_odds_vec);
            },
            Message::Receive { amount } => {
                let current_balance = *self.state.user_balance.get();

                let new_balance = current_balance.saturating_add(amount.into());
                self.state.user_balance.set(new_balance);
            },
            Message::MintTokens { amount } => {
                let user_chain_id = self.runtime.message_origin_chain_id().unwrap();
                let mut current_supply = self.state.token_supp.get().clone();
                let new_supply = current_supply.saturating_add(amount.into());

                self.state.token_supp.set(new_supply);  

                self.runtime.prepare_message(
                    Message::Receive { amount: amount.clone() }
                ).with_authentication().send_to(user_chain_id);
            },
            Message::ProcessIncomingMessages => {
                let _ = self.state.events_blob.set(Some(self.state.events_blob.get().unwrap()));
            },
            Message::RequestEventBlob => {
                let user_chain_id = self.runtime.message_origin_chain_id().unwrap();

                self.runtime.prepare_message(
                    Message::SyncEventsBlob { blob_hash: self.state.events_blob.get().unwrap() }
                ).with_authentication().send_to(user_chain_id);
            },
            Message::SyncEventsBlob { blob_hash } => {
                self.state.events_blob.set(Some(blob_hash));
            },  
        }
    }

    async fn process_streams(&mut self, updates: Vec<StreamUpdate>) {
        for update in updates {
            assert_eq!(update.stream_id.stream_name, STREAM_NAME.into());
            assert_eq!(
                update.stream_id.application_id,
                self.runtime.application_id().forget_abi().into()
            );
            for index in update.new_indices() {
                let event = self
                    .runtime
                    .read_event(update.chain_id, STREAM_NAME.into(), index);
                match event {
                    Matches::HandleEvent { event_id, data  } => {
                        let chain_id = self.runtime.chain_id();
                        let _ = self.state.events.insert(&event_id, data);
                        self.runtime.prepare_message(
                            Message::ProcessIncomingMessages
                        ).with_authentication().send_to(chain_id);  
                    }
                    Matches::HandleBlob { blob_hash } => {
                        let chain_id = self.runtime.chain_id();
                        self.runtime.assert_data_blob_exists(blob_hash);
                        self.state.events_blob.set(Some(blob_hash));
                        self.runtime.prepare_message(
                            Message::ProcessIncomingMessages
                        ).with_authentication().send_to(chain_id);  
                    }
                }
            }
        }
    }


    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}


/// Calculate prize based on bet amount and odds
/// Formula: prize = bet_amount * (odd / 100)
fn calculate_prize(_event: &Event, user_bet: &UserOdd) -> Amount {
    let bet_amount: u128 = user_bet.bid.into();
    let odd = user_bet.odd as u128;
    let prize = (bet_amount * odd) / 100;
    
    Amount::from_attos(prize)
}