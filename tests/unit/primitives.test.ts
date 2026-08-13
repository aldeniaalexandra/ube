import { describe, expect, it } from "vitest";
import type { CharacterPack } from "../../src/character/types.js";
import { FrameBuffer } from "../../src/render/framebuffer.js";
import { Palette } from "../../src/render/palette.js";
import { drawSprite } from "../../src/render/primitives.js";

const pack: CharacterPack = {
  version: 1,
  name: "Test",
  cellSize: 2,
  anchor: { x: 1, y: 1 },
  palette: { P: "#8A63E8" },
  frames: {
    idle: [" P", "PP"],
    blink: [" P", "PP"],
    walk: [
      [" P", "PP"],
      [" P", "PP"],
      [" P", "PP"],
      [" P", "PP"],
    ],
  },
};

describe("drawSprite", () => {
  it("keeps transparent cells empty and aligns the anchor to the baseline", () => {
    const frame = new FrameBuffer(6, 5, 0);
    const palette = new Palette("#0D1117");
    const purple = palette.index("#8A63E8");

    drawSprite(frame, palette, pack.frames.idle, pack, 2, 4);

    expect(frame.getPixel(0, 0)).toBe(0);
    expect(frame.getPixel(2, 0)).toBe(purple);
    expect(frame.getPixel(0, 2)).toBe(purple);
    expect(frame.getPixel(3, 3)).toBe(purple);
    expect(frame.getPixel(2, 4)).toBe(0);
  });
});
