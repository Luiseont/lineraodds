#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    linera_base_types::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
};

use event::Operation;

use self::state::{EventState, MatchStatus};

pub struct EventContract {
    state: EventState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(EventContract);

impl WithContractAbi for EventContract {
    type Abi = event::EventAbi;
}

impl Contract for EventContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = EventState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        EventContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        // validate that the application parameters were configured correctly.
        self.runtime.application_parameters();
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        match operation {
            Operation::SetStatus { status } => {
                match status.as_str() {
                    "Scheduled" => self.state.status.set(MatchStatus::Scheduled),
                    "Live" => self.state.status.set(MatchStatus::Live),
                    "Finished" => self.state.status.set(MatchStatus::Finished),
                    "Postponed" => self.state.status.set(MatchStatus::Postponed),
                    _ => (),
                }
            }
        }
    }

    async fn execute_message(&mut self, _message: Self::Message) {}

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}