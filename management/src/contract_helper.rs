
use management::{
    Event, 
    state::{MatchStatus, TypeEvent, Teams, Odds, Selection, MatchResult}
};

pub fn map_json_to_event(json: &serde_json::Value) -> Option<Event> {
    use linera_sdk::linera_base_types::Timestamp;
    
    let id = json["id"].as_str()?.to_string();
    let league = json["league"].as_str()?.to_string();
    
    // Mapear status
    let status = match json["status"].as_str()? {
        "Scheduled" => MatchStatus::Scheduled,
        "Live" => MatchStatus::Live,
        "Finished" => MatchStatus::Finished,
        "Postponed" => MatchStatus::Postponed,
        _ => MatchStatus::Scheduled,
    };
    
    // Mapear typeEvent
    let type_event = match json["typeEvent"].as_str()? {
        "Football" => TypeEvent::Football,
        "Esports" => TypeEvent::Esports,
        "Baseball" => TypeEvent::Baseball,
        _ => TypeEvent::Football,
    };
    
    // Mapear teams
    let teams = Teams {
        home: json["teams"]["home"].as_str()?.to_string(),
        away: json["teams"]["away"].as_str()?.to_string(),
    };
    
    // Mapear odds
    let odds = Odds {
        home: json["odds"]["home"].as_u64()?,
        away: json["odds"]["away"].as_u64()?,
        tie: json["odds"]["tie"].as_u64()?,
    };
    
    // Mapear startTime
    let start_time = Timestamp::from(json["startTime"].as_u64()?);
    
    // Mapear result
    let winner = match json["result"]["winner"].as_str()? {
        "Home" => Selection::Home,
        "Away" => Selection::Away,
        "Tie" => Selection::Tie,
        _ => Selection::Home,
    };
    
    let result = MatchResult {
        winner,
        home_score: json["result"]["homeScore"].as_str().unwrap_or("").to_string(),
        away_score: json["result"]["awayScore"].as_str().unwrap_or("").to_string(),
    };
    
    Some(Event {
        id,
        status,
        type_event,
        league,
        teams,
        odds,
        start_time,
        result,
    })
}
