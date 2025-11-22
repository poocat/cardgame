import { ActivityData, GameData } from "@server/types";
import { Accessor, Mutator, MutatorQueue } from "@server/game/runtime";

/******************************************************************************
 * A utility for managing changes to game data that occur as a result of the
 * player making a decision.
 ******************************************************************************/
export class Next {
  /** A deep copy of the given game data, to mutate. */
  private gameData: GameData;
  public mutatorQueue: MutatorQueue;

  constructor(gameData: GameData) {
    this.gameData = structuredClone(gameData);
    this.mutatorQueue = new MutatorQueue();
  }

  get activity(): ActivityData {
    return this.gameData.activity;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to apply all the currently queued mutations and return the updated
   * game data.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  dequeueMutations(): Accessor {
    this.mutatorQueue.apply(new Mutator(this.gameData));
    return new Accessor(this.gameData);
  }

  finish(): GameData {
    return this.gameData;
  }
}
