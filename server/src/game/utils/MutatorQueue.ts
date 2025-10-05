import { Mutator } from "@server/game/utils";
import { IMutator, MutatorArgs } from "@server/types";

export type QueueItem = {
	[K in keyof MutatorArgs]: { method: K; args: MutatorArgs[K] };
}[keyof MutatorArgs];

/******************************************************************************
 * ### MutatorQueue
 *
 * An implementation of a mutator that only accumulates the mutations into a
 * queue, to perform later.
 ******************************************************************************/
export class MutatorQueue implements IMutator {
	private queue: QueueItem[] = [];
	private index: number = 0;

	moveCard(args: MutatorArgs["moveCard"]) {
		this.queue.push({ method: "moveCard", args });
	}

	moveChips(args: MutatorArgs["moveChips"]) {
		this.queue.push({ method: "moveChips", args });
	}

	exhaustCard(args: MutatorArgs["exhaustCard"]) {
		this.queue.push({ method: "exhaustCard", args });
	}

	passTurn(args: MutatorArgs["passTurn"]) {
		this.queue.push({ method: "passTurn", args });
	}

	setActivity(args: MutatorArgs["setActivity"]) {
		this.queue.push({ method: "setActivity", args });
	}

	apply(mutator: Mutator) {
		this.queue.slice(this.index).forEach((item) => {
			console.log(`mutation: ${JSON.stringify(item)}`);
			mutator[item.method](item.args as any);
			this.index += 1;
		});
	}
}
