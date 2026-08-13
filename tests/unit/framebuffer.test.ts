import { describe, expect, it } from "vitest";
import { FrameBuffer } from "../../src/render/framebuffer.js";
import { Palette } from "../../src/render/palette.js";

describe("FrameBuffer", () => {
  it("clips rectangles at the canvas boundary", () => {
    const frame = new FrameBuffer(4, 3, 0);

    frame.fillRect(-1, 1, 3, 3, 2);

    expect([...frame.pixels]).toEqual([
      0, 0, 0, 0,
      2, 2, 0, 0,
      2, 2, 0, 0,
    ]);
  });

  it("clears the existing allocation", () => {
    const frame = new FrameBuffer(2, 2, 1);
    const pixels = frame.pixels;

    frame.clear(3);

    expect(frame.pixels).toBe(pixels);
    expect([...frame.pixels]).toEqual([3, 3, 3, 3]);
  });
});

describe("Palette", () => {
  it("deduplicates colors regardless of hex casing", () => {
    const palette = new Palette("#0d1117");

    expect(palette.index("#8a63e8")).toBe(palette.index("#8A63E8"));
    expect(palette.toRgb()).toEqual([
      [13, 17, 23],
      [138, 99, 232],
    ]);
  });
});
