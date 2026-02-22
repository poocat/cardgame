import { CONSTANTS } from "@common/game/constants";
import type { Accessor } from "@server/game/runtime";
import type { PlayerData } from "@server/types";

/******************************************************************************
 * ### getWinners
 *
 * Should be called each time the state machine produces a new state.
 *
 * Checks for win conditions:
 * - A player has at N or more chips on a single "consumer" type card
 * - A player has all of their chips on "consumer" type cards.
 ******************************************************************************/
export function getWinners(accessor: Accessor): PlayerData[] {
  const winningPlayers: PlayerData[] = [];
  accessor.players.forEach((p) => {
    const candidatesConsumers = accessor.getCards({
      playerIds: [p.id],
      types: ["consumer"],
      minChips: CONSTANTS.numChipsOnConsumersToWin,
    });
    if (candidatesConsumers.length > 0) {
      winningPlayers.push(p);
      return;
    }
    // Look for chips not on consumer cards.
    const allPlayerConsumerIds = accessor
      .getCards({
        playerIds: [p.id],
        types: ["consumer"],
      })
      .map((c) => c.id);
    const looseChips = accessor
      .getChips({ playerIds: [p.id] })
      .some(
        (c) =>
          c.location.type !== "onCard" ||
          !allPlayerConsumerIds.includes(c.location.cardId),
      );
    if (!looseChips) {
      winningPlayers.push(p);
      return;
    }
  });
  return winningPlayers;
}
