/**
 * ## Transitions
 *
 * All rules that manage state transitions between activities.
 */

export { activityTypeContinuedActivity } from "./activityContinuation";
export { activityTypeNextActivity } from "./activityTransitions";
export {
  createChoosingActionChoice,
  createDrawingCardsChoice,
  createTakingActionChoices,
} from "./choices";
