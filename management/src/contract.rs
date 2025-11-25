#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    linera_base_types::{
        ApplicationPermissions, Amount, WithContractAbi, ChainOwnership, ChainId, AccountOwner
    },
    views::{RootView, View},
    Contract, ContractRuntime,
};

use management::{Operation, Message};

use self::state::{ManagementState, Event, MatchStatus, Teams, Odds, MatchResult, TypeEvent, UserOdd, UserOdds, Selection, BetStatus};

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
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = ManagementState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        ManagementContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        // validate that the application parameters were configured correctly.
        self.runtime.application_parameters();
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        match operation {
            // UserChain operations.
            Operation::PlaceBet { home, away, league, start_time, odd, selection, bid, event_id } => {
                let user_id = self.runtime.chain_id().to_string();
                let chain_id = self.runtime.application_creator_chain_id();
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
                    bid,
                    status: BetStatus::Placed,
                    placed_at: self.runtime.system_time(),
                };

                let mut user_odds_vec = self.state.user_odds.get().clone();
                user_odds_vec.push(user_bet);
                let _ = self.state.user_odds.set(user_odds_vec);

                self.runtime.prepare_message(
                    Message::NewBetPlaced { home, away, league, start_time, odd, selection, bid, status: "Placed".to_string(), event_id  }
                ).with_authentication().send_to(chain_id);

            },
            Operation::ClaimReward{ event_id } => {
                let chain_id = self.runtime.application_creator_chain_id();
                self.runtime.prepare_message(
                    Message::UserClaimReward { event_id: event_id.clone() }
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
                    result: MatchResult::default(),
                };

                 let _ = self.state.events.insert(&id.clone(), event);
            }

            Operation::ResolveEvent { event_id, winner, home_score, away_score } => {
                let mut event = self.state.events.get(&event_id).await.expect("Event not found").unwrap_or_default();
                let victory = match winner.as_str() {
                        "Home" => Selection::Home,
                        "Away" => Selection::Away,
                        "Tie" => Selection::Tie,
                        _ => Selection::Home,
                    };

                event.result = MatchResult { winner: victory, home_score: home_score.clone(), away_score: away_score.clone() };
                event.status = MatchStatus::Finished;
                let _ = self.state.events.insert(&event_id, event);
            }
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        match message {
            Message::NewBetPlaced { home, away, league, start_time, odd, selection, bid, status, event_id } => {
                let user_id = self.runtime.message_origin_chain_id();
                let event = self.state.events.get(&event_id).await.expect("Event not found").unwrap_or_default();
                if event.status != MatchStatus::Scheduled {
                    self.runtime.prepare_message(
                        Message::RevertUserBet { event_id: event_id.clone() }
                    ).with_authentication().send_to(user_id.unwrap());
                    return;
                }

                let mut bets = self.state.event_odds.get(&event_id).await.expect("Event not found").unwrap_or_default();
                let bet = UserOdd {
                    user_id: user_id.unwrap().to_string(),
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

                let _ = self.state.event_odds.insert(&event_id, bets);
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
                let user_id = self.runtime.message_origin_chain_id();
                let event = self.state.events.get(&event_id).await.expect("Event not found").unwrap_or_default();
                if event.status != MatchStatus::Finished {
                    self.runtime.prepare_message(
                        Message::ClaimResult { event_id: event_id.clone(), result: "Placed".to_string() }
                    ).with_authentication().send_to(user_id.unwrap());
                    return; 
                }

                let bets = self.state.event_odds.get(&event_id).await.expect("Event not found").unwrap_or_default();
                for bet in bets.clone() {
                    if bet.user_id == user_id.unwrap().to_string() {
                        if bet.selection == event.result.winner {
                            let _ = self.runtime.prepare_message(
                                Message::ClaimResult { event_id: event_id.clone(), result: "Won".to_string()  }
                            ).with_authentication().send_to(user_id.unwrap());
                            //TODO: prize calculations and call fungible aplication to send tokens
                        } else {
                            let _ = self.runtime.prepare_message(
                                Message::ClaimResult { event_id: event_id.clone(), result: "Lost".to_string() }
                            ).with_authentication().send_to(user_id.unwrap());
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
            }
        }
    }


    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}