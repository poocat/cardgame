import type { IMutator, MutatorArgs } from "@server/game/types";
import type { GameData } from "@server/types";

/******************************************************************************
 * ### Mutator
 *
 * Use to mutate the game data passed to the constructor in place.
 ******************************************************************************/
export class Mutator implements IMutator {
  private gameData: GameData;

  constructor(gameData: GameData) {
    this.gameData = gameData;
  }

  moveCard(args: MutatorArgs["moveCard"]) {
    const index = this.gameData.cards.findIndex((c) => c.id === args.id);
    if (index === -1) {
      throw new Error(`Card id ${args.id} not in game.`);
    }
    const match = this.gameData.cards[index];
    switch (args.location.type) {
      case "inDeck":
        // Cards can only be moved to the top of the deck.
        this.gameData.cards.splice(index, 1);
        this.gameData.cards.unshift(match);
    }
    match.location = args.location;
    match.lastMovedOnTick = this.gameData.tick;
    match.lastMovedOnTurn = this.gameData.turn;
  }

  moveChips(args: MutatorArgs["moveChips"]) {
    this.gameData.chips
      .filter((c) => args.ids.includes(c.id))
      .forEach((c) => {
        c.location = args.location;
      });
  }

  exhaustCard(args: MutatorArgs["exhaustCard"]) {
    const match = this.gameData.cards.find((c) => c.id === args.id);
    if (match === undefined) {
      throw new Error(`Card id ${args.id} not in game.`);
    } else if (match.location.type === "inPlay") {
      match.location.exhausted = args.value;
    }
  }

  passTurn(args: MutatorArgs["passTurn"]) {
    const currentPlayer = this.gameData.players.find((p) => p.id === args.from);
    if (!currentPlayer) {
      throw new Error(`Player '${args.from}' not in game.`);
    } else {
      currentPlayer.turnCount += 1;
    }
    this.gameData.playerTakingTurnId = args.to;
    this.gameData.turn += 1;
  }

  setActivity(args: MutatorArgs["setActivity"]) {
    this.gameData.activity = args.activity;
  }

  addWin(args: MutatorArgs["addWin"]) {
    const alreadyWon = this.gameData.wins.some(
      (w) => w.playerId === args.playerId,
    );
    if (!alreadyWon) {
      this.gameData.wins.push({
        playerId: args.playerId,
        onTick: this.gameData.tick,
      });
    }
  }
}
