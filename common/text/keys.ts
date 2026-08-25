/**
 * The message keys below comprise the minimum necessary set for the client
 * app to display the appropriate messages.
 */
export const messageKeys = [
  // The title of the game:
  "title",
  // Game logo:
  "logo",
  // Themable terms:
  "deck.producers",
  "deck.consumers",
  "action.type.play",
  "action.type.ability",
  "action.type.discard",
  "card.type.consumer",
  "card.type.producer",
  "card.group.producers",
  "card.group.consumers",
  "card.group.hand",
  "card.state.exhausted",
  "card.state.unexhausted",
  "card.group.discard",
  "chip.group.reserve",
  "chip.group.channel",
  // Use to generate instructions for non-action activities:
  "activity.drawingCards.choice.instructions",
  "activity.drawingCards.explanation",
  "activity.choosingAction.choice.instructions",
  "activity.choosingAction.explanation",
  "activity.takingAction.explanation",
  // Use to generate a label for a choice of a given action type for a given card:
  "label.action.choice",
  // Annotations:
  "reason.cardAlreadyInPlay",
  "reason.cardNotInGame",
  "reason.cardNotInPlay",
  "reason.cardExhausted",
  "reason.notOwner",
  "reason.maxProducersInPlay",
  "reason.maxConsumersInPlay",
  // Public pages:
  // (Note, meta descriptions cannot contain token placeholders)
  "page.home.title",
  "page.home.meta.description",
  "page.rulebook.title",
  "page.rulebook.meta.description",
  "page.cards.title",
  "page.cards.meta.description",
  "page.about.title",
  "page.about.meta.description",
] as const;
