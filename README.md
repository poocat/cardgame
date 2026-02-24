# cardgame

⚠️ Work in Progress

A multi-player strategy-based card game for the web.

This stems from a personal project, originally made with flashcards, and play-tested with friends and family. Unfortunately, gathering groups of people to sit at a table to play the game became a bottleneck for testing new rules and cards. So, it made sense to turn it into a web app, where people could play from anywhere, bots could be made to play against (or against one another), and designs could be evaluated with quantitative data.

## Principles

- Keep it simple, avoiding unnecessary abstraction and ornamentation.
- Keep it isolated, ensuring the game engine, transport layer, and UI are separately testable and extensible.
- Keep it anonymous, minimizing users' stored personal data.

## Architecture

- Monorepo with separate server and client applications, using React, Vite, TypeScript, ExpressJS, MongoDB.
- Shared schemas and type definitions between server and client.
- Purely functional game engine.

```
├── server/              # game engine and API (ExpressJS, TypeScript)
│   └── src/
│       ├── game/        # game logic and state machine
│       ├── api/         # REST API transport layer
│       └── test/        # unit tests covering game engine and card features
│
├── common/              # resources shared between front and back end
│   ├── api/             # API route map and schemas
│   └── game/            # types and constants
│
└── client/              # SPA client (React, TypeScript)
    └── src/
        ├── components/  # generic components e.g. buttons, inputs
        ├── utils/       # utils for fetching, polling
        └── routes/ 
            ├── rooms/   # room UI for gathering players and starting games
            └── games/   # game UI
```

A game is stored as a JSON object, containing arrays of players, cards, chips, and actions, and data about the current activity. An active game is always waiting for a single player to choose from a set of values. Once the values are received, the state machine cranks out a new choice, with a new set of values, for a new player, and the cycle repeats.

## Game Rules

The object of the game is to be the first player to accumulate a certain number of "chips" onto a certain type of card that is in play.

On a player's turn, they first draw cards from their decks into their hands, then take any number of available actions from their cards to affect the game state. The possible effects include:
- Moving cards to different locations 
  - E.g. to/from the player's deck, hand, play area, or discard area
- Changing a card's "exhausted" state
  - Players can only take actions from cards in play that are not exhausted
  - Taking an action from a card in play exhausts the card
  - Exhausted cards are unexhausted automatically at the beginning of their owners' next turn.
- Moving "chips" to different locations
  - E.g. in and out of the player's "reserve", and onto and off of their cards.

There are different types of cards:
- Producers
  - These typically provide actions that move chips onto themselves from the reserve.
- Consumers
  - These typically provide actions that move chips onto themselves from "producer" type cards.
  - While in play, must have at least one chip on them, else they must be discarded.

There are different types of actions available on cards:
- Play
  - These actions can only be taken from cards that are in the player's hand.
- Discard
  - These actions can only be taken from cards in play.
  - Taking a discard action will automatically move the card into its owner's discard area.
- Ability
  - These actions can only be taken from cards in play.
  - Taking an ability action exhausts the card.

## Development

- Prerequisites:
  - Install Node (e.g. [download](https://nodejs.org/en/download/) an installer...)
    - At the time of this writing, Node was on version 22.
  - Install Docker
    
- Server:
  - Bring up database (`/`):
    ```
    docker compose up
    ```
  - Install dependencies (`/server`):
    ```
    npm install
    ```
  - Run tests (`/server`):
    ```
    npm run test
    ```
  - To start server locally (`/server`):
    ```
    npm run start
    ```

- Client:
  - To install dependencies (`/client`):
    ```
    npm install
    ```
  - To run the site locally (`/client`):
    ```
    npm run dev
    ```

- Setting up Private Card Submodule (`/`):
  - Init the submodule:
    ```
    git submodule init
    ```
  - Update the submodule, to get latest changes:
    ```
    git submodule update
    ```
  - Switch to a different submodule branch:
    ```
    cd server/src/game/cards/private
    git checkout <branch>
    ```
  - Add the path to the card registry (relative to the `/server` folder) to the environment:
    ```
    export PRIVATE_CARDS_PATH=./src/game/cards/private
    ```
    Or, add a file, `server/.env` with the contents:
    ```
    PRIVATE_CARDS_PATH=./src/game/cards/private
    ```
