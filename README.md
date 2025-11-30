# LineraOdds

Real-time sports betting system, built on Linera.

> [!WARNING]
> **Development Notice**: Since LineraOdds is still under development and event handling needs improvement, chain interactions and data updates may fail (query) - check browser console. Therefore, at some point it may be necessary to refresh the web page and reconnect. We are working on solutions.

## Stack

- Vite
- Vue3 composition API
- Pinia
- Linera SDK
- TailwindCSS

## Features

- **Internal Token Management**: Built-in fungible token system for betting, including minting and transfers.
- **Real-time Odds Updates**: Dynamic odds adjustment based on betting activity.
- **Data Blob Storage**: Efficient storage of large event data using Linera's data blobs.
- **Robust Event Handling**: Secure and reliable event processing with manual JSON mapping.
- **User-Friendly UI**: Responsive design with loading states and clear feedback.
- **Cross-chain Interactions**: Seamless betting across different chains.
- **Stream Subscriptions**: Real-time updates of event data blobs across user chains via Linera streams.

## Architecture

- **Single Application Contract**: Manages events, bets, and token balances.
- **Data Blobs**: Stores static or semi-static event data to reduce state size.
- **Cross-chain Messages**: Handles bet placement and reward distribution.

## Frontend Overview

The frontend is built with **Vue 3** and **TypeScript**, using **Pinia** for state management and **TailwindCSS** for styling. It interacts directly with the Linera blockchain via the GraphQL API.

Key functionalities include:
-   **Wallet Connection**: Automatically connects to the local Linera wallet.
-   **Event Display**: Fetches and displays sports events from data blobs.
-   **Betting Interface**: Allows users to place bets on specific outcomes (Home, Away, Tie).
-   **My Bets**: Tracks user's active and past bets, calculating potential winnings.
-   **Token Balance**: Displays the user's current token balance, updated in real-time.

## GraphQL API

### Mutations

#### `createEvent`
Creates a new sports event.

```graphql
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
```

#### `placeBet`
Places a bet on a specific event.

```graphql
mutation PlaceBet(
  $home: String!,
  $away: String!,
  $league: String!,
  $startTime: Int!,
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

### Queries

#### `blobEvents`
Retrieves all events stored in the data blob. This is the primary method for fetching events.

```graphql
query BlobEvents {
  blobEvents {
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
    result {
      winner
      homeScore
      awayScore
    }
  }
}
```

#### `eventsBlob`
Retrieves the raw JSON string of events from the data blob. Useful for client-side parsing if needed.

```graphql
query EventsBlob {
  eventsBlob
}
```

#### `events`
Retrieves events stored in the contract's MapView (legacy/fallback storage).

```graphql
query Events {
  events {
    id
    typeEvent
    league
    teams {
      home
      away
    }
    status
  }
}
```

#### `myOdds`
Retrieves all bets placed by the current user.

```graphql
query MyOdds {
  myOdds {
    eventId
    odd
    bid
    selection
    league
    teams {
      home
      away
    }
    status
    startTime
    placedAt
  }
}
```

#### `eventOdds`
Retrieves all bets placed on a specific event.

```graphql
query EventOdds($eventId: String!) {
  eventOdds(eventId: $eventId) {
    userId
    odd
    bid
    selection
    placedAt
  }
}
```

#### `balance`
Retrieves the current user's token balance.

```graphql
query Balance {
  balance
}
```

## How to Run Locally

### Prerequisites

Ensure you have the following installed:

- **Rust & Cargo**: [Install Rust](https://www.rust-lang.org/tools/install)
- **Linera Toolchain**: Follow the [Linera installation guide](https://linera.dev/developers/getting_started/installation.html) to install `linera`, `linera-proxy`, and `linera-server`.
- **Node.js & npm**: [Install Node.js](https://nodejs.org/) (LTS version recommended).
- **Bash**: Required to execute the startup script.

### Steps

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd lineraodds
    ```

2.  **Make the script executable**:
    ```bash
    chmod +x run.bash
    ```

3.  **Run the startup script**:
    ```bash
    ./run.bash
    ```

    This script will automatically:
    - Clean up previous Linera configurations.
    - Start a local Linera network with a faucet.
    - Initialize wallets and chains.
    - Build and deploy the `management` contract.
    - Publish event data blobs.
    - Start the Linera GraphQL services (ports 8081, 8082).
    - Install frontend dependencies.
    - Start the Vite development server (port 5173).

4.  **Access the Application**:
    Open your browser and navigate to `http://localhost:5173`.

5.  **Stop the Application**:
    Press `Ctrl+C` in the terminal where the script is running. The script handles cleanup of background processes.

## Docker Support (Buildathon Template)

This project includes Docker support based on the Linera Buildathon template, allowing you to run the entire application in a containerized environment without manually installing dependencies.

### Files

-   **`Dockerfile`**: Sets up the environment with Rust, Linera toolchain (v0.15.6), Node.js, and system dependencies. It uses `run.bash` as the entrypoint.
-   **`compose.yaml`**: Defines the `app` service, maps necessary ports (5173 for the frontend, 8080+ for Linera services), and mounts the source code for development.

### Running with Docker Compose

1.  **Start the application**:
    ```bash
    docker compose up
    ```
    This command will build the image (if not already built) and start the services defined in `compose.yaml`. The `run.bash` script will execute inside the container, setting up the Linera network and starting the application.

2.  **Access the Application**:
    Once the startup process completes, open your browser and navigate to `http://localhost:5173`.

3.  **Stop the Application**:
    Press `Ctrl+C` or run:
    ```bash
    docker compose down
    ```