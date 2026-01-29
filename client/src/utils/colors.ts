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
