import { ActionType } from "@common/types";
import { CARDS } from "@server/game/cards/definitions";
import { ActionDef, CardDef } from "@server/types";

const cardMap = Object.fromEntries(CARDS.map((c) => [c.name, c]));

/******************************************************************************
 * Finds the card definition matching the given name, or throws an error.
 ******************************************************************************/
export function getCardDefinition(name: string): CardDef {
	const match = cardMap[name];
	if (!match) {
		throw new Error(`No card found with name ${name}`);
	}
	return match;
}

/******************************************************************************
 * Gets the action definition of the given type for the given card name, or
 * throws an error.
 ******************************************************************************/
export function getActionDefinition(args: {
	cardName: string;
	actionType: ActionType;
}): ActionDef {
	const match = getCardDefinition(args.cardName).actions[args.actionType];
	if (!match) {
		throw new Error(`No ${args.actionType} action on card ${args.cardName}`);
	}
	return match;
}
