declare module "gifenc" {
  export interface GifWriteOptions {
    palette?: number[][];
    delay?: number;
    repeat?: number;
    dispose?: number;
  }

  export interface GifEncoder {
    writeFrame(
      pixels: Uint8Array,
      width: number,
      height: number,
      options?: GifWriteOptions,
    ): void;
    finish(): void;
    bytes(): Uint8Array;
  }

  export function GIFEncoder(options?: {
    initialCapacity?: number;
    auto?: boolean;
  }): GifEncoder;
}
