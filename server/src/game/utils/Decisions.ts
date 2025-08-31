import { ChoiceValue, Decision } from "@common/types";

/******************************************************************************
 * ### Decisions
 *
 * Use as a convenient way of getting decisions values by their associated
 * choice name.
 ******************************************************************************/
export class Decisions {
	private decisions: Decision[];

	constructor(choicesMade: Decision[]) {
		this.decisions = choicesMade;
	}

	get(name: string): ChoiceValue[] {
		const values: ChoiceValue[] = [];
		this.decisions
			.filter((c) => c.name === name)
			.forEach((c) => values.push(...c.values));
		return values;
	}
}
