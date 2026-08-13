const MAX_PALETTE_INDEX = 255;

export class FrameBuffer {
  public readonly pixels: Uint8Array;

  public constructor(
    public readonly width: number,
    public readonly height: number,
    fillIndex = 0,
  ) {
    requirePositiveInteger(width, "width");
    requirePositiveInteger(height, "height");
    requirePaletteIndex(fillIndex);
    this.pixels = new Uint8Array(width * height);
    this.pixels.fill(fillIndex);
  }

  public clear(paletteIndex: number): void {
    requirePaletteIndex(paletteIndex);
    this.pixels.fill(paletteIndex);
  }

  public setPixel(x: number, y: number, paletteIndex: number): void {
    requirePaletteIndex(paletteIndex);
    if (!this.isInside(x, y)) return;
    this.pixels[y * this.width + x] = paletteIndex;
  }

  public getPixel(x: number, y: number): number {
    if (!this.isInside(x, y)) {
      throw new RangeError(`pixel (${x}, ${y}) is outside ${this.width}x${this.height}`);
    }
    return this.pixels[y * this.width + x] as number;
  }

  public fillRect(
    x: number,
    y: number,
    width: number,
    height: number,
    paletteIndex: number,
  ): void {
    requireInteger(x, "x");
    requireInteger(y, "y");
    requireNonNegativeInteger(width, "width");
    requireNonNegativeInteger(height, "height");
    requirePaletteIndex(paletteIndex);

    const startX = Math.max(0, x);
    const endX = Math.min(this.width, x + width);
    const startY = Math.max(0, y);
    const endY = Math.min(this.height, y + height);
    if (startX >= endX || startY >= endY) return;

    for (let row = startY; row < endY; row += 1) {
      const rowOffset = row * this.width;
      this.pixels.fill(paletteIndex, rowOffset + startX, rowOffset + endX);
    }
  }

  private isInside(x: number, y: number): boolean {
    return (
      Number.isInteger(x) &&
      Number.isInteger(y) &&
      x >= 0 &&
      x < this.width &&
      y >= 0 &&
      y < this.height
    );
  }
}

function requirePositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer`);
  }
}

function requireNonNegativeInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer`);
  }
}

function requireInteger(value: number, name: string): void {
  if (!Number.isInteger(value)) {
    throw new RangeError(`${name} must be an integer`);
  }
}

function requirePaletteIndex(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > MAX_PALETTE_INDEX) {
    throw new RangeError("palette index must be an integer between 0 and 255");
  }
}
