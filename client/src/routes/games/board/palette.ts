import { Color } from "@client/utils/colors";

export const colors = {
  board: new Color({ r: 235, g: 220, b: 200 }),
  cards: new Color({ r: 125, g: 200, b: 200 }),
  actions: new Color({ r: 150, g: 150, b: 200 }),
  chips: new Color({ r: 250, g: 150, b: 175 }),
} as const satisfies Record<string, Color>;

// TODO!!! Use these colors...
const playerColors: Color[] = [
  new Color({ r: 225, g: 125, b: 125 }),
  new Color({ r: 225, g: 175, b: 0 }),
  new Color({ r: 150, g: 175, b: 50 }),
  new Color({ r: 75, g: 175, b: 200 }),
  new Color({ r: 150, g: 150, b: 250 }),
] as const;

export function playerColorMap(playerNames: string[]): Record<string, Color> {
  if (playerNames.length > playerColors.length) {
    throw new Error(`Cannot be more players than colors.`);
  }
  const map: Record<string, Color> = {};
  const sorted = [...playerNames].sort();
  sorted.forEach((playerName, i) => {
    map[playerName] = playerColors[i];
  });
  return map;
}
