use linera_sdk::views::{
    linera_views, MapView, RegisterView, RootView, View, ViewStorageContext,
};
use linera_sdk::linera_base_types::ChainId;
use serde::{Deserialize, Serialize};
use async_graphql::{SimpleObject, Enum};


#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct EventState {
    pub id: RegisterView<String>,
    pub status: RegisterView<MatchStatus>,
    pub type_event: RegisterView<TypeEvent>,
    pub league: RegisterView<String>,
    pub teams: Teams,
    pub odds: Odds,
    pub start_time: RegisterView<u64>,
    pub result: MatchResult,
    pub valid_odds: MapView<String, UserOdd>,
    pub factory_chain: RegisterView<Option<ChainId>>,
}

#[derive(SimpleObject, Clone, Debug, Serialize, Deserialize)]
pub struct EventInfo {
    pub id: String,
    pub status: MatchStatus,
    pub type_event: TypeEvent,
    pub league: String,
    pub teams: TeamsView,
    pub odds: OddsView,
    pub start_time: u64,
    pub result: MatchResultView,
}


#[derive(Clone, Debug, Copy, Eq, PartialEq, Serialize, Deserialize, Enum, Default)]
pub enum MatchStatus {
    #[default] Scheduled,
    Live,
    Finished,
    Postponed,
}

#[derive(Clone, Debug, Copy, Eq, PartialEq, Serialize, Deserialize, Enum, Default)]
pub enum TypeEvent {
    #[default] Football,
    Esports,
    Baseball,
}

#[derive(Clone, Debug, Copy, Eq, PartialEq, Serialize, Deserialize, Enum, Default)]
pub enum Selection {
    #[default] Home,
    Away,
    Tie,
}

#[derive(View)]
#[view(context = ViewStorageContext)]
pub struct Teams {
    pub home: RegisterView<String>,
    pub away: RegisterView<String>,
}

#[derive(View)]
#[view(context = ViewStorageContext)]
pub struct Odds {
    pub home: RegisterView<u64>,
    pub away: RegisterView<u64>,
    pub tie: RegisterView<u64>,
}

#[derive(View)]
#[view(context = ViewStorageContext)]
pub struct MatchResult {
    pub winner: RegisterView<Selection>,
    pub score: RegisterView<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject)]
pub struct UserOdd {
    pub odd: u64,
    pub selection: Selection,
}

//structs for GralphQL queries
#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject)]
pub struct TeamsView {
    pub home: String,
    pub away: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject)]
pub struct OddsView {
    pub home: u64,
    pub away: u64,
    pub tie: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject)]
pub struct MatchResultView {
    pub winner: Selection,
    pub score: String,
}