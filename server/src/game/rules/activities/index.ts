/**
 * An activity is a sequence of choices that are made to affect the game state.
 *
 * Some are configured as "scripted" parts of the game (e.g. drawing cards at
 * the beginning of a player's turn).
 *
 * Most, however, are configured from the cards themselves.
 */
export { activityTypeContinuedActivity } from "./activityTypeContinuedActivity";
export { activityTypeEffects } from "./activityTypeEffects";
export { activityTypeNextActivity } from "./activityTypeNextActivity";
export { activityTypeTriggeredEffects } from "./activityTypeTriggeredEffects";