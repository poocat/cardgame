import {
	ActionData,
	CardData,
	ChipData,
	GameData,
	Id,
	PlayerData,
} from "@common/types";

type DeepReadonly<T> = T extends (infer R)[]
	? DeepReadonlyArray<R>
	: T extends Function
		? T
		: T extends object
			? DeepReadonlyObject<T>
			: T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

type DeepReadonlyObject<T> = {
	readonly [P in keyof T]: DeepReadonly<T[P]>;
};

/******************************************************************************
 * ### GameState
 *
 * The game state is a read-only version of the given game data, which does not
 * include the current activity.
 *
 * Includes a number of concise "getter" methods ease the definition of rules
 * and cards.
 ******************************************************************************/
export class GameState {
	private gameData: DeepReadonly<GameData>;
	public cards: DeepReadonly<CardData[]>;
	public players: DeepReadonly<PlayerData[]>;
	public chips: DeepReadonly<ChipData[]>;
	public actions: DeepReadonly<ActionData[]>;

	constructor(gameData: GameData) {
		this.gameData = gameData;
		this.cards = this.gameData.cards;
		this.players = this.gameData.players;
		this.chips = this.gameData.chips;
		this.actions = this.gameData.actions;
	}

	getPlayerTakingTurn(): DeepReadonly<PlayerData> {
		const matches = this.gameData.players.filter(
			(p) => p.id === this.gameData.playerTakingTurnId,
		);
		if (matches.length === 1) {
			return matches[0];
		} else {
			throw new Error(`Expected 1 player taking turn, found ${matches.length}`);
		}
	}

	getActionById(args: { actionId: Id }): DeepReadonly<ActionData> {
		const match = this.gameData.actions.find((a) => a.id === args.actionId);
		if (!match) {
			throw new Error(`Action '${args.actionId}' not in game.`);
		}
		return match;
	}

	getCardById(args: { cardId: Id }): DeepReadonly<CardData> {
		const match = this.gameData.cards.find((card) => card.id === args.cardId);
		if (!match) {
			throw new Error(`Card ${args.cardId} not in game.`);
		}
		return match;
	}

	getAllCardsInPlay(): DeepReadonly<CardData[]> {
		return this.gameData.cards.filter((c) => c.location.type === "inPlay");
	}

	getPlayerCardsInHand(args: { playerId: Id }): DeepReadonly<CardData>[] {
		return this.gameData.cards.filter(
			(card) =>
				card.ownerId === args.playerId && card.location.type === "inHand",
		);
	}

	getPlayerCardsInPlay(args: { playerId: Id }): DeepReadonly<CardData>[] {
		return this.gameData.cards.filter(
			(card) =>
				card.ownerId === args.playerId && card.location.type === "inPlay",
		);
	}

	getPlayerCardsInDeck(args: { playerId: Id }): DeepReadonly<CardData>[] {
		return this.gameData.cards.filter(
			(card) =>
				card.ownerId === args.playerId && card.location.type === "inDeck",
		);
	}

	getPlayerChipsInReserve(args: { playerId: Id }): DeepReadonly<ChipData[]> {
		return this.gameData.chips.filter(
			(c) => c.ownerId === args.playerId && c.location.type === "inReserve",
		);
	}

	getChipsOnCard(args: { cardId: Id }): DeepReadonly<ChipData>[] {
		return this.gameData.chips.filter(
			(chip) =>
				chip.location.type === "onCard" && chip.location.cardId === args.cardId,
		);
	}
}
