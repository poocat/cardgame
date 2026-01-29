import { Accessor, Mutator, MutatorQueue } from "@server/game/runtime";
import type { ActivityData, GameData } from "@server/types";

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
    // Increment the game tick.
    this.gameData.tick += 1;
    return this.gameData;
  }
}
