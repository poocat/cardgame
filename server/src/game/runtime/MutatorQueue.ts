import type { IMutator, MutatorArgs } from "@server/game/types";

type QueueItem = {
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

  addWin(args: MutatorArgs["addWin"]) {
    this.queue.push({ method: "addWin", args });
  }

  apply(mutator: IMutator) {
    this.queue.slice(this.index).forEach((item) => {
      switch (item.method) {
        case "moveCard":
          mutator.moveCard(item.args);
          break;
        case "moveChips":
          mutator.moveChips(item.args);
          break;
        case "exhaustCard":
          mutator.exhaustCard(item.args);
          break;
        case "passTurn":
          mutator.passTurn(item.args);
          break;
        case "setActivity":
          mutator.setActivity(item.args);
          break;
        case "addWin":
          mutator.addWin(item.args);
          break;
        default:
          throw new Error(`Could not apply mutation: ${item}`);
      }
      this.index += 1;
    });
  }
}
