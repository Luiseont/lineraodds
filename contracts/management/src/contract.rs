#![cfg_attr(target_arch = "wasm32", no_main)]

use linera_sdk::{
    linera_base_types::{
        Amount, WithContractAbi, StreamUpdate
    },
    views::{RootView, View},
    Contract, ContractRuntime,
};

use management::{
    Operation, Message, Bet, Event,
    state::{ManagementState, MatchStatus, Teams, Odds, MatchResult, TypeEvent, UserOdd, UserOdds, Selection, BetStatus}
};

const STREAM_NAME: &[u8] = b"bets";
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
    type EventValue = Bet;

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
            //oracleChain operations
            Operation::Subscribe { chain_id } => {
                let app_id = self.runtime.application_id().forget_abi();
                self.runtime
                    .subscribe_to_events(chain_id, app_id, STREAM_NAME.into());
            },  
            Operation::Unsubscribe{ chain_id } => {
                let app_id = self.runtime.application_id().forget_abi();
                self.runtime
                    .unsubscribe_from_events(chain_id, app_id, STREAM_NAME.into());
            },
            Operation::UpdateEventStatus { event_id, status } => {
                //assert!(self.runtime.chain_id() != self.runtime.application_creator_chain_id());
                let management_chain_id = self.runtime.application_creator_chain_id();
                let event = self.state.events.get(&event_id).await.expect("Event not found").unwrap();

                let new_status = match status.as_str() {
                    "Scheduled" => MatchStatus::Scheduled,
                    "Live" => MatchStatus::Live,
                    "Finished" => MatchStatus::Finished,
                    "Postponed" => MatchStatus::Postponed,
                    _ => MatchStatus::Scheduled,
                };

                let new_event = Event {
                    id: event_id.clone(),
                    status: new_status,
                    type_event: event.type_event,   
                    league: event.league,
                    teams: event.teams,
                    odds: event.odds,
                    start_time: event.start_time,
                    result: event.result,
                };
                let _ = self.state.events.insert(&event_id, new_event.clone());

                self.runtime.prepare_message(
                    Message::EventUpdated { event_id: event_id.clone(), event: new_event.clone() }
                ).with_authentication().send_to(management_chain_id);
            },
            Operation::UpdateEventOdds { event_id, home_odds, away_odds, tie_odds } => {
                //assert!(self.runtime.chain_id() != self.runtime.application_creator_chain_id());
                let management_chain_id = self.runtime.application_creator_chain_id();
                let event = self.state.events.get(&event_id).await.expect("Event not found").unwrap();
                let odds = Odds {
                    home: home_odds,
                    away: away_odds,
                    tie: tie_odds,
                };
                let new_event = Event {
                    id: event_id.clone(),
                    status: event.status,
                    type_event: event.type_event,
                    league: event.league,
                    teams: event.teams,
                    odds: odds,
                    start_time: event.start_time,
                    result: event.result,
                };
                let _ = self.state.events.insert(&event_id, new_event.clone()); 
                
                self.runtime.prepare_message(
                    Message::EventUpdated { event_id: event_id.clone(), event: new_event.clone() }
                ).with_authentication().send_to(management_chain_id);
                
            },
            Operation::CreateEvent { id, type_event, league, home, away, home_odds, away_odds, tie_odds, start_time } => {

                //assert_eq!(self.runtime.chain_id(), self.runtime.application_creator_chain_id());
                let management_chain_id = self.runtime.application_creator_chain_id();
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
                    result: MatchResult::default(),
                };

                 let _ = self.state.events.insert(&id.clone(), event.clone());

                 self.runtime.prepare_message(
                    Message::NewEventCreated { event_id: id.clone(), event: event.clone() }
                ).with_authentication().send_to(management_chain_id);

            },
            Operation::ResolveEvent { event_id, winner, home_score, away_score } => {
                let management_chain_id = self.runtime.application_creator_chain_id();
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
                
                self.runtime.prepare_message(
                    Message::EventUpdated { event_id: event_id.clone(), event: event.clone() }
                ).with_authentication().send_to(management_chain_id);
            },
            // UserChain operations.
            Operation::PlaceBet { home, away, league, start_time, odd, selection, bid, event_id } => {
                let user_chain_id = self.runtime.chain_id();
                let management_chain_id = self.runtime.application_creator_chain_id();
                
                let user_balance = self.state.user_balance.get().clone();

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
            Operation::RequestMint{ amount } => {
                let chain_id = self.runtime.application_creator_chain_id();
                self.runtime.prepare_message(
                    Message::MintTokens { amount: amount.clone() }
                ).with_authentication().send_to(chain_id);  
            },
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        match message {
            Message::NewBetPlaced { home, away, league, start_time, odd, selection, bid, status, event_id } => {
                let user_id = self.runtime.message_origin_chain_id().unwrap();
                let event   = self.state.events.get(&event_id).await.expect("Event not found").unwrap();
                
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

                bets.push(bet.clone());
                let _ = self.state.event_odds.insert(&event_id, bets);
                self.runtime.emit(STREAM_NAME.into(), &Bet::NewEventBet { event_id, user_odd: bet });
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
                let event   = self.state.events.get(&event_id).await.expect("Event not found").unwrap();
                
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
            Message::NewEventCreated { event_id, event } =>{
                let _ = self.state.events.insert(&event_id.clone(), event.clone());
            },
            Message::EventUpdated { event_id, event } => {
                let _ = self.state.events.insert(&event_id.clone(), event.clone());
            }
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
                    Bet::NewEventBet { event_id, user_odd } => {
                        let mut odds = self.state.event_odds.get(&event_id).await.expect("Event not found").unwrap(); 
                        odds.push(user_odd);
                        let _ = self.state.event_odds.insert(&event_id, odds);
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