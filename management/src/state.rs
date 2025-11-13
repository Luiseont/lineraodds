use linera_sdk::views::{linera_views, RegisterView, RootView, ViewStorageContext, MapView, QueueView };
use linera_sdk::linera_base_types::{ChainId, AccountOwner, Timestamp};
use serde::{Deserialize, Serialize};
use async_graphql::{SimpleObject, Enum};

#[derive(RootView, SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct ManagementState {
    pub events: MapView<String, Event>,
    pub event_odds: MapView<String, UserOdd>,
    pub user_odds: MapView<String, UserOdds>,
}


#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, Default)]
pub struct Event {
    pub id: String,
    pub status: MatchStatus,
    pub type_event: TypeEvent,
    pub league: String,
    pub teams: Teams,
    pub odds: Odds,
    pub start_time: u64,
    pub result: MatchResult
}

#[derive(Clone, Debug, Copy, Eq, PartialEq, Serialize, Deserialize, Enum, Default)]
pub enum EventStatus {
    #[default] Scheduled,
    Live,
    Finished,
    Postponed,
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

#[derive(Clone, Debug, Copy, Eq, PartialEq, Serialize, Deserialize, Enum, Default)]
pub enum BetStatus {
    #[default] Placed,
    Won,
    Lost,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, SimpleObject)]
pub struct Teams {
    pub home: String,
    pub away: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default,SimpleObject)]
pub struct Odds {
    pub home: u64,
    pub away: u64,
    pub tie: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, SimpleObject)]
pub struct MatchResult {
    pub winner: Selection,
    pub score: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject)]
pub struct UserOdd {
    pub user_id: String,
    pub odd: u64,
    pub selection: Selection,
    pub placed_at: Timestamp,
    pub bid: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject, Default)]
pub struct UserOdds {
    pub teams: Teams,
    pub league: String,
    pub start_time: u64,
    pub odd: u64,
    pub selection: Selection,
    pub placed_at: Timestamp,
    pub bid: u64,
    pub event_id: String,
    pub status: BetStatus
}