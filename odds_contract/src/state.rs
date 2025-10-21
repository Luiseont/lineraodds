use linera_sdk::views::{linera_views, MapView, RootView, ViewStorageContext};
use serde::{Deserialize, Serialize};
#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct OddsContractState {
    pub matches: MapView<String, Match>,
}

#[derive(Clone, Serialize, Deserialize,async_graphql::SimpleObject)]
pub struct Match{
    pub status: MatchStatus,
    pub league: String,
    pub teams: Teams,
    pub odds: Odds,
    pub start_time: u64,
    pub result: MatchResult,
}

#[derive(Debug, Clone, async_graphql::SimpleObject)]
pub struct MatchWithId {
    pub id: String, 
    pub status: MatchStatus,
    pub league: String,
    pub teams: Teams,
    pub odds: Odds,
    pub start_time: u64,
    pub result: MatchResult,
}

#[derive(Clone, Debug, Copy, Eq, PartialEq, Serialize, Deserialize, async_graphql::Enum)]
pub enum MatchStatus {
    Scheduled,
    Live,
    Finished,
    Postponed,
}

#[derive(Clone, Debug, Serialize, Deserialize,async_graphql::SimpleObject)]
pub struct Teams{
    pub home: String,
    pub away: String,
}

#[derive(Clone, Debug, Serialize, Deserialize,async_graphql::SimpleObject)]
pub struct Odds{
    pub home: u64,
    pub away: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize,async_graphql::SimpleObject)]
pub struct MatchResult {
    pub winner: String,
    pub score: String,
}