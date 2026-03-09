import type { IAnnotator } from "@server/game/types";
import type { AnnotationData, Id } from "@server/types";

/******************************************************************************
 * ### Annotator
 *
 * A simple interface for logging "annotations" to entities in the game, i.e.
 * reasons why the current player cannot take a given action.
 ******************************************************************************/
export class Annotator implements IAnnotator {
  public annotations: AnnotationData[] = [];

  add(args: { id: Id; messages: string[] }) {
    this.annotations.push(
      ...args.messages.map((m) => ({ id: args.id, message: m })),
    );
  }
}
