use linera_sdk::views::{linera_views, RegisterView, RootView, ViewStorageContext};

#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct UsdlState {
    pub ticker: RegisterView<String>,
    pub total_supply: RegisterView<u128>,
    pub balance: RegisterView<u128>,
    pub nonce: RegisterView<u64>
}
