#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    linera_base_types::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
};

use odds_contract::Operation;

use self::state::OddsContractState;
use self::state::Match;
use self::state::MatchStatus;
use self::state::Teams;
use self::state::Odds;
use self::state::MatchResult;

pub struct OddsContractContract {
    state: OddsContractState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(OddsContractContract);

impl WithContractAbi for OddsContractContract {
    type Abi = odds_contract::OddsContractAbi;
}

impl Contract for OddsContractContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = OddsContractState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        OddsContractContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        // validate that the application parameters were configured correctly.
        self.runtime.application_parameters();
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        match operation {
            Operation::AddMatch { id, league, home_team, away_team, home_odds, away_odds, start_time } => {
                let uuid = id.to_string();
                let teams = Teams {
                    home: home_team,
                    away: away_team,
                };
                let odds = Odds {
                    home: home_odds,
                    away: away_odds,
                };

                let status = MatchStatus::Scheduled;

                let result = MatchResult {
                    winner: String::new(),
                    score: String::new(),
                };

                let match_data = Match{
                    status,
                    league,
                    teams,
                    odds,
                    start_time,
                    result,
                };

                 let _result = self.state.matches.insert(&uuid, match_data);
            },

            Operation::UpdateOdds { match_id, home_odds, away_odds } => {
                if let Some(mut match_data) = self.state.matches.get(&match_id).await.expect("Failed to get match") {
                    match_data.odds.home = home_odds;
                    match_data.odds.away = away_odds;
                     let _result = self.state.matches.insert(&match_id, match_data);
                }
            },

            Operation::SetMatchResult { match_id, winner, score } => {
                if let Some(mut match_data) = self.state.matches.get(&match_id).await.expect("Failed to get match") {
                    match_data.result.winner = winner;
                    match_data.result.score = score;
                    match_data.status = MatchStatus::Finished;
                    let _result = self.state.matches.insert(&match_id, match_data);
                }
            },
        }
    }

    async fn execute_message(&mut self, _message: Self::Message) {}

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}