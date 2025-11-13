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
            Operation::UpdateEventStatus { event_id, status } => {
                assert!(self.runtime.chain_id() != self.runtime.application_creator_chain_id());
            },
            Operation::UpdateEventOdds { event_id, home_odds, away_odds, tie_odds } => {
                assert!(self.runtime.chain_id() != self.runtime.application_creator_chain_id());
            },
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
                self.state.user_odds.insert(&user_id, user_bet);

                self.runtime.prepare_message(
                    Message::NewBetPlaced { home, away, league, start_time, odd, selection, bid, status: "Placed".to_string(), event_id  }
                ).with_authentication().send_to(chain_id);

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

                self.state.events.insert(&id.clone(), event);
            }
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        match message {
            Message::NewBetPlaced { home, away, league, start_time, odd, selection, bid, status, event_id } => {
                let event = self.state.events.get(&event_id).await.expect("Event not found");
                let user_id = self.runtime.message_origin_chain_id();
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

                let _ = self.state.event_odds.insert(&event.unwrap().id.clone().to_string(), bet);
            }
        }
    }


    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}