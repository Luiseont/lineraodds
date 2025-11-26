#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    linera_base_types::{WithContractAbi, Amount},
    views::{RootView, View},
    Contract, ContractRuntime,
};

use usdl::{Message, Operation};

use self::state::UsdlState;

pub struct UsdlContract {
    state: UsdlState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(UsdlContract);

impl WithContractAbi for UsdlContract {
    type Abi = usdl::UsdlAbi;
}

impl Contract for UsdlContract {
    type Message = Message;
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = UsdlState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        UsdlContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        // Inicializar el estado del token
        self.state.ticker.set("USDL".to_string());
        self.state.total_supply.set(0);
        self.state.balance.set(0);
        self.state.nonce.set(0);
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        match operation {
            Operation::Transfer { destination, amount } => {
                // Verificar que el monto no sea cero
                assert!(amount != Amount::ZERO, "Cannot transfer zero amount");
                // Verificar que no sea a la misma chain    
                assert!(destination != self.runtime.chain_id(), "Cannot transfer to self");
                
                let current_balance = *self.state.balance.get();
                
                // Verificar que tengamos suficiente balance
                assert!(current_balance >= amount.into(), "Insufficient balance");
                
                let new_balance = current_balance.saturating_sub(amount.into());
                self.state.balance.set(new_balance);

                // Incrementar nonce para prevenir replay attacks
                let current_nonce = *self.state.nonce.get();
                self.state.nonce.set(current_nonce + 1);

                self.runtime
                    .prepare_message(Message::Receive { amount })
                    .with_authentication()
                    .send_to(destination);
            }

            Operation::Mint { amount } => {
                let current_balance = *self.state.balance.get();
                let new_balance = current_balance.saturating_add(amount.into());
                self.state.balance.set(new_balance);
            }
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        match message {
            Message::Receive { amount } => {
                let current_balance = *self.state.balance.get();

                let new_balance = current_balance.saturating_add(amount.into());
                self.state.balance.set(new_balance);
            },
            Message::UpdateSupply { amount } => {
                let current_supply = *self.state.total_supply.get();

                let new_supply = current_supply.saturating_add(amount.into());
                self.state.total_supply.set(new_supply);
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}