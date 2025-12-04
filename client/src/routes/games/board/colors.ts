type Rgb = { r: number; g: number; b: number };

export class Color {
  private rgb: Rgb;

  private lim(rgb: Rgb): Rgb {
    const { r, g, b } = rgb;
    return {
      r: Math.min(r, 255),
      g: Math.min(g, 255),
      b: Math.min(b, 255),
    };
  }

  private rgba(rgb: Rgb, a: number): string {
    const { r, g, b } = rgb;
    return `rgba(${r}, ${g}, ${b}, ${Math.min(a, 1)})`;
  }

  constructor(args: { r: number; g: number; b: number }) {
    this.rgb = this.lim(args);
  }

  alpha(a: number): string {
    return this.rgba(this.rgb, a);
  }

  scale(s: number): string {
    const scale = Math.max(0, Math.min(s, 1));
    const { r, g, b } = this.rgb;
    const rgb = { r: r * scale, g: g * scale, b: b * scale };
    return this.rgba(rgb, 1);
  }
}

export const colors = {
  board: new Color({ r: 235, g: 220, b: 200 }),
  cards: new Color({ r: 0, g: 200, b: 200 }),
  actions: new Color({ r: 100, g: 100, b: 200 }),
  chips: new Color({ r: 250, g: 125, b: 150 }),
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
