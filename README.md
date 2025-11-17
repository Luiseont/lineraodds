# LineraOdds

Real-time sports betting system, built on Linera

## Stack

- Vite
- Vue3 composition API
- Pinia
- Linera SDK

## Features 

- Automatic tokens transfers using fungible contract 
- Deployments of LUSD stablecoin - bridge assets from other chains -
- Real-time odds updates
- Oracles for real world data
- Automatic process in the bet life-cycle 

## Arquitecture

- Single Application contract for event management, using cross-chain menssages for bet placing

## Queries

# Mutation: createEvent
mutation CreateEvent(
  $id: String!,
  $type_event: String!,
  $league: String!,
  $home: String!,
  $away: String!,
  $homeOdds: Int!,
  $awayOdds: Int!,
  $TieOdds: Int!,
  $startTime: Int!
) {
  createEvent(
    id: $id,
    typeEvent: $type_event,
    league: $league,
    home: $home,
    away: $away,
    homeOdds: $homeOdds,
    awayOdds: $awayOdds,
    tieOdds: $TieOdds,
    startTime: $startTime
  )
}

```graphql
# Mutation: placeBet
# Note: kept variable names to match your schema.
# If your schema expects `startTime` (not `starTime`), adjust the variable name below.
mutation PlaceBet(
  $home: String!,
  $away: String!,
  $league: String!,
  $startTime: Int!, # originally provided as `$starTime`
  $odd: Int!,
  $selection: String!,
  $bid: Int!,
  $event_id: String!
) {
  placeBet(
    home: $home,
    away: $away,
    league: $league,
    startTime: $startTime,
    odd: $odd,
    selection: $selection,
    bid: $bid,
    eventId: $event_id
  )
}
```

```json
// Example variables for placeBet
{
  "home": "Team A",
  "away": "Team B",
  "league": "Premier League",
  "startTime": 1731868800,
  "odd": 210,
  "selection": "HOME",
  "bid": 100,
  "event_id": "E-123"
}
```

```graphql
# Query: events
query Events {
  events {
    id
    typeEvent
    league
    teams {
      home
      away
    }
    odds {
      home
      away
      tie
    }
    status
    startTime
  }
}
```

```graphql
# Query: myOdds (current user's odds)
query MyOdds {
  myOdds {
    odd
    bid
    selection
  }
}
```

```graphql
# Query: odds (all odds)
query Odds {
  odds {
    userId
    odd
    bid
    placedAt
    selection
  }
}
```
