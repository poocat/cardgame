import { randomUUID } from "crypto";
import { CONSTANTS } from "@common/game/constants";
import { ActionType, GameData } from "@server/types";
import { CARDS } from "@server/game/cards/definitions";

function makeId(): string {
  return randomUUID().toString();
}

function shuffle(array: unknown[]) {
  let currentIndex = array.length;
  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

export function initGameData(
  players: { id: string; name: string }[],
): GameData {
  const playerData: GameData["players"] = players.map((player) => ({
    ...player,
    turnCount: 0,
  }));
  shuffle(playerData);
  const firstPlayer = playerData[0];

  const cardData = ((players: GameData["players"]): GameData["cards"] => {
    const cards: GameData["cards"] = [];
    players.forEach(({ id }) => {
      const playerCards: GameData["cards"] = CARDS.map((c) => ({
        id: makeId(),
        name: c.name,
        type: c.type,
        location: { type: "inDeck" },
        ownerId: id,
      }));
      shuffle(playerCards);
      cards.push(...playerCards);
    });
    return cards;
  })(playerData);
  const chipData = ((players: GameData["players"]): GameData["chips"] => {
    const chips: GameData["chips"] = [];
    players.forEach(({ id }) => {
      [...Array(CONSTANTS.numChipsPerPlayer).keys()].map((i) => {
        chips.push({
          id: makeId(),
          location: { type: "inReserve" },
          ownerId: id,
        });
      });
    });
    return chips;
  })(playerData);
  const actionData = ((cards: GameData["cards"]): GameData["actions"] => {
    const actions: GameData["actions"] = [];
    cards.forEach((c) => {
      const cardDef = CARDS.find(({ name }) => name === c.name);
      Object.keys(cardDef?.actions ?? {}).forEach((actionType) => {
        actions.push({
          id: makeId(),
          type: actionType as ActionType,
          card: { name: c.name, id: c.id, ownerId: c.ownerId },
        });
      });
    });
    return actions;
  })(cardData);
  const data: GameData = {
    players: playerData,
    cards: cardData,
    chips: chipData,
    actions: actionData,
    playerTakingTurnId: playerData[0].id,
    activity: {
      type: "drawingCards",
      previousDecisions: [],
      currentChoice: {
        name: "cardToDraw",
        type: "cardId",
        values: cardData
          .filter((c) => c.ownerId === firstPlayer.id)
          .map((c) => c.id)
          .slice(0, 1),
        min: 1,
        max: 1,
        choosingPlayerId: firstPlayer.id,
      },
      nextChoices: [],
    },
  };
  return data;
}
