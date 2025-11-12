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
            Operation::UpdateEventStatus { chain, status } => {
                self.runtime.send_message(
                    chain.parse().unwrap(),
                    Message::EventUpdateStatus { status },
                );
            },
            Operation::UpdateEventOdds { chain, home_odds, away_odds, tie_odds } => {
                self.runtime.send_message(
                    chain.parse().unwrap(),
                    Message::UpdateOdds { home_odds, away_odds, tie_odds },
                );
            },
            Operation::PlaceBet { chain_id, selection, odds, bid } => {
                let chain_id: ChainId = chain_id.parse().unwrap();
                self.runtime.send_message(
                    chain_id,
                    Message::NewUserBet {  selection, odds, bid }
                );

            },
            Operation::CreateEvent { id, type_event, league, home, away, home_odds, away_odds, tie_odds, start_time } => {
                
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

                let permissions = ApplicationPermissions::default();
                let owner: AccountOwner = self.runtime.application_id().into();
                let ownership = ChainOwnership::single(owner);
                let chain_id = self.runtime.open_chain(ownership, permissions, Amount::ZERO);


                self.state.events.insert(&chain_id, event);

                self.runtime.send_message(
                    chain_id,
                    Message::SetEventData {
                        id,
                        type_event,
                        league,
                        home,
                        away,
                        home_odds,
                        away_odds,
                        tie_odds,
                        start_time,
                    },
                );
            }
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        match message {
            Message::NewBetPlaced { home, away, league, start_time, odd, selection, bid, status } => {
                let match_chain = self.runtime.message_origin_chain_id().unwrap();

                let selectionE = match selection.as_str() {
                    "Home" => Selection::Home,
                    "Away" => Selection::Away,
                    "Tie" => Selection::Tie,
                    _ => Selection::Home,
                };

                let statusE = match status.as_str() {
                    "Placed" => BetStatus::Placed,
                    "Won" => BetStatus::Won,
                    "Lost" => BetStatus::Lost,
                    _ => BetStatus::Placed,
                };

                let userBet = UserOdds {
                    teams: Teams {
                        home: home,
                        away: away,
                    },
                    league,
                    start_time,
                    odd,
                    selection: selectionE,
                    bid,
                    chain: match_chain.to_string(),
                    status: statusE,
                    placed_at: self.runtime.system_time(),
                };

                self.state.user_odds.push_back(userBet);
            },
            Message::NewUserBet { selection, odds, bid } => {
                let user_chain: ChainId = self.runtime.message_origin_chain_id().unwrap();

                 let selectionE = match selection.as_str() {
                    "Home" => Selection::Home,
                    "Away" => Selection::Away,
                    "Tie" => Selection::Tie,
                    _ => Selection::Home,
                 };

                let userBet = UserOdd {
                    placed_at: self.runtime.system_time(),
                    selection: selectionE,
                    odd: odds,
                    bid,
                };
                self.state.event_odds.insert(&user_chain, userBet);

                let league = self.state.event_info.get().league.clone();
                let home = self.state.event_info.get().teams.home.clone();
                let away = self.state.event_info.get().teams.away.clone();
                let start_time = self.state.event_info.get().start_time;

                self.runtime.send_message(
                    user_chain,
                    Message::NewBetPlaced { home, away, league, start_time, odd: odds, selection, bid, status: "Placed".to_string() },
                );

            },
            Message::SetEventData { id, type_event, league, home, away, home_odds, away_odds, tie_odds, start_time } => {
                
                let type_eventE = match type_event.as_str() {
                    "Football" => TypeEvent::Football,
                    "Esports" => TypeEvent::Esports,
                    "Baseball" => TypeEvent::Baseball,
                    _ => TypeEvent::Football,
                };

                let event = Event {
                    id: id,
                    status: MatchStatus::Scheduled,
                    type_event: type_eventE,
                    league: league.clone(),
                    teams: Teams { home: home, away: away },
                    odds: Odds { home: home_odds, away: away_odds, tie: tie_odds },
                    start_time,
                    result: MatchResult::default(),
                };

                self.state.event_info.set(event);
            },
            Message::EventUpdateStatus { status } => {
                let mut event = self.state.event_info.get().clone();

                match status.as_str() {
                    "Scheduled" => event.status = MatchStatus::Scheduled,
                    "Live" => event.status = MatchStatus::Live,
                    "Finished" => event.status = MatchStatus::Finished,
                    "Postponed" => event.status = MatchStatus::Postponed,
                    _ => event.status = MatchStatus::Scheduled,
                }

                self.state.event_info.set(event);
            },
            Message::UpdateOdds { home_odds, away_odds, tie_odds } => {
                let mut event = self.state.event_info.get().clone();
                event.odds.home =  home_odds;
                event.odds.away = away_odds;
                event.odds.tie = tie_odds;

                self.state.event_info.set(event);
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}