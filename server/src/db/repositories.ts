/**
 * Collection-specific implementations of the "repository" pattern
 */
import { Repository } from "./repository";

export class GameRepository<TData> extends Repository<TData> {}
export class RoomRepository<TData> extends Repository<TData> {
  async findOneByGameId(args: { gameId: string }) {
    const result = await this.collection.findOne({
      "data.gameId": { $eq: args.gameId },
    });
    return result;
  }
}
