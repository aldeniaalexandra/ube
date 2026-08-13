import { describe, expect, it } from "vitest";
import { FrameBuffer } from "../../src/render/framebuffer.js";
import { Palette } from "../../src/render/palette.js";
import { drawText } from "../../src/render/font.js";

describe("drawText", () => {
  it("draws uppercase text and returns its pixel width", () => {
    const frame = new FrameBuffer(40, 8, 0);
    const palette = new Palette("#0D1117");
    const color = palette.index("#FFFFFF");

    const width = drawText(frame, palette, "12 DAYS", 1, 1, color, 1);

    expect(width).toBeGreaterThan(20);
    expect([...frame.pixels].filter((pixel) => pixel === color).length).toBeGreaterThan(20);
  });

  it("clips text at the canvas edge", () => {
    const frame = new FrameBuffer(4, 6, 0);
    const palette = new Palette("#0D1117");

    expect(() => drawText(frame, palette, "YEAR", -3, 0, 1, 1)).not.toThrow();
  });
});
