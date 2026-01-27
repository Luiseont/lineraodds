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
    state::{ManagementState, LeaderboardWinner, MatchStatus, TeamInfo,PredictionType, UserVotes, LivePrediction, Vote, Teams, Team, Odds, MatchResult, TypeEvent, UserOdd, UserOdds, Selection, BetStatus, LiveScore, MatchEvent, MatchEventType, UserStats}
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
            Operation::UpdateTeamPower { team_id, name, power, form, goal_average } => {
                let management_chain_id = self.runtime.application_creator_chain_id();
                let mut team = self.state.power_ranking.get(&team_id).await.expect("Team not found").unwrap_or_default();
                team.id = team_id.clone();
                team.name = name.clone();
                team.power = power.clone();
                team.form = form.clone();
                team.goal_average = goal_average.clone();
                team.last_updated = self.runtime.system_time();
                let _ = self.state.power_ranking.insert(&team_id.clone(), team.clone());
                
                self.runtime.prepare_message(
                    Message::UpdateTeamPower { team_id: team_id.clone(), name: name.clone(), power: power.clone(), form: form.clone(), goal_average: goal_average.clone() }
                ).with_authentication().send_to(management_chain_id);
            },
            Operation::UpdateEventStatus { event_id, status } => {
                //assert!(self.runtime.chain_id() != self.runtime.application_creator_chain_id());
                let management_chain_id = self.runtime.application_creator_chain_id();
                let mut event = self.state.events.get(&event_id).await.expect("Event not found").unwrap();
                
                let new_status = match status.as_str() {
                    "Scheduled" => MatchStatus::Scheduled,
                    "Live" => MatchStatus::Live,
                    "Finished" => MatchStatus::Finished,
                    "Postponed" => MatchStatus::Postponed,
                    _ => MatchStatus::Scheduled,
                };

                event.status = new_status;
                event.last_updated = self.runtime.system_time();
                let _ = self.state.events.insert(&event_id, event.clone());
                
                self.runtime.prepare_message(
                    Message::EventStatusUpdated { event_id: event_id.clone(), status: new_status }
                ).with_authentication().send_to(management_chain_id);
            },
            Operation::UpdateEventLiveScore { event_id, home_score, away_score } => {
                //assert!(self.runtime.chain_id() != self.runtime.application_creator_chain_id());
                let management_chain_id = self.runtime.application_creator_chain_id();
                let mut event = self.state.events.get(&event_id).await.expect("Event not found").unwrap();
                let live_score = LiveScore {
                    home: home_score.clone(),
                    away: away_score.clone(),
                    updated_at: self.runtime.system_time(),
                };
                event.live_score = live_score;
                event.last_updated = self.runtime.system_time();
                let _ = self.state.events.insert(&event_id, event.clone());
                
                self.runtime.prepare_message(
                    Message::EventScoreUpdated { event_id: event_id.clone(), home_score, away_score }
                ).with_authentication().send_to(management_chain_id);
            },
            Operation::UpdateCurrentMinute { event_id, current_minute } => {
                let management_chain_id = self.runtime.application_creator_chain_id();
                let mut event = self.state.events.get(&event_id).await.expect("Event not found").unwrap();
                event.last_updated = self.runtime.system_time();
                event.current_minute = Some(current_minute);
                let _ = self.state.events.insert(&event_id, event.clone());
                
                self.runtime.prepare_message(
                    Message::EventMinuteUpdated { event_id: event_id.clone(), minute: current_minute }
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
                let match_event_local = MatchEvent {
                    event_type: event_type_enum,
                    time: time.clone(),
                    team: team.clone(),
                    player: player.clone(),
                    detail: detail.clone(),
                    timestamp,
                };
                
                event.match_events.push(match_event_local);
                let _ = self.state.events.insert(&event_id, event);

                // Actually, the message takes the whole struct.
                let match_event_msg = MatchEvent {
                    event_type: event_type_enum,
                    time,
                    team,
                    player,
                    detail,
                    timestamp,
                };
                
                self.runtime.prepare_message(
                    Message::EventMatchEventAdded { event_id: event_id.clone(), match_event: match_event_msg }
                ).with_authentication().send_to(management_chain_id);
            },
            Operation::CreateEvent { id, type_event, league, home_id, away_id, start_time } => {
                //assert_eq!(self.runtime.chain_id(), self.runtime.application_creator_chain_id());
                let management_chain_id = self.runtime.application_creator_chain_id();
                let type_eventE = match type_event.as_str() {
                    "Football" => TypeEvent::Football,
                    "Esports" => TypeEvent::Esports,
                    "Baseball" => TypeEvent::Baseball,
                    _ => TypeEvent::Football,
                };

                //get home and away team info from power ranking
                let home_team = self.state.power_ranking.get(&home_id).await.expect("Home team not found").unwrap();
                let away_team = self.state.power_ranking.get(&away_id).await.expect("Away team not found").unwrap();

                //calculate odds from team power ranking
                let odds = calculate_odds(&home_team, &away_team);

                let event = Event {
                    id : id.clone(),
                    status: MatchStatus::Scheduled,
                    type_event: type_eventE,
                    league: league.clone(),
                    teams: Teams { 
                        home: Team { 
                            name: home_team.name.clone(), 
                            id: home_team.id.clone() 
                        },
                        away: Team {
                            name: away_team.name.clone(), 
                            id: away_team.id.clone() 
                        } 
                    },
                    odds: Odds { home: odds.0, away: odds.2, tie: odds.1 },
                    start_time,
                    result: MatchResult::default(),
                    live_score: LiveScore::default(),
                    match_events: Vec::new(),
                    last_updated: self.runtime.system_time(),
                    current_minute: Some(0),
                    predictions: Vec::new(),
                };

                let _ = self.state.events.insert(&id.clone(), event.clone());

                 self.runtime.prepare_message(
                    Message::NewEventCreated { event_id: id.clone(), event: event.clone() }
                ).with_authentication().send_to(management_chain_id);
            },
            Operation::ResolveEvent { event_id, winner, home_score, away_score } => {
                let management_chain_id = self.runtime.application_creator_chain_id();
                //assert_eq!(self.runtime.chain_id(), management_chain_id);

                let mut event = self.state.events.get(&event_id).await.expect("Event not found").unwrap();
                let winner_enum = match winner.as_str() {
                    "Home" => Selection::Home,
                    "Away" => Selection::Away,
                    _ => Selection::Tie,
                };
                let result = MatchResult {
                    winner: winner_enum,
                    home_score: home_score.clone(),
                    away_score: away_score.clone(),
                };

                event.result = result;
                event.status = MatchStatus::Finished;

                // Resolve TotalGoalsUnder predictions
                let h_score = home_score.parse::<u8>().unwrap_or(0);
                let a_score = away_score.parse::<u8>().unwrap_or(0);
                let total_goals = h_score + a_score;

                for prediction in event.predictions.iter_mut().filter(|p| !p.resolved) {
                    if let PredictionType::TotalGoalsUnder(threshold) = prediction.prediction_type {
                         let outcome = total_goals < threshold;
                         prediction.resolved = true;
                         prediction.outcome = Some(outcome);
                    }
                }

                let updated_event = event.clone();
                let _ = self.state.events.insert(&event_id, event);

                self.runtime.prepare_message(
                    Message::EventOutcomeResolved { event_id: event_id.clone(), winner: winner_enum, home_score, away_score }
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
            Operation::PlaceBet { home_id, away_id, home_name, away_name, league, start_time, odd, selection, bid, event_id } => {
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
                    teams: Teams { 
                        home: Team { 
                            name: home_name.clone(), 
                            id: home_id.clone() 
                        },
                        away: Team {
                            name: away_name.clone(), 
                            id: away_id.clone() 
                        } 
                    },
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
                    Message::NewBetPlaced { home: home_id, away: away_id, league, start_time, odd, selection, bid, status: "Placed".to_string(), event_id  }
                ).with_authentication().send_to(management_chain_id);
            },
            Operation::CreatePrediction { prediction_id, event_id, prediction_type, question, init_vote, amount } => {
                let management_chain_id = self.runtime.application_creator_chain_id();
                let user_balance = self.state.user_balance.get().clone();

                if amount > user_balance {
                    panic!("No tokens enough");
                }

                let new_balance = user_balance.saturating_sub(amount);
                self.state.user_balance.set(new_balance);
                //let prediction_type = PredictionType::from_str(prediction_type.as_str()).unwrap();
                let userVotes = UserVotes {
                    id: prediction_id.clone(),
                    event_id: event_id.clone(),
                    prediction_type: prediction_type.clone(),
                    amount: amount.clone(),
                    choice: init_vote.clone(),
                    claimed: false,
                };
                
                let mut user_votes_vec = self.state.user_votes.get().clone();
                user_votes_vec.push(userVotes);
                self.state.user_votes.set(user_votes_vec);
                
                self.runtime.prepare_message(
                    Message::NewPredictionCreated { prediction_id: prediction_id.clone(), event_id: event_id.clone(), prediction_type: prediction_type.clone(), question: question.clone(), init_vote: init_vote.clone(), amount: amount.clone() }
                ).with_authentication().send_to(management_chain_id);
            },
            Operation::PlaceVote{ event_id, prediction_id, vote, amount, prediction_type } => {
                let chain_id = self.runtime.application_creator_chain_id();
                let user_balance = self.state.user_balance.get().clone();

                if amount > user_balance {
                    panic!("No tokens enough");
                }

                // Check for duplicate vote
                let current_votes = self.state.user_votes.get();
                if current_votes.iter().any(|v| v.id == prediction_id) {
                    panic!("User has already voted on this prediction");
                }

                let new_balance = user_balance.saturating_sub(amount);
                self.state.user_balance.set(new_balance);

                //let prediction_type_enum = PredictionType::from_str(&prediction_type).unwrap();

                let user_vote = UserVotes {
                    id: prediction_id.clone(),
                    event_id: event_id.clone(),
                    prediction_type: prediction_type,
                    amount: amount.clone(),
                    choice: vote.clone(),
                    claimed: false,
                };

                let mut user_votes_vec = current_votes.clone();
                user_votes_vec.push(user_vote);
                self.state.user_votes.set(user_votes_vec);
                
                self.runtime.prepare_message(
                    Message::NewVotePlaced { event_id: event_id.clone(), prediction_id: prediction_id.clone(), vote: vote.clone(), amount: amount.clone() }
                ).with_authentication().send_to(chain_id);
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
            Operation::ClaimPredictionReward{ prediction_id, event_id } => {
                let chain_id = self.runtime.application_creator_chain_id();
                //get in local chain with the prediction and event and get the user votes
                //iterate over the user votes and check if the user has already claimed the reward
                let mut user_votes = self.state.user_votes.get().clone();
                for user_vote in user_votes.iter_mut() {
                    if user_vote.id == prediction_id && user_vote.event_id == event_id && !user_vote.claimed {
                        //update the user vote
                        user_vote.claimed = true;
                        self.runtime.prepare_message(
                            Message::SendPredictionReward { prediction_id: prediction_id.clone(), event_id: event_id.clone() }
                        ).with_authentication().send_to(chain_id);  
                    }else{
                        //do nothing
                    }
                }
                self.state.user_votes.set(user_votes);
            },
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        match message {
            Message::UpdateTeamPower { team_id, name, power, form, goal_average } => {
                let management_chain_id = self.runtime.application_creator_chain_id();
                let mut team = self.state.power_ranking.get(&team_id).await.expect("Team not found").unwrap_or_default();
                team.id = team_id.clone();
                team.name = name;
                team.power = power;
                team.form = form;
                team.goal_average = goal_average;
                team.last_updated = self.runtime.system_time();
                let _ = self.state.power_ranking.insert(&team_id.clone(), team.clone());
            },
            Message::NewBetPlaced { home, away, league, start_time, odd, selection, bid, status, event_id } => {
                let user_id = self.runtime.message_origin_chain_id().unwrap();
                
                // Check if event exists, if not revert the bet
                let mut event = match self.state.events.get(&event_id).await {
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
                let _ = self.state.event_odds.insert(&event_id, bets.clone());
                self.runtime.emit(STREAM_NAME.into(), &Bet::NewEventBet { event_id: event_id.clone(), user_odd: bet });

                //calculate new odds
                let initial_odds = (event.odds.home, event.odds.tie, event.odds.away);
                let (new_home, new_tie, new_away) = get_market_odds(initial_odds, &bets);

                event.odds.home = new_home;
                event.odds.tie = new_tie;
                event.odds.away = new_away;
                let _ = self.state.events.insert(&event_id, event);

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
            Message::NewVotePlaced { event_id, prediction_id, vote, amount } => {
                let user_id = self.runtime.message_origin_chain_id().unwrap();
                let mut event = match self.state.events.get(&event_id).await {
                    Ok(Some(e)) => e,
                    _ => {
                        self.runtime.prepare_message(
                            Message::Receive { amount: amount.clone() }
                        ).with_authentication().send_to(user_id);
                        return;
                    }
                };

                if event.status != MatchStatus::Live {
                    self.runtime.prepare_message(
                        Message::Receive { amount: amount.clone() }
                    ).with_authentication().send_to(user_id);
                    return;
                }

                if let Some(prediction) = event.predictions.iter_mut().find(|p| p.id == prediction_id) {
                    if prediction.resolved {
                        self.runtime.prepare_message(
                            Message::Receive { amount: amount.clone() }
                        ).with_authentication().send_to(user_id);
                        return;
                    }

                    // Check if user already voted
                    if prediction.votes.iter().any(|v| v.user == user_id.to_string()) {
                        self.runtime.prepare_message(
                            Message::Receive { amount: amount.clone() }
                        ).with_authentication().send_to(user_id);
                        return; 
                    }

                    // Update pools
                    if vote {
                        prediction.pool_yes = prediction.pool_yes.saturating_add(amount);
                    } else {
                        prediction.pool_no = prediction.pool_no.saturating_add(amount);
                    }

                    let new_vote = Vote{
                        user: user_id.to_string(),
                        choice: vote.clone(),
                        amount: amount.clone(),
                        claimed: false,
                    };

                    prediction.votes.push(new_vote);
                } else {
                    // Prediction not found
                    self.runtime.prepare_message(
                        Message::Receive { amount: amount.clone() }
                    ).with_authentication().send_to(user_id);
                    return;
                }

                let _ =  self.state.events.insert(&event_id, event);
            },
            Message::NewPredictionCreated { prediction_id, event_id, prediction_type, question, init_vote, amount } => {
                let user_id = self.runtime.message_origin_chain_id().unwrap();
                let mut event = match self.state.events.get(&event_id).await {
                    Ok(Some(e)) => e,
                    _ => {
                        self.runtime.prepare_message(
                            Message::Receive { amount: amount.clone() }
                        ).with_authentication().send_to(user_id);
                        return;
                    }
                };

                if event.status != MatchStatus::Live {
                    self.runtime.prepare_message(
                        Message::Receive { amount: amount.clone() }
                    ).with_authentication().send_to(user_id);
                    return;
                }

                let new_vote = Vote{
                    user: user_id.to_string(),
                    choice: init_vote.clone(),
                    amount: amount.clone(),
                    claimed: false,
                };


                let new_prediction = LivePrediction {
                    id: prediction_id,         
                    creator: user_id.to_string(),       
                    prediction_type: prediction_type.clone(), 
                    question: question.clone(),       
                    pool_yes: if init_vote { amount } else { Amount::ZERO },         
                    pool_no: if !init_vote { amount } else { Amount::ZERO },          
                    resolved: false,         
                    outcome: None,  
                    created_at: self.runtime.system_time(),
                    votes: vec![new_vote]
                };

                event.predictions.push(new_prediction);
                let _ =  self.state.events.insert(&event_id, event);
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
            Message::EventStatusUpdated { event_id, status } => {
                if let Some(mut event) = self.state.events.get(&event_id).await.expect("Event not found") {
                    event.status = status;
                    event.last_updated = self.runtime.system_time();
                    let _ = self.state.events.insert(&event_id, event);
                }
            },
            Message::EventScoreUpdated { event_id, home_score, away_score } => {
                if let Some(mut event) = self.state.events.get(&event_id).await.expect("Event not found") {
                     let live_score = LiveScore {
                        home: home_score,
                        away: away_score,
                        updated_at: self.runtime.system_time(),
                    };
                    event.live_score = live_score;
                    event.last_updated = self.runtime.system_time();
                    let _ = self.state.events.insert(&event_id, event);
                }
            },
            Message::EventMinuteUpdated { event_id, minute } => {
                if let Some(mut event) = self.state.events.get(&event_id).await.expect("Event not found") {
                    event.current_minute = Some(minute);
                    event.last_updated = self.runtime.system_time();
                    let _ = self.state.events.insert(&event_id, event);
                }
            },
            Message::EventMatchEventAdded { event_id, match_event } => {
                 if let Some(mut event) = self.state.events.get(&event_id).await.expect("Event not found") {
                     event.match_events.push(match_event.clone());
                     
                     // Auto-resolve predictions
                     let mut resolved_messages = Vec::new();
                     let match_event_type = match_event.event_type;
                     let team = match_event.team;

                     for prediction in event.predictions.iter_mut().filter(|p| !p.resolved) {
                         let mut is_resolved = false;
                         let mut result = false;

                         match &prediction.prediction_type {
                             PredictionType::NextGoal(selection) => {
                                 if match_event_type == MatchEventType::Goal {
                                     let outcome_selection = if team == event.teams.home.name || team == event.teams.home.id || team == "Home Team".to_string() {
                                         Selection::Home
                                     } else if team == event.teams.away.name || team == event.teams.away.id || team == "Away Team".to_string() {
                                         Selection::Away    
                                     } else {
                                         Selection::Tie 
                                     };

                                     if outcome_selection != Selection::Tie {
                                         result = *selection == outcome_selection;
                                         is_resolved = true;
                                     }
                                 }
                             },
                             PredictionType::RedCard => {
                                 if match_event_type == MatchEventType::RedCard {
                                     result = true;
                                     is_resolved = true;
                                 }
                             },
                             PredictionType::TotalGoalsOver(threshold) => {
                                 if match_event_type == MatchEventType::Goal {
                                     let home_goals = event.match_events.iter()
                                         .filter(|e| e.event_type == MatchEventType::Goal && 
                                                    (e.team == event.teams.home.name || e.team == event.teams.home.id))
                                         .count() as u8;
                                     let away_goals = event.match_events.iter()
                                         .filter(|e| e.event_type == MatchEventType::Goal && 
                                                    (e.team == event.teams.away.name || e.team == event.teams.away.id))
                                         .count() as u8;
                                     
                                     if (home_goals + away_goals) > *threshold { 
                                        result = true;
                                        is_resolved = true;
                                     }
                                 }
                             },
                             PredictionType::BTTS => {
                                 if match_event_type == MatchEventType::Goal {
                                     let home_goals = event.match_events.iter()
                                         .filter(|e| e.event_type == MatchEventType::Goal && 
                                                    (e.team == event.teams.home.name || e.team == event.teams.home.id))
                                         .count() as u8;
                                     let away_goals = event.match_events.iter()
                                         .filter(|e| e.event_type == MatchEventType::Goal && 
                                                    (e.team == event.teams.away.name || e.team == event.teams.away.id))
                                         .count() as u8;
                                     
                                     if home_goals > 0 && away_goals > 0 {
                                         result = true;
                                         is_resolved = true;
                                     }
                                 }
                             },
                             _ => {}
                         }

                         if is_resolved {
                             prediction.resolved = true;
                             prediction.outcome = Some(result);
                             resolved_messages.push((prediction.id, result));
                         }
                     }
                     
                     let _ = self.state.events.insert(&event_id, event);
                 }
            },
            Message::EventOutcomeResolved { event_id, winner, home_score, away_score } => {
                if let Some(mut event) = self.state.events.get(&event_id).await.expect("Event not found") {
                    let result = MatchResult {
                        winner,
                        home_score: home_score.clone(),
                        away_score: away_score.clone(),
                    };

                    event.result = result;
                    event.status = MatchStatus::Finished;

                    // Resolve TotalGoalsUnder predictions
                    let h_score = home_score.parse::<u8>().unwrap_or(0);
                    let a_score = away_score.parse::<u8>().unwrap_or(0);
                    let total_goals = h_score + a_score;

                    for prediction in event.predictions.iter_mut().filter(|p| !p.resolved) {
                        let mut resolved = false;
                        let mut outcome = false;

                        match &prediction.prediction_type {
                             PredictionType::TotalGoalsUnder(threshold) => {
                                  outcome = total_goals < *threshold;
                                  resolved = true;
                             },
                             PredictionType::TotalGoalsOver(threshold) => {
                                  // Check if the final score exceeds the threshold
                                  outcome = total_goals > *threshold;
                                  resolved = true;
                             },
                             PredictionType::BTTS => {
                                  // Both teams must have scored at least 1 goal
                                  outcome = h_score > 0 && a_score > 0;
                                  resolved = true;
                             },
                             PredictionType::NextGoal(_) => {
                                  // No further goals occurred
                                  outcome = false;
                                  resolved = true;
                             },
                             PredictionType::RedCard => {
                                  // No further red cards occurred
                                  outcome = false;
                                  resolved = true;
                             },
                             PredictionType::GoalInNext10Mins(_) => {
                                  outcome = false;
                                  resolved = true;
                             },
                             _ => {}
                        }

                        if resolved {
                             prediction.resolved = true;
                             prediction.outcome = Some(outcome);
                        }
                    }

                    
                    let _ = self.state.events.insert(&event_id, event);
                }
            },

            Message::SendPredictionReward { prediction_id, event_id } => {
                let user_id = self.runtime.message_origin_chain_id().unwrap();
                //get the event with his predictions
                let mut event = self.state.events.get(&event_id.clone()).await.expect("Event not found").unwrap();
                
                //iterate over predictions vec to find the prediction with prediction_id
                if let Some(prediction) = event.predictions.iter_mut().find(|p| p.id == prediction_id) {
                    if prediction.resolved && prediction.outcome.is_some() {
                        let result = prediction.outcome.unwrap();
                        
                        //iterate over votes vec to find the vote with user_id
                        for vote in prediction.votes.iter_mut() {
                             if vote.user == user_id.to_string() {
                                if !vote.claimed {
                                    // Verify if user won
                                    if vote.choice == result {
                                        let user_vote_amount = vote.amount;
                                        
                                        // Calculate Reward: (UserStake * TotalPool) / WinningPool
                                        let total_pool = prediction.pool_yes.saturating_add(prediction.pool_no);
                                        let winning_pool = if result { prediction.pool_yes } else { prediction.pool_no };

                                        // Safety check for div by zero (shouldn't happen if user voted, but good practice)
                                        if winning_pool > Amount::ZERO {
                                            // arithmetic logic for rewards must be done in u128
                                            let user_vote_u128: u128 = user_vote_amount.into();
                                            let total_pool_u128: u128 = total_pool.into();
                                            let winning_pool_u128: u128 = winning_pool.into();

                                            let reward_u128 = (user_vote_u128 * total_pool_u128) / winning_pool_u128;
                                            let reward = Amount::from_attos(reward_u128);

                                            //mark the vote as claimed
                                            vote.claimed = true;

                                            //send the reward to the user
                                            self.runtime.prepare_message(
                                                Message::Receive { amount: reward }
                                            ).with_authentication().send_to(user_id);
                                        }
                                    } else {
                                        vote.claimed = true;
                                    }
                                }
                             }
                        }
                    }
                }
                let _ = self.state.events.insert(&event_id, event);
            },  
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

// Retorna (Cuota Local, Cuota Empate, Cuota Visita) escaladas x100
// Ejemplo: Retorna (188, 355, 370) que significa 1.88, 3.55, 3.70
pub fn calculate_odds(home: &TeamInfo, away: &TeamInfo) -> (u64, u64, u64) {
    
    let base_h = (home.power as i64 + home.form + home.goal_average).max(1) as f64;
    let base_a = (away.power as i64 + away.form + away.goal_average).max(1) as f64;

    let p_home = base_h * 1.10; 
    let p_away = base_a * 0.95; 

    let delta = (p_home - p_away).abs(); 
    let max_draw = 0.28; 
    let min_draw = 0.10; 
    let decay = 65.0;    

    // A más diferencia (delta), menos probabilidad de empate
    let mut prob_draw = max_draw * (-delta / decay).exp();
    if prob_draw < min_draw { prob_draw = min_draw; }

    let rem_prob = 1.0 - prob_draw; 

    let str_h = p_home.powf(2.0);
    let str_a = p_away.powf(2.0);
    let total_str = str_h + str_a;

    let prob_home = (str_h / total_str) * rem_prob;
    let prob_away = (str_a / total_str) * rem_prob;

    // --- 5. Convertir a Cuota + Margen (8%) ---
    let margin = 1.08;
    
    // Cuota = (1 / Probabilidad) / Margen
    let raw_odd_h = (1.0 / prob_home) / margin;
    let raw_odd_d = (1.0 / prob_draw) / margin;
    let raw_odd_a = (1.0 / prob_away) / margin;

    // Ejemplo: 1.884 -> 188.4 -> 188
    (
        (raw_odd_h * 100.0) as u64,
        (raw_odd_d * 100.0) as u64,
        (raw_odd_a * 100.0) as u64
    )
}

pub fn get_market_odds(initial_odds: (u64, u64, u64), current_bets: &Vec<UserOdd>) -> (u64, u64, u64) {
    
    // 1. Constantes
    const VIRTUAL_LIQUIDITY: f64 = 1_000.0;
    const MARGIN: f64 = 1.08;
    const TOKEN_DECIMALS: f64 = 1_000_000_000_000_000_000.0; 

    // 2. Probabilidades Base
    // .max(1) evita división por cero si el input viene mal
    let p_base_h = 100.0 / (initial_odds.0.max(1) as f64); 
    let p_base_t = 100.0 / (initial_odds.1.max(1) as f64);
    let p_base_a = 100.0 / (initial_odds.2.max(1) as f64);

    let mut pool_h = VIRTUAL_LIQUIDITY * p_base_h;
    let mut pool_t = VIRTUAL_LIQUIDITY * p_base_t;
    let mut pool_a = VIRTUAL_LIQUIDITY * p_base_a;

    // 3. Sumar apuestas
    for bet in current_bets {
        let amount_normalized = u128::from(bet.bid) as f64 / TOKEN_DECIMALS;
        
        match bet.selection {
            Selection::Home => pool_h += amount_normalized,
            Selection::Tie  => pool_t += amount_normalized,
            Selection::Away => pool_a += amount_normalized,
        }
    }

    let total_pool = pool_h + pool_t + pool_a;

    // 4. Calcular Probabilidades (Con protección contra 0)
    let (raw_prob_h, raw_prob_t, raw_prob_a) = if total_pool > 0.0 {
        (
            pool_h / total_pool,
            pool_t / total_pool,
            pool_a / total_pool
        )
    } else {
        (0.33, 0.33, 0.33) // Fallback imposible pero seguro
    };

    // 5. Función auxiliar para calcular cuota segura
    // Evita el 0.92 y el Overflow
    let calc_safe_odd = |prob: f64| -> u64 {
        let safe_prob = prob.clamp(0.01, 0.98);
        let odd_decimal = (1.0 / safe_prob) / MARGIN;
        let odd_u64 = (odd_decimal * 100.0) as u64;
        odd_u64.clamp(101, 10_000)
    };

    (
        calc_safe_odd(raw_prob_h),
        calc_safe_odd(raw_prob_t),
        calc_safe_odd(raw_prob_a)
    )
}