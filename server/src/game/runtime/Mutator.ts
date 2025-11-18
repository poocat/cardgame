import { GameData } from "@server/types";
import { IMutator, MutatorArgs } from "@server/game/types";

/******************************************************************************
 * ### Mutator
 *
 * Use to mutate the game data passed to the constructor.
 ******************************************************************************/
export class Mutator implements IMutator {
  private gameData: GameData;

  constructor(gameData: GameData) {
    this.gameData = gameData;
  }

  moveCard(args: MutatorArgs["moveCard"]) {
    const match = this.gameData.cards.find((c) => c.id === args.id);
    if (match === undefined) {
      throw new Error(`Card id ${args.id} not in game.`);
    } else {
      switch (args.location.type) {
        case "inDeck":
          throw new Error("No implementation for moving a card to the deck!");
      }
    }
    match.location = args.location;
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
  }

  setActivity(args: MutatorArgs["setActivity"]) {
    this.gameData.activity = args.activity;
  }
}
