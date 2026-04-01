import type {
  choiceValueDigestSchema,
  gameDigestSchema,
  inPlayCardDigestSchema,
  visibleCardDigestSchema,
} from "@common/api/digests";
import { actionTypes } from "@common/game/enums";
import { anonymizeId } from "@server/api/anonymization";
import { getCardDefinition } from "@server/game/cards/registry";
import { msg, resolve } from "@server/text/messages";
import { getLocaleBundle } from "@server/text/registry";
import type {
  ActionType,
  CardData,
  GameData,
  Id,
  Message,
} from "@server/types";
import type z from "zod";

type GameDigest = z.infer<typeof gameDigestSchema>;

type VisibleCardDigest = z.infer<typeof visibleCardDigestSchema>;
type InPlayCardDigest = z.infer<typeof inPlayCardDigestSchema>;
type ChoiceValuesDigest = z.infer<typeof choiceValueDigestSchema>;

function actionTypeMessage(actionType?: ActionType): Message {
  switch (actionType) {
    case "play":
      return msg("action.type.play");
    case "ability":
      return msg("action.type.ability");
    case "discard":
      return msg("action.type.discard");
    default:
      throw new Error(`Unexpected action type: ${actionType}`);
  }
}

function createActivityExplanation(gameData: GameData): Message {
  const choosingPlayerId = gameData.activity.currentChoice.choosingPlayerId;
  const choosingPlayer = gameData.players.find(
    (p) => p.id === choosingPlayerId,
  );
  const choosingPlayerName = choosingPlayer?.name;
  switch (gameData.activity.type) {
    case "choosingAction": {
      return msg("activity.choosingAction.explanation", {
        choosingPlayerName: choosingPlayerName ?? "",
      });
    }
    case "drawingCards": {
      return msg("activity.drawingCards.explanation", {
        choosingPlayerName: choosingPlayerName ?? "",
      });
    }
    case "takingAction": {
      const actionId = gameData.activity.actionId;
      const action = gameData.actions.find((a) => a.id === actionId);
      const playerTakingActionId = gameData.activity.playerTakingActionId;
      const playerTakingAction = gameData.players.find(
        (p) => p.id === playerTakingActionId,
      );
      const cardDef = getCardDefinition(action?.card.name ?? "");
      return msg("activity.takingAction.explanation", {
        currentPlayerName: playerTakingAction?.name ?? "",
        choosingPlayerName: choosingPlayerName ?? "",
        cardName: cardDef.display ?? { key: action?.card.name ?? "" },
        actionType: actionTypeMessage(action?.type),
      });
    }
    default: {
      return { key: "" };
    }
  }
}

/******************************************************************************
 * ### digestGameData
 *
 * Transforms game data for better consumption by the front end, and anonymizes
 * private values like other player ids.
 ******************************************************************************/
export function digestGameData({
  gameData,
  anonymizationSalt,
  playerId,
  locale = "en",
}: {
  gameData: GameData;
  anonymizationSalt: string;
  /* The id of the player requesting the data. Undefined for a spectator. */
  playerId?: Id;
  locale?: string;
}): GameDigest {
  const localeBundle = getLocaleBundle(locale);

  function resolveMessage(msg: Message | undefined, def?: string): string {
    if (msg === undefined) return def ?? "";
    return resolve(msg, localeBundle);
  }

  const anonymizedPlayerIdMap: Record<Id, Id> = {};
  const playerNameMap: Record<Id, string> = {};
  gameData.players.forEach((p) => {
    anonymizedPlayerIdMap[p.id] =
      p.id === playerId ? p.id : anonymizeId(p.id, anonymizationSalt);
    playerNameMap[p.id] = p.name;
  });

  const otherPlayerData = gameData.players.filter((p) => p.id !== playerId);
  const observingPlayerData = gameData.players.find((p) => p.id === playerId);
  const observingPlayerIsChoosing =
    playerId === gameData.activity.currentChoice.choosingPlayerId;

  // If the requesting player is choosing, provide annotations.
  const annotationMap: Record<Id, string[]> = {};
  if (observingPlayerIsChoosing) {
    gameData.annotations.forEach(({ id, message }) => {
      const resolved = resolveMessage(message);
      const match = annotationMap[id];
      if (match) match.push(resolved);
      else annotationMap[id] = [resolved];
    });
  }

  function visibleCardDigest(cardData: CardData): VisibleCardDigest {
    const cardDef = getCardDefinition(cardData.name);
    // Actions should be displayed in order.
    const cardActions = gameData.actions.filter(
      (a) => a.card.id === cardData.id,
    );
    const actions: VisibleCardDigest["actions"] = [];
    for (const type of actionTypes) {
      const matchDef = cardDef.actions[type];
      const matchData = cardActions.find((a) => a.type === type);
      if (matchDef && matchData)
        actions.push({
          id: matchData.id,
          type,
          instructions: resolveMessage(matchDef.instructions),
          annotations: annotationMap[matchData.id] ?? [],
        });
    }

    const imageSourceLink = cardDef.links?.find((l) => l.type === "imgsrc");

    return {
      id: cardData.id,
      name: cardData.name,
      display: resolveMessage(cardDef.display, cardData.name),
      triggerInstructions: resolveMessage(cardDef.trigger?.instructions),
      imageSourceUrl: imageSourceLink?.url ?? "",
      type: cardData.type,
      lastMovedOnTurn: cardData.lastMovedOnTurn,
      lastMovedOnTick: cardData.lastMovedOnTick,
      actions,
      chips: gameData.chips
        .filter(
          (c) =>
            c.location.type === "onCard" && c.location.cardId === cardData.id,
        )
        .map((c) => ({ id: c.id })),
    };
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to create digests for cards in play.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  function cardInPlayDigest(cardData: CardData): InPlayCardDigest {
    return {
      ...visibleCardDigest(cardData),
      exhausted:
        cardData.location.type === "inPlay" && cardData.location.exhausted,
    };
  }

  // Cards should be ordered based on how long they have been at their current
  // location.
  const allCards = [...gameData.cards];
  allCards.sort((a, b) => a.lastMovedOnTick - b.lastMovedOnTick);

  // The values for the current choice are anonymized and checked for
  // associations with cards.
  const choiceValues = gameData.activity.currentChoice.values;
  const choiceValuesDigest: ChoiceValuesDigest[] = [];
  switch (gameData.activity.currentChoice.type) {
    case "arbitrary": {
      const labels = gameData.activity.currentChoice.labels;
      choiceValuesDigest.push(
        ...choiceValues.map((v) => ({
          value: v,
          onCardId: null,
          label: resolveMessage(labels?.[v], v),
        })),
      );
      break;
    }
    case "cardId": {
      choiceValuesDigest.push(
        ...choiceValues.map((v) => {
          const card = allCards.find((c) => c.id === v);
          const label = card?.name ?? "Card";
          return { value: v, onCardId: null, label };
        }),
      );
      break;
    }
    case "playerId": {
      choiceValuesDigest.push(
        ...choiceValues.map((playerId) => {
          const player = gameData.players.find((p) => p.id === playerId);
          const label = player?.name ?? playerId;
          return {
            value: anonymizedPlayerIdMap[playerId],
            onCardId: null,
            label,
          };
        }),
      );
      break;
    }
    case "actionId": {
      gameData.actions
        .filter((a) => choiceValues.includes(a.id))
        .forEach((a) => {
          const label = `[${a.type}] ${a.card.name}`;
          choiceValuesDigest.push({ value: a.id, onCardId: a.card.id, label });
        });
      break;
    }
    case "chipId": {
      gameData.chips
        .filter((c) => choiceValues.includes(c.id))
        .forEach((c) => {
          const onCardId =
            c.location.type === "onCard" ? c.location.cardId : null;
          choiceValuesDigest.push({ value: c.id, onCardId, label: "Chip" });
        });
      break;
    }
  }

  const wins = gameData.wins.sort((a, b) => a.onTick - b.onTick);
  const winner =
    wins.length > 0
      ? {
          id: anonymizedPlayerIdMap[wins[0].playerId],
          name: playerNameMap[wins[0].playerId],
        }
      : null;

  const digest: GameDigest = {
    playerTakingTurnId: anonymizedPlayerIdMap[gameData.playerTakingTurnId],
    activity: {
      type: gameData.activity.type,
      explanation: resolveMessage(createActivityExplanation(gameData)),
      choice: {
        name: gameData.activity.currentChoice.name,
        type: gameData.activity.currentChoice.type,
        min: gameData.activity.currentChoice.min,
        max: gameData.activity.currentChoice.max,
        values: choiceValuesDigest,
        choosingPlayerId:
          anonymizedPlayerIdMap[
            gameData.activity.currentChoice.choosingPlayerId
          ],
        instructions: resolveMessage(
          gameData.activity.currentChoice.instructions,
        ),
      },
      previouslyChosenValues: gameData.activity.previousDecisions.flatMap(
        (d) => d.values,
      ),
    },
    otherPlayers: otherPlayerData.map((playerData) => {
      return {
        id: anonymizedPlayerIdMap[playerData.id],
        name: playerData.name,
        cardsInDeck: allCards
          .filter(
            (c) => c.ownerId === playerData.id && c.location.type === "inDeck",
          )
          .map((c) => ({
            id: c.id,
          })),
        cardsInHand: allCards
          .filter(
            (c) => c.ownerId === playerData.id && c.location.type === "inHand",
          )
          .map((c) => ({
            id: c.id,
          })),
        cardsInPlay: allCards
          .filter(
            (c) => c.ownerId === playerData.id && c.location.type === "inPlay",
          )
          .map((c) => cardInPlayDigest(c)),
        chipsInReserve: gameData.chips
          .filter(
            (c) =>
              c.ownerId === playerData.id && c.location.type === "inReserve",
          )
          .map((c) => ({ id: c.id })),
        chipsinChannel: gameData.chips
          .filter(
            (c) =>
              c.ownerId === playerData.id && c.location.type === "inChannel",
          )
          .map((c) => ({ id: c.id })),
      };
    }),
    playerOrder: gameData.players.map((p) => anonymizedPlayerIdMap[p.id]),
    winner,
  };

  if (observingPlayerData) {
    digest.observingPlayer = {
      id: observingPlayerData.id,
      name: observingPlayerData.name,
      cardsInDeck: allCards
        .filter(
          (c) =>
            c.ownerId === observingPlayerData.id &&
            c.location.type === "inDeck",
        )
        .map((c) => ({
          id: c.id,
        })),
      cardsInHand: allCards
        .filter(
          (c) =>
            c.ownerId === observingPlayerData.id &&
            c.location.type === "inHand",
        )
        .map((c) => visibleCardDigest(c)),
      cardsInPlay: allCards
        .filter(
          (c) =>
            c.ownerId === observingPlayerData.id &&
            c.location.type === "inPlay",
        )
        .map((c) => cardInPlayDigest(c)),
      chipsInReserve: gameData.chips
        .filter(
          (c) =>
            c.ownerId === observingPlayerData.id &&
            c.location.type === "inReserve",
        )
        .map((c) => ({ id: c.id })),
      chipsinChannel: gameData.chips
        .filter(
          (c) =>
            c.ownerId === observingPlayerData.id &&
            c.location.type === "inChannel",
        )
        .map((c) => ({ id: c.id })),
    };
  }
  return digest;
}
