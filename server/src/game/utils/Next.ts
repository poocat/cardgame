import { ActivityData, GameData } from "@server/types";
import { Accessor, Mutator, MutatorQueue } from "@server/game/utils";

/******************************************************************************
 * A utility for managing changes to game data that occur as a result of the
 * player making a decision.
 ******************************************************************************/
export class Next {
  /** A deep copy of the given game state, to mutate. */
  private gameData: GameData;
  public mutatorQueue: MutatorQueue;

  constructor(gameData: GameData) {
    this.gameData = JSON.parse(JSON.stringify(gameData));
    this.mutatorQueue = new MutatorQueue();
  }

  get activity(): ActivityData {
    return this.gameData.activity;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to apply all the currently queued mutations and return the updated
   * game state.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  dequeueMutations(): Accessor {
    this.mutatorQueue.apply(new Mutator(this.gameData));
    return new Accessor(this.gameData);
  }

  finish(): GameData {
    return this.gameData;
  }
}
