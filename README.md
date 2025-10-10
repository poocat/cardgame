# card-game

A simple, strategy-based card game, without thematic elements.

## Description

The object of the game is to be the first player to accumulate a certain number of "chips" onto a certain type of card that is in play.

On a player's turn, they first draw cards from their decks into to their hands, then take any number of available actions from their cards to affect the game state. The possible effects include:
- Moving cards to different locations 
  - E.g. to/from the player's deck, hand, play area, or discard area
- Changing a card's "exhausted" state
  - Player's can only take actions from cards in play that are not exhausted
  - Taking an action from a card in play exhausts the card
  - Exhausted cards are unexhausted automatically at the beginning of their owners' next turn.
- Moving "chips" to different locations
  - E.g. to/from the player's reserve, cards.

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

# Dev

- Prerequisites
  - Install Node (e.g. [download](https://nodejs.org/en/download/) an installer...)
    - At the time of this writing, Node was on version 22.
    
- Server `/server`
  - To install dependencies:
    ```
    npm install
    ```
  - To run a (jank) test on the state machine using js runtime:
    ```
    npm run test
    ```
