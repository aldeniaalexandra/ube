import { describe, expect, it } from "vitest";
import { FrameBuffer } from "../../src/render/framebuffer.js";
import { Palette } from "../../src/render/palette.js";
import {
  drawText,
  drawTextWithShadow,
  measureText,
} from "../../src/render/font.js";

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

  it("draws a space as a blank gap instead of a question mark", () => {
    const frame = new FrameBuffer(40, 8, 0);
    const palette = new Palette("#0D1117");
    const color = palette.index("#FFFFFF");

    drawText(frame, palette, "A B", 0, 0, color, 1);

    const painted = [...frame.pixels].filter((pixel) => pixel === color).length;
    expect(painted).toBe(20);
    expect(measureText("A B", 1)).toBe(11);
  });
});

describe("measureText", () => {
  it("rejects invalid scales", () => {
    expect(() => measureText("YEAR", 0)).toThrow(RangeError);
    expect(() => measureText("YEAR", 1.5)).toThrow(RangeError);
  });

  it("returns the pixel width of a string at a given scale", () => {
    expect(measureText("YEAR", 1)).toBe(15);
    expect(measureText("YEAR", 2)).toBe(30);
    expect(measureText("9999 DAYS", 2)).toBe(70);
  });
});

describe("drawTextWithShadow", () => {
  it("draws a dark offset shadow behind the text", () => {
    const frame = new FrameBuffer(40, 8, 0);
    const palette = new Palette("#0D1117");
    const color = palette.index("#FFFFFF");
    const shadow = palette.index("#000000");

    drawTextWithShadow(frame, palette, "I", 1, 1, color, shadow, 1);

    const pixels = [...frame.pixels];
    expect(pixels.filter((pixel) => pixel === color).length).toBe(9);
    expect(pixels.filter((pixel) => pixel === shadow).length).toBeGreaterThan(0);
  });
});
