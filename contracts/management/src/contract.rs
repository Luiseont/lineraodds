#![cfg_attr(target_arch = "wasm32", no_main)]

use linera_sdk::{
    linera_base_types::{
        Amount, WithContractAbi, StreamUpdate, ChainId
    },
    views::{RootView, View},
    Contract, ContractRuntime,
};

use management::{
    Operation, Message, Bet, Event,
    state::{ManagementState, LeaderboardWinner, MatchStatus, Teams, Odds, MatchResult, TypeEvent, UserOdd, UserOdds, Selection, BetStatus, LiveScore, MatchEvent, MatchEventType, UserStats}
};
use std::collections::HashMap;
use std::str::FromStr;
const STREAM_NAME: &[u8] = b"bets";
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
    type EventValue = Bet;

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = ManagementState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        ManagementContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        self.runtime.application_parameters();
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        match operation {
            //oracleChain operations
            Operation::Subscribe { chain_id } => {
                let app_id = self.runtime.application_id().forget_abi();
                self.runtime
                    .subscribe_to_events(chain_id, app_id, STREAM_NAME.into());
            },  
            Operation::Unsubscribe{ chain_id } => {
                let app_id = self.runtime.application_id().forget_abi();
                self.runtime
                    .unsubscribe_from_events(chain_id, app_id, STREAM_NAME.into());
            },
            Operation::UpdateEventStatus { event_id, status } => {
                //assert!(self.runtime.chain_id() != self.runtime.application_creator_chain_id());
                let management_chain_id = self.runtime.application_creator_chain_id();
                let event = self.state.events.get(&event_id).await.expect("Event not found").unwrap();

                let new_status = match status.as_str() {
                    "Scheduled" => MatchStatus::Scheduled,
                    "Live" => MatchStatus::Live,
                    "Finished" => MatchStatus::Finished,
                    "Postponed" => MatchStatus::Postponed,
                    _ => MatchStatus::Scheduled,
                };

                let new_event = Event {
                    id: event_id.clone(),
                    status: new_status,
                    type_event: event.type_event,   
                    league: event.league,
                    teams: event.teams,
                    odds: event.odds,
                    start_time: event.start_time,
                    result: event.result,
                    live_score: event.live_score,
                    match_events: event.match_events,
                    last_updated: self.runtime.system_time(),
                    current_minute: event.current_minute,
                };
                let _ = self.state.events.insert(&event_id, new_event.clone());

                self.runtime.prepare_message(
                    Message::EventUpdated { event_id: event_id.clone(), event: new_event.clone() }
                ).with_authentication().send_to(management_chain_id);
            },
            Operation::UpdateEventOdds { event_id, home_odds, away_odds, tie_odds } => {
                //assert!(self.runtime.chain_id() != self.runtime.application_creator_chain_id());
                let management_chain_id = self.runtime.application_creator_chain_id();
                let event = self.state.events.get(&event_id).await.expect("Event not found").unwrap();
                let odds = Odds {
                    home: home_odds,
                    away: away_odds,
                    tie: tie_odds,
                };
                let new_event = Event {
                    id: event_id.clone(),
                    status: event.status,
                    type_event: event.type_event,
                    league: event.league,
                    teams: event.teams,
                    odds: odds,
                    start_time: event.start_time,
                    result: event.result,
                    live_score: event.live_score,
                    match_events: event.match_events,
                    last_updated: self.runtime.system_time(),
                    current_minute: event.current_minute,
                };
                let _ = self.state.events.insert(&event_id, new_event.clone()); 
                
                self.runtime.prepare_message(
                    Message::EventUpdated { event_id: event_id.clone(), event: new_event.clone() }
                ).with_authentication().send_to(management_chain_id);
                
            },
            Operation::UpdateEventLiveScore { event_id, home_score, away_score } => {
                //assert!(self.runtime.chain_id() != self.runtime.application_creator_chain_id());
                let management_chain_id = self.runtime.application_creator_chain_id();
                let event = self.state.events.get(&event_id).await.expect("Event not found").unwrap();
                let live_score = LiveScore {
                    home: home_score,
                    away: away_score,
                    updated_at: self.runtime.system_time(),
                };
                let new_event = Event {
                    id: event_id.clone(),
                    status: event.status,
                    type_event: event.type_event,
                    league: event.league,
                    teams: event.teams,
                    odds: event.odds,
                    start_time: event.start_time,
                    result: event.result,
                    live_score: live_score,
                    match_events: event.match_events,
                    last_updated: self.runtime.system_time(),
                    current_minute: event.current_minute,
                };
                let _ = self.state.events.insert(&event_id, new_event.clone());
                
                self.runtime.prepare_message(
                    Message::EventUpdated { event_id: event_id.clone(), event: new_event.clone() }
                ).with_authentication().send_to(management_chain_id);
            },
            Operation::UpdateCurrentMinute { event_id, current_minute } => {
                let management_chain_id = self.runtime.application_creator_chain_id();
                let event = self.state.events.get(&event_id).await.expect("Event not found").unwrap();
                
                let new_event = Event {
                    id: event_id.clone(),
                    status: event.status,
                    type_event: event.type_event,
                    league: event.league,
                    teams: event.teams,
                    odds: event.odds,
                    start_time: event.start_time,
                    result: event.result,
                    live_score: event.live_score,
                    match_events: event.match_events,
                    last_updated: self.runtime.system_time(),
                    current_minute: Some(current_minute),
                };
                let _ = self.state.events.insert(&event_id, new_event.clone());
                
                self.runtime.prepare_message(
                    Message::EventUpdated { event_id: event_id.clone(), event: new_event.clone() }
                ).with_authentication().send_to(management_chain_id);
            },
            Operation::AddMatchEvent { event_id, event_type, time, team, player, detail, timestamp } => {
                //assert!(self.runtime.chain_id() != self.runtime.application_creator_chain_id());
                let management_chain_id = self.runtime.application_creator_chain_id();
                let mut event = self.state.events.get(&event_id).await.expect("Event not found").unwrap();
                
                // Parse event_type string to enum
                let event_type_enum = match event_type.as_str() {
                    "Goal" => MatchEventType::Goal,
                    "YellowCard" => MatchEventType::YellowCard,
                    "RedCard" => MatchEventType::RedCard,
                    "Substitution" => MatchEventType::Substitution,
                    "Corner" => MatchEventType::Corner,
                    "Penalty" => MatchEventType::Penalty,
                    _ => MatchEventType::None,
                };
                
                // Construct MatchEvent from individual parameters
                let match_event = MatchEvent {
                    event_type: event_type_enum,
                    time: time,
                    team,
                    player,
                    detail,
                    timestamp,
                };
                
                event.match_events.push(match_event);
                let updated_event = event.clone();
                let _ = self.state.events.insert(&event_id, event);  
                
                self.runtime.prepare_message(
                    Message::EventUpdated { event_id: event_id.clone(), event: updated_event }
                ).with_authentication().send_to(management_chain_id);
            },
            Operation::CreateEvent { id, type_event, league, home, away, home_odds, away_odds, tie_odds, start_time } => {

                //assert_eq!(self.runtime.chain_id(), self.runtime.application_creator_chain_id());
                let management_chain_id = self.runtime.application_creator_chain_id();
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
                    live_score: LiveScore::default(),
                    match_events: Vec::new(),
                    last_updated: self.runtime.system_time(),
                    current_minute: Some(0),
                };

                let _ = self.state.events.insert(&id.clone(), event.clone());

                 self.runtime.prepare_message(
                    Message::NewEventCreated { event_id: id.clone(), event: event.clone() }
                ).with_authentication().send_to(management_chain_id);

            },
            Operation::ResolveEvent { event_id, winner, home_score, away_score } => {
                let management_chain_id = self.runtime.application_creator_chain_id();
                let mut event = self.state.events.get(&event_id).await.expect("Event not found").unwrap();
                let victory = match winner.as_str() {
                        "Home" => Selection::Home,
                        "Away" => Selection::Away,
                        "Tie" => Selection::Tie,
                        _ => Selection::Home,
                    };

                event.result = MatchResult { winner: victory, home_score: home_score.clone(), away_score: away_score.clone() };
                event.status = MatchStatus::Finished;
                event.last_updated = self.runtime.system_time();
                let _ = self.state.events.insert(&event_id, event.clone());
                
                self.runtime.prepare_message(
                    Message::EventUpdated { event_id: event_id.clone(), event: event.clone() }
                ).with_authentication().send_to(management_chain_id);
            },
            //leaderboad operations.
            Operation::StartNewWeek{ week, year, prize_pool } =>{
                let management_chain_id = self.runtime.application_creator_chain_id();
                //copy oracle chain and set new week
                let mut leaderboard_data = self.state.leaderboard.get().clone();
                leaderboard_data.week = week;
                leaderboard_data.year = year;
                let _ = self.state.leaderboard.set(leaderboard_data);
                
                self.runtime.prepare_message(
                    Message::NewWeekStarted { week: week.clone(), year: year.clone(), prize_pool: prize_pool.clone() }
                ).with_authentication().send_to(management_chain_id);
            },
            Operation::EndCurrentWeek{ week, year } =>{
                let management_chain_id = self.runtime.application_creator_chain_id();

                //copy oracle chain and set new week
                let mut leaderboard_data = self.state.leaderboard.get().clone();
                leaderboard_data.week = 0;
                leaderboard_data.year = 0;
                let _ = self.state.leaderboard.set(leaderboard_data);

                self.runtime.prepare_message(
                    Message::CurrentWeekEnded { week: week.clone(), year: year.clone() }
                ).with_authentication().send_to(management_chain_id);
            },
            // UserChain operations.
            Operation::PlaceBet { home, away, league, start_time, odd, selection, bid, event_id } => {
                let management_chain_id = self.runtime.application_creator_chain_id();
                
                let user_balance = self.state.user_balance.get().clone();

                if bid > user_balance {
                    panic!("No tokens enough");
                }

                let new_balance = user_balance.saturating_sub(bid);
                self.state.user_balance.set(new_balance);

                // Record bet locally
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
                    bid: bid,
                    status: BetStatus::Placed,
                    placed_at: self.runtime.system_time(),
                };

                let mut user_odds_vec = self.state.user_odds.get().clone();
                user_odds_vec.push(user_bet);
                self.state.user_odds.set(user_odds_vec);

                // Notify management chain
                self.runtime.prepare_message(
                    Message::NewBetPlaced { home, away, league, start_time, odd, selection, bid, status: "Placed".to_string(), event_id  }
                ).with_authentication().send_to(management_chain_id);
            },
            Operation::ClaimReward{ event_id } => {
                let chain_id = self.runtime.application_creator_chain_id();
                self.runtime.prepare_message(
                    Message::UserClaimReward { event_id: event_id.clone() }
                ).with_authentication().send_to(chain_id);
            },
            Operation::RequestMint{ amount } => {
                let chain_id = self.runtime.application_creator_chain_id();
                let bonus_claimed = self.state.bonus_claimed.get().clone();
                if bonus_claimed {
                    return;
                }
                self.state.bonus_claimed.set(true);
                self.runtime.prepare_message(
                    Message::MintTokens { amount: amount.clone() }
                ).with_authentication().send_to(chain_id);  
            },
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        match message {
            Message::NewBetPlaced { home, away, league, start_time, odd, selection, bid, status, event_id } => {
                let user_id = self.runtime.message_origin_chain_id().unwrap();
                
                // Check if event exists, if not revert the bet
                let event = match self.state.events.get(&event_id).await {
                    Ok(Some(e)) => e,
                    _ => {
                        self.runtime.prepare_message(
                            Message::RevertUserBet { event_id: event_id.clone() }
                        ).with_authentication().send_to(user_id);
                        return;
                    }
                };
                
                if event.status != MatchStatus::Scheduled {
                    self.runtime.prepare_message(
                        Message::RevertUserBet { event_id: event_id.clone() }
                    ).with_authentication().send_to(user_id);

                    //send back the bid
                    self.runtime.prepare_message(
                        Message::Receive { amount: bid.clone() }
                    ).with_authentication().send_to(user_id);

                    return;
                }

                // Update event pool
                //event.pool = event.pool.saturating_add(bid);
                //self.state.events.insert(&event_id, event);

                // Record bet
                let mut bets = self.state.event_odds.get(&event_id).await.expect("Event not found").unwrap_or_default();
                let bet = UserOdd {
                    user_id: user_id.to_string(),
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

                bets.push(bet.clone());
                let _ = self.state.event_odds.insert(&event_id, bets);
                self.runtime.emit(STREAM_NAME.into(), &Bet::NewEventBet { event_id, user_odd: bet });



                let mut leaderboard_data = self.state.leaderboard
                    .get().clone();

                let user_stats = leaderboard_data.user_stats.get(&user_id.to_string()).cloned().unwrap_or_default();
                let user_stats = UserStats {
                    total_staked: user_stats.total_staked.saturating_add(bid),
                    total_winnings: user_stats.total_winnings,
                    total_bets: user_stats.total_bets.saturating_add(1),
                    total_wins: user_stats.total_wins,
                    total_losses: user_stats.total_losses,
                    win_rate: user_stats.win_rate,
                };
                let _ = leaderboard_data.user_stats.insert(user_id.to_string(), user_stats);
                let _ = self.state.leaderboard.set(leaderboard_data);
            },

            Message::RevertUserBet { event_id } => {
                let mut user_odds_vec = self.state.user_odds.get().clone(); 
                for user_odd in &mut user_odds_vec {
                    if user_odd.event_id == event_id {
                        user_odd.status = BetStatus::Cancelled;
                    }
                }

                let _ = self.state.user_odds.set(user_odds_vec);
            },

            Message::UserClaimReward { event_id } => {
                let user_id = self.runtime.message_origin_chain_id().unwrap();
                
                // Check if event exists
                let event = match self.state.events.get(&event_id).await {
                    Ok(Some(e)) => e,
                    _ => {
                        self.runtime.prepare_message(
                            Message::ClaimResult { event_id: event_id.clone(), result: "Cancelled".to_string() }
                        ).with_authentication().send_to(user_id);
                        return;
                    }
                };
                
                if event.status != MatchStatus::Finished {
                    self.runtime.prepare_message(
                        Message::ClaimResult { event_id: event_id.clone(), result: "Placed".to_string() }
                    ).with_authentication().send_to(user_id);
                    return; 
                }

                let bets = self.state.event_odds.get(&event_id).await.expect("Event not found").unwrap_or_default();
    
                for bet in bets.clone() {
                    if bet.user_id == user_id.to_string() {
                        if bet.selection == event.result.winner {
                            // Calculate prize
                            let prize = calculate_prize(&event, &bet);
                            
                            self.runtime.prepare_message(
                                Message::Receive { amount: prize }
                            ).with_authentication().send_to(user_id);

                            self.runtime.prepare_message(
                                Message::ClaimResult { event_id: event_id.clone(), result: "Won".to_string()  }
                            ).with_authentication().send_to(user_id);

                            let mut leaderboard_data = self.state.leaderboard
                                .get().clone();

                            let user_stats = leaderboard_data.user_stats.get(&user_id.to_string()).cloned().unwrap_or_default();
                            let win_rate = (user_stats.total_wins.saturating_add(1) as f64 / user_stats.total_bets as f64 * 100.0) as u64;
                            let user_stats = UserStats {
                                total_staked: user_stats.total_staked,
                                total_winnings: user_stats.total_winnings.saturating_add(prize),
                                total_bets: user_stats.total_bets,
                                total_wins: user_stats.total_wins.saturating_add(1),
                                total_losses: user_stats.total_losses,
                                win_rate: win_rate,
                            };
                            let _ = leaderboard_data.user_stats.insert(user_id.to_string(), user_stats);
                            let _ = self.state.leaderboard.set(leaderboard_data);
                        } else {
                            self.runtime.prepare_message(
                                Message::ClaimResult { event_id: event_id.clone(), result: "Lost".to_string() }
                            ).with_authentication().send_to(user_id);

                            let mut leaderboard_data = self.state.leaderboard
                                .get().clone();

                            let user_stats = leaderboard_data.user_stats.get(&user_id.to_string()).cloned().unwrap_or_default();
                            let win_rate = (user_stats.total_wins as f64 / user_stats.total_bets as f64 * 100.0) as u64;
                            let user_stats = UserStats {
                                total_staked: user_stats.total_staked,
                                total_winnings: user_stats.total_winnings,
                                total_bets: user_stats.total_bets,
                                total_wins: user_stats.total_wins,
                                total_losses: user_stats.total_losses.saturating_add(1),
                                win_rate: win_rate,
                            };
                            let _ = leaderboard_data.user_stats.insert(user_id.to_string(), user_stats);
                            let _ = self.state.leaderboard.set(leaderboard_data);
                        }
                    }
                }
            },

            Message::ClaimResult { event_id, result } => {
                let mut user_odds_vec = self.state.user_odds.get().clone();
                let res = match result.as_str() {
                        "Won" => BetStatus::Won,
                        "Lost" => BetStatus::Lost,
                        "Cancelled" => BetStatus::Cancelled,
                        _ => BetStatus::Placed,
                    };
                for bet in &mut user_odds_vec {
                    if bet.event_id == event_id {
                        bet.status = res;
                    }
                }
                let _ = self.state.user_odds.set(user_odds_vec);
            },
            Message::Receive { amount } => {
                let current_balance = *self.state.user_balance.get();

                let new_balance = current_balance.saturating_add(amount.into());
                self.state.user_balance.set(new_balance);
            },
            Message::MintTokens { amount } => {
                let user_chain_id = self.runtime.message_origin_chain_id().unwrap();
                let current_supply = self.state.token_supp.get().clone();
                let new_supply = current_supply.saturating_add(amount.into());

                self.state.token_supp.set(new_supply);  

                self.runtime.prepare_message(
                    Message::Receive { amount: amount.clone() }
                ).with_authentication().send_to(user_chain_id);
            },
            Message::NewEventCreated { event_id, event } =>{
                let _ = self.state.events.insert(&event_id.clone(), event.clone());
            },
            Message::EventUpdated { event_id, event } => {
                let _ = self.state.events.insert(&event_id.clone(), event.clone());
            }
            //leaderboard cross-messages
            Message::NewWeekStarted { week, year, prize_pool } => {
                let mut leaderboard_data = self.state.leaderboard.get().clone();
                leaderboard_data.week = week;
                leaderboard_data.year = year;
                leaderboard_data.user_stats = HashMap::new();
                leaderboard_data.winners = leaderboard_data.winners.clone();
                leaderboard_data.prize_pool = prize_pool;
                let _ = self.state.leaderboard.set(leaderboard_data);
            },
            Message::CurrentWeekEnded { week, year } => {
                let mut leaderboard_data = self.state.leaderboard.get().clone();
                
                // Calculate winners
                let mut winners = Vec::new();
                for (user_id, user_stats) in leaderboard_data.user_stats.iter() {
                    winners.push((user_id.clone(), user_stats.total_winnings));
                }
                winners.sort_by(|a, b| b.1.cmp(&a.1));
                
                // Create Vec of top 3 winners
                let mut week_winners = Vec::new();
                for (i, (user_id, _)) in winners.iter().take(3).enumerate() {
                    let pool_amount: u128 = leaderboard_data.prize_pool.into();
                    let prize = match i {
                        0 => Amount::from_attos(pool_amount * 50 / 100),  // 1er: 50%
                        1 => Amount::from_attos(pool_amount * 30 / 100),  // 2do: 30%
                        2 => Amount::from_attos(pool_amount * 20 / 100),  // 3er: 20%
                        _ => Amount::ZERO,
                    };

                    week_winners.push(LeaderboardWinner {
                        user: user_id.clone(),
                        rank: i as u64 + 1,
                        prize: prize,
                    });

                    let user_chain_id = ChainId::from_str(&user_id).unwrap();
                    self.runtime.prepare_message(
                        Message::Receive { amount: prize.clone() }
                    ).with_authentication().send_to(user_chain_id);
                }
                
                // Insert Vec of winners with "year-week" key
                leaderboard_data.winners.insert(format!("{}-{}", year, week), week_winners);
                let _ = self.state.leaderboard.set(leaderboard_data);
            }
         }
    }

    async fn process_streams(&mut self, updates: Vec<StreamUpdate>) {
        for update in updates {
            assert_eq!(update.stream_id.stream_name, STREAM_NAME.into());
            assert_eq!(
                update.stream_id.application_id,
                self.runtime.application_id().forget_abi().into()
            );
            for index in update.new_indices() {
                let event = self
                    .runtime
                    .read_event(update.chain_id, STREAM_NAME.into(), index);
                match event {
                    Bet::NewEventBet { event_id, user_odd } => {
                        let mut odds = self.state.event_odds.get(&event_id).await
                            .unwrap_or(None)
                            .unwrap_or_default();
                        odds.push(user_odd);
                        let _ = self.state.event_odds.insert(&event_id, odds);
                    }
                }
            }
        }
    }


    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}


/// Calculate prize based on bet amount and odds
/// Formula: prize = bet_amount * (odd / 100)
fn calculate_prize(_event: &Event, user_bet: &UserOdd) -> Amount {
    let bet_amount: u128 = user_bet.bid.into();
    let odd = user_bet.odd as u128;
    let prize = (bet_amount * odd) / 100;
    
    Amount::from_attos(prize)
}