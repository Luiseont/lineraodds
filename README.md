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

- Use of the **factory contract** pattern to create independent temporary chain to manage events. Information is provided by an oracle that, based on parameters, will search for relevant upcoming events and calculate the odds of winning.

- **Event contract** (allowing for the implementation of prediction markets in the future) that will host the event information on **its own microchain/application** will manage the funds and the specific state, closing the contract/chain once the event ends. This action will allow the funds obtained in the event of a win to be sent.

  - This approach will allow the application of exclusive odds/bets for live events.

- A **ticket contract** represents the "authorship" of a bet. This contract acts as a proxy to send cross-chain messages to the time chain hosting the event.

- **Oracles** that, in addition to creating events to allow betting, will maintain an updated status of each event, from start to finish.


## The life cycle of an event - and its stakes -

1. The **oracle** finds a relevant event and calculates the odds for the possible outcomes.

2. It sends the information to the **Factory Contract.** A temporary chain is created with an instance of the event contract, saving the application ID.

3. The list of events <applicationsId> is displayed on the platform with the relevant information, date and time, status, and available odds.

4. The user selects their favorite event or attractive odds and places a monetary bet (in LUSD).

5. An instance of the **ticket contract** is generated on the user's microchain.

6. This instance receives the bet information (odds, amount, application ID) and sends a **cross-chain message** to the event chain with this information.

7. The relevant calls are made to update/transfer funds.

8. The odds are updated.

9. The user bets placed.

10. The **oracle** notifies the user of the event's completion and the outcome, **closing the temporary chain.**

11. Prizes are calculated and transferred via **cross-chain messages.**

11. Update the bet status in the ticket contract in the user microchain.

12. The event is considered **complete.**


