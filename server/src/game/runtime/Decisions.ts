import { ChoiceValue, Decision, Id } from "@server/types";
import { DeepReadonly, IDecisions } from "@server/game/types";

/******************************************************************************
 * ### Decisions
 *
 * An accessor for the values chosen for a set of decisions.
 ******************************************************************************/
export class Decisions implements IDecisions {
  decisions: DeepReadonly<Decision[]>;

  constructor(decisions: Decision[]) {
    this.decisions = decisions;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to get all the values chosen for the given name. If a player ID is
   * given, will only include values chosen by that player.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  getValues(args: { name: string; playerId?: Id }): ChoiceValue[] {
    let decisions = this.decisions.filter((d) => d.name === args.name);
    if (args.playerId) {
      decisions = decisions.filter((d) => d.playerId === args.playerId);
    }
    const values: ChoiceValue[] = [];
    decisions.forEach((d) => values.push(...d.values));
    return values;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to get the set of IDs of players who have made choices for the given
   * name.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  getPlayerIds(args: { name: string }): Id[] {
    const players = new Set(
      this.decisions.filter((d) => d.name === args.name).map((d) => d.playerId),
    );
    return [...players];
  }
}
