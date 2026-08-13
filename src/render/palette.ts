const HEX_COLOR_PATTERN = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const MAX_COLORS = 256;

export class Palette {
  private readonly colors: number[][] = [];
  private readonly indices = new Map<string, number>();

  public constructor(background: string) {
    this.index(background);
  }

  public index(hex: string): number {
    const normalized = normalizeHex(hex);
    const existing = this.indices.get(normalized);
    if (existing !== undefined) return existing;
    if (this.colors.length >= MAX_COLORS) {
      throw new RangeError("palette cannot contain more than 256 colors");
    }

    const index = this.colors.length;
    this.indices.set(normalized, index);
    this.colors.push(parseHex(normalized));
    return index;
  }

  public toRgb(): number[][] {
    return this.colors.map((color) => [...color]);
  }
}

function normalizeHex(value: string): string {
  if (!HEX_COLOR_PATTERN.test(value)) {
    throw new Error(`invalid six-digit hex color '${value}'`);
  }
  return value.toUpperCase();
}

function parseHex(value: string): number[] {
  const match = HEX_COLOR_PATTERN.exec(value);
  if (match === null) {
    throw new Error(`invalid six-digit hex color '${value}'`);
  }
  const red = Number.parseInt(match[1] as string, 16);
  const green = Number.parseInt(match[2] as string, 16);
  const blue = Number.parseInt(match[3] as string, 16);
  return [red, green, blue];
}
