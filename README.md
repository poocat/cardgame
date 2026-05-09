# cardgame

⚠️ Work in Progress

A multi-player strategy-based card game for the web.

This stems from a personal project, originally made with flashcards, and play-tested with friends and family. Unfortunately, gathering groups of people to sit at a table to play the game became a bottleneck for testing new rules and cards. So, it made sense to turn it into a web app, where people could play from anywhere, bots could be made to play against (or against one another), and designs could be evaluated with quantitative data.

## Principles

- Keep it simple, avoiding unnecessary ornamentations and external dependencies.
- Keep it isolated, ensuring the game engine, transport layer, and UI are separately testable and extensible.
- Keep it anonymous, minimizing users' stored personal data.

## Engine

The game is turn-based. The engine is always waiting for exactly one player to choose from a set of values. The state machine takes the player's decision and the game state as a JSON document, and cranks out a new game state with a new choice to be made, and the cycle repeats.

## Architecture

- Monorepo with separate server and client applications, using React, Vite, TypeScript, ExpressJS, MongoDB.
- Shared schemas and type definitions between server and client.
- Purely functional game engine.
- Production assets (cards, copy) maintained in private repo configured as submodule.

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
.
.
.
└── private/             # Private submodule
    ├── cards/           # Production card definitions and images
    └── copy/            # Themed rulebook, explanations, et cetera
```

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

### Prerequisites:
- **Node.js** ([download](https://nodejs.org/en/download/)) for runtime and dependency management
  - To verify the installation, open a terminal and run:
    ```
    node --version
    ```
    (This should print the version number for the installed version of Node. The earliest version this project has been tested with is `v22.18.0`.)
  - It is unlikely that Node would be installed without the included package manager, but you can also verify that the package manager is installed by running:
    ```
    npm --version
    ```
    (The earliest version this project has been tested with is `10.9.3`.)
- **Docker** (e.g. [Docker Desktop](https://www.docker.com/products/docker-desktop/)) to bring up a local development database
  - To verify the installation, open a terminal and run:
    ```
    docker --version
    ```
    (The earliest version this project has been tested with is `Docker version 28.5.1, build e180ab8`.)

### Server
The server application represents the implementation of the game "engine", and the interface through which web applications can host games.

#### Set up Database:
The server requires a connection to a database. By default, the application will look for a database running on locally from the address `mongodb://localhost:27017`.
- To bring up the local database in a docker container, open a new terminal and navigate to the top folder in this repository, then run:
  ```
  docker compose -f docker/compose-local-db.yml up
  ```
  This command is free-running, and the terminal running it should be left open in order to run the server application.
- To connect to a different database, you will need a connection string to a different MongoDB instance:
  - Copy and rename the environment file `/server/.env.example` to `/server/.env`. You can do this manually if you are using a file explorer that displays hidden files, or you may open a terminal and navigate to the top folder in this repository and run:
    ```
    cp server/.env.example server/.env
    ```
  - Open this file and add the connection string:
    ```diff
    +MONGODB_URI="mongodb+srv://username:password@example.mongodb.net"
    ```
  - Restart the server app.

#### Install Server Dependencies and Run:
- Open a terminal and navigate to the top folder in this repository.
- Install dependencies by running:
  ```
  npm install
  ```
  (Note, this will also install the client's dependencies, allowing you to skip the install step for running the client, as described below.)
- Run the development server:
  ```
  npm run dev --workspace=server
  ```
  This command is free-running, but will not watch for changes made to the server code in `/server`. The command will need to be stopped (CTRL+C) and started again to incorporate changes.

If the server does not start due to another server using the default port `7070`, you may choose a new port.
- If you haven't already, copy and rename the environment file `/server/.env.example`. Run:
  ```
  cp server/.env.example server/.env
  ```
- Open this file and specify the new port:
  ```diff
  +PORT=7071
  ```
- Restart the server app.

#### Use Private Submodule Repository:
If you have access to the private repository that defines the game cards used in production, you can run the server with those resources.
- Initialize the submodule:
  ```
  git submodule init
  ```
  This should populate a folder in the top folder of this repository, `/private`.
- If you haven't already, copy and rename the environment file `/server/.env.example`:
  ```
  cp server/.env.example server/.env
  ```
- Open this file and confirm that the `/private` folder is one level up from the `/server` folder:
  ```bash
  PRIVATE_PATH=../private
  ```
- Follow the instructions above to start the server. You should see a number of logs indicating that the private resources were successfully loaded, e.g. `loaded private cards`, `loaded private locales`.

#### Run server tests:
- Open a new terminal and navigate to the top folder of this repository, and run:
  ```
  npm run test:public --workspace=server
  ```
- If using the private submodule repository, you can remove the `:public` suffix and run:
  ```
  npm run test --workspace=server
  ```

### Client
The client application is the implementation of the user interface. It requires an instance of the client running continuously to read and write game data.

#### Install client dependencies and run:
- Open a terminal and navigate to the top folder in this repository.
- If you have not already, install dependencies by running:
  ```
  npm install
  ```
- Start the development server by running:
  ```
  npm run dev --workspace=client
  ```
  This command is free-running, and will watch for changes made to the code in `/client`.

If you had changed the port when configuring the server from the default `7070`, you will need to configure the development server to make API at the new address.
- Open `client/vite.config.ts`, and change the following line:
  ```diff
  proxy: {
    "/api": {
  -   target: "http://localhost:7070",
  +   target: "http://localhost:7071",
      changeOrigin: true,
    },
  },
  ```

#### Use Remote API
By default, the client app development server routes API requests through the server running locally. If you want to use an instance of the API that is already deployed, you will need to reconfigure the environment.

- Copy and rename the environment file `/client/.env.example`. Open a new terminal and navigate to the top folder of this repository. Then, run:
  ```
  cp client/.env.example client/.env
  ```
- Open this file and set the `VITE_API_BASE_URL` environment variable:
  ```diff
  -VITE_API_BASE_URL=
  +VITE_API_BASE_URL="https://api.example.com"
  ```

### Working with the Private Submodule:
- Update the submodule, to get latest changes:
  ```
  git submodule update
  ```
- Switch to a different submodule branch:
  ```
  cd private
  git checkout <branch>
  ```
- After committing changes in the submodule, pin the submodule to the current commit:
  ```
  git add private
  ```

