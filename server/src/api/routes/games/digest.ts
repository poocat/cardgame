/**
 * A transformation layer between the storage and transport layers
 *
 * Anonymizes private values (e.g. other players' ids), and resolves template
 * messages
 */
import type {
  choiceValueDigestSchema,
  gameDigestSchema,
  inPlayCardDigestSchema,
  visibleCardDigestSchema,
} from "@common/api/digests";
import { actionTypes } from "@common/game/enums";
import { anonymizeId } from "@server/api/anonymization";
import { getCardDefinition } from "@server/game/cards/registry";
import { msg } from "@server/text/messages";
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

/**
 * Simple switch to get the message corresponding to the given action type.
 */
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

/**
 * Generate a message that explains the current activity.
 */
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
      if (!action) {
        throw new Error(`No action in game data with id ${actionId}`);
      }
      const playerTakingActionId = gameData.activity.playerTakingActionId;
      const playerTakingAction = gameData.players.find(
        (p) => p.id === playerTakingActionId,
      );
      const cardDef = getCardDefinition(action.card.name);
      return msg("activity.takingAction.explanation", {
        currentPlayerName: playerTakingAction?.name ?? "",
        choosingPlayerName: choosingPlayerName ?? "",
        cardName: cardDef.display ?? { key: action.card.name },
        actionType: actionTypeMessage(action.type),
      });
    }
    default: {
      return { key: "" };
    }
  }
}

/**
 * Use to create a message for a literal value.
 *
 * This only works if:
 * - no locale or icon bundle uses a key containing `{}` characters
 * - the consumer prioritizes
 *
 * Assumes that the message `params` take precedence over locale or icon bundle.
 */
function messageLiteral(value: string): Message {
  return {
    key: "{value}",
    params: { value },
  };
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
}: {
  gameData: GameData;
  anonymizationSalt: string;
  /* The id of the player requesting the data. Undefined for a spectator. */
  playerId?: Id;
  locale?: string;
}): GameDigest {
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
  const annotationMap: Record<Id, Message[]> = {};
  if (observingPlayerIsChoosing) {
    gameData.annotations.forEach(({ id, message }) => {
      const match = annotationMap[id];
      if (match) match.push(message);
      else annotationMap[id] = [message];
    });
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to create digests for any visible card.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
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
      if (matchDef && matchData) {
        const actionMessage = actionTypeMessage(matchData.type);
        actions.push({
          id: matchData.id,
          type,
          // If no instructions, just serve the action type.
          instructions: matchDef.instructions
            ? msg("label.action.instructions", {
                actionType: actionMessage,
                instructions: matchDef.instructions ?? "",
              })
            : actionMessage,
          annotations: annotationMap[matchData.id] ?? [],
        });
      }
    }

    const imageSourceLink = cardDef.links?.find((l) => l.type === "imgsrc");

    return {
      id: cardData.id,
      name: cardData.name,
      display: cardDef.display ?? { key: cardData.name },
      triggerInstructions: cardDef.trigger?.instructions ?? null,
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
   * Use to create digests for face-up cards in play.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  function cardInPlayDigest(cardData: CardData): InPlayCardDigest {
    return {
      ...visibleCardDigest(cardData),
      exhausted:
        cardData.location.type === "inPlay" && cardData.location.exhausted,
    };
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to find the last card(s) discarded by the given player, as these cards
   * should be shown face-up.
   *
   * Since multiple cards can be discarded simultaneously, all cards that
   * arrived in the discard location on the same tick will be face-up.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  function getLatestDiscards(
    cards: CardData[],
    playerId: Id,
  ): VisibleCardDigest[] {
    // Filter and order such cards that have been in their location longer
    // appear later.
    const ordered = cards
      .filter((c) => c.ownerId === playerId && c.location.type === "inDiscard")
      .sort((a, b) => b.lastMovedOnTick - a.lastMovedOnTick);
    let latestDiscardTick = null;
    const out: VisibleCardDigest[] = [];
    for (const card of ordered) {
      if (latestDiscardTick === null) latestDiscardTick = card.lastMovedOnTick;
      else if (card.lastMovedOnTick < latestDiscardTick) break;
      out.push(visibleCardDigest(card));
    }
    return out;
  }

  // Cards should be ordered based on how long they have been at their current
  // location, with cards that have been in their location the longest first.
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
          label: labels?.[v] ?? null,
        })),
      );
      break;
    }
    case "cardId": {
      choiceValuesDigest.push(
        ...choiceValues.map((v) => {
          const card = allCards.find((c) => c.id === v);
          if (!card) {
            throw new Error(`No card in game data with id ${v}`);
          }
          const cardDef = getCardDefinition(card.name);
          const label = cardDef.display ?? messageLiteral(card.name);
          return { value: v, onCardId: null, label };
        }),
      );
      break;
    }
    case "playerId": {
      choiceValuesDigest.push(
        ...choiceValues.map((playerId) => {
          const player = gameData.players.find((p) => p.id === playerId);
          const label = messageLiteral(player?.name ?? playerId);
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
          const cardDef = getCardDefinition(a.card.name);
          const label = msg("label.action.choice", {
            actionType: actionTypeMessage(a.type),
            cardName: cardDef.display ?? a.card.name,
          });
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
          choiceValuesDigest.push({
            value: c.id,
            onCardId,
            label: messageLiteral("Chip"),
          });
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
      explanation: createActivityExplanation(gameData),
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
        instructions: gameData.activity.currentChoice.instructions,
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
        cardsInDiscard: allCards
          .filter(
            (c) =>
              c.ownerId === playerData.id && c.location.type === "inDiscard",
          )
          .map((c) => ({
            id: c.id,
          })),
        cardsInDiscardVisible: getLatestDiscards(allCards, playerData.id),
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
      cardsInDiscard: allCards
        .filter(
          (c) =>
            c.ownerId === observingPlayerData.id &&
            c.location.type === "inDiscard",
        )
        .map((c) => ({ id: c.id })),
      cardsInDiscardVisible: getLatestDiscards(
        allCards,
        observingPlayerData.id,
      ),
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
