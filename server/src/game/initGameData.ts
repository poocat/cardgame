import { ActionType, GameData } from "@common/game/types";
import { CARDS } from "@server/game/cards/definitions";

export function initGameData(
  players: { id: string; name: string }[] = [
    { id: "dick", name: "Dick" },
    { id: "jane", name: "Jane" },
  ],
): GameData {
  const mockPlayers: GameData["players"] = players.map((player) => ({
    ...player,
    turnCount: 0,
  }));
  const mockCards = ((players: GameData["players"]): GameData["cards"] => {
    const cards: GameData["cards"] = [];
    players.forEach(({ id }) => {
      const playerCards: GameData["cards"] = CARDS.map((c) => ({
        id: `${id} card '${c.name}'`,
        name: c.name,
        type: c.type,
        location: { type: "inDeck" },
        ownerId: id,
      }));
      cards.push(...playerCards);
    });
    return cards;
  })(mockPlayers);
  const mockChips = ((players: GameData["players"]): GameData["chips"] => {
    const chips: GameData["chips"] = [];
    players.forEach(({ id }) => {
      [...Array(10).keys()].map((i) => {
        chips.push({
          id: `${id} chip ${i}`,
          location: { type: "inReserve" },
          ownerId: id,
        });
      });
    });
    return chips;
  })(mockPlayers);
  const mockActions = ((cards: GameData["cards"]): GameData["actions"] => {
    const actions: GameData["actions"] = [];
    cards.forEach((c) => {
      const cardDef = CARDS.find(({ name }) => name === c.name);
      Object.keys(cardDef?.actions ?? {}).forEach((actionType) => {
        actions.push({
          id: `${c.id} ${actionType}`,
          type: actionType as ActionType,
          card: { name: c.name, id: c.id, ownerId: c.ownerId },
        });
      });
    });
    return actions;
  })(mockCards);
  const mockGameData: GameData = {
    players: mockPlayers,
    cards: mockCards,
    chips: mockChips,
    actions: mockActions,
    playerTakingTurnId: mockPlayers[0].id,
    activity: {
      type: "drawingCards",
      previousDecisions: [],
      currentChoice: {
        name: "cardToDraw",
        type: "cardId",
        values: mockCards
          .filter((c) => c.ownerId === mockPlayers[0].id)
          .map((c) => c.id)
          .slice(0, 1),
        min: 1,
        max: 1,
        choosingPlayerId: mockPlayers[0].id,
      },
      nextChoices: [],
    },
  };
  return mockGameData;
}
