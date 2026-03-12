import {
  Accessor,
  Annotator,
  Mutator,
  MutatorQueue,
} from "@server/game/runtime";
import type { ActivityData, GameData } from "@server/types";

/******************************************************************************
 * ### Next
 *
 * A utility for managing changes to game data that occur as a result of the
 * player making a decision.
 ******************************************************************************/
export class Next {
  /** A deep copy of the given game data, to mutate. */
  private gameData: GameData;
  public mutatorQueue: MutatorQueue;
  public annotator: Annotator;

  constructor(gameData: GameData) {
    this.gameData = structuredClone(gameData);
    this.mutatorQueue = new MutatorQueue();
    this.annotator = new Annotator();
  }

  getActivity(): ActivityData {
    return this.gameData.activity;
  }

  getAccessor(opts?: { clone?: boolean }): Accessor {
    const gameData = opts?.clone
      ? structuredClone(this.gameData)
      : this.gameData;
    return new Accessor(gameData);
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to apply all the currently queued mutations and return the updated
   * game data.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  dequeueMutations() {
    this.mutatorQueue.apply(new Mutator(this.gameData));
  }

  finish(): GameData {
    // Increment the game tick.
    this.gameData.tick += 1;
    // Update annotations.
    this.gameData.annotations = this.annotator.annotations;
    return this.gameData;
  }
}
