/**
 * ## Transitions
 *
 * All rules that manage state transitions between activities.
 */
export { activityTypeNextActivity } from "./activityTransitions";
export { activityTypeContinuedActivity } from "./activityContinuation";
export {
  createChoosingActionChoice,
  createDrawingCardsChoice,
  createTakingActionChoices,
} from "./choices";
