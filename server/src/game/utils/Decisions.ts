import { ChoiceValue, Decision, Id } from "@server/types";

/******************************************************************************
 * ### Decisions
 *
 * Use as a convenient way of getting decisions values by their associated
 * choice name.
 ******************************************************************************/
export class Decisions {
  private decisions: Decision[];

  constructor(decisions: Decision[]) {
    this.decisions = decisions;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to get all the decisions made for the given name. If a player ID is
   * given, will only include decisions made by that player.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  get(name: string, playerId?: Id): ChoiceValue[] {
    let decisions = this.decisions.filter((d) => d.name === name);
    if (playerId) {
      decisions = decisions.filter((d) => d.playerId === playerId);
    }
    const values: ChoiceValue[] = [];
    decisions.forEach((d) => values.push(...d.values));
    return values;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to get the set of IDs of players who have made choices for the given
   * name.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  getPlayerIds(name: string): Id[] {
    const players = new Set(
      this.decisions.filter((d) => d.name === name).map((d) => d.playerId),
    );
    return [...players];
  }
}
