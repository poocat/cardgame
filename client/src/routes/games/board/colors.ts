type Rgb = { r: number; g: number; b: number };

export class Color {
  private rgb: Rgb;

  constructor(args: { r: number; g: number; b: number }) {
    const { r, g, b } = args;
    const lim = (value: number) => Math.min(value, 255);
    this.rgb = { r: lim(r), g: lim(g), b: lim(b) };
  }

  alpha(a: number): string {
    const { r, g, b } = this.rgb;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
}

export const colors = {
  cards: new Color({ r: 0, g: 200, b: 200 }),
  actions: new Color({ r: 0, g: 0, b: 200 }),
  chips: new Color({ r: 200, g: 0, b: 0 }),
} as const satisfies Record<string, Color>;

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
