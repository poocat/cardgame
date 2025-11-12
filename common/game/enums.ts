export const actionTypes = ["play", "ability", "discard"] as const;
export const chipLocationTypes = ["inReserve", "onCard"] as const;
export const cardLocationTypes = [
  "inDeck",
  "inHand",
  "inPlay",
  "inDiscard",
] as const;
export const cardTypes = ["producer", "consumer"] as const;
export const choiceTypes = [
  "arbitrary",
  "actionId",
  "cardId",
  "chipId",
  "playerId",
] as const;
export const activityTypes = [
  "drawingCards",
  "choosingAction",
  "takingAction",
] as const;
