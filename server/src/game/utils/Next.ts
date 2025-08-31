import { ActivityData, GameData } from "@common/types";
import { GameState, Mutator, MutatorQueue } from "@server/game/utils";

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

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Set the activity for the next game state.
   *
   * Will interpret the difference between the current and given activities to
   * determine whether or not the turn needs to be passed.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  setActivity(activity: ActivityData): GameState {
    if (
      activity.type === "drawingCards" &&
      activity.currentChoice.choosingPlayerId !==
      this.gameData.playerTakingTurnId
    ) {
      this.gameData.playerTakingTurnId =
        activity.currentChoice.choosingPlayerId;
    }
    this.gameData.activity = activity;
    return new GameState(this.gameData);
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Indicates that the next activity has no choices to be made.
   *
   * Should precipitate another pass through the game state machine.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  activityIsInstantaneous(): boolean {
    return this.gameData.activity.currentChoice.max === 0;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to apply all the currently queued mutations and return the updated
   * game state.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  dequeueMutations(): GameState {
    this.mutatorQueue.apply(new Mutator(this.gameData));
    return new GameState(this.gameData);
  }

  finish(): GameData {
    return this.gameData;
  }
}
