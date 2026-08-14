import { FrameBuffer } from "./framebuffer.js";
import { Palette } from "./palette.js";

const GLYPH_WIDTH = 3;
const GLYPH_HEIGHT = 5;
const GLYPH_GAP = 1;

const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["110", "001", "010", "100", "111"],
  "3": ["110", "001", "010", "001", "110"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "110", "001", "110"],
  "6": ["011", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "110"],
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["011", "100", "101", "101", "011"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "010"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["10001", "11011", "10101", "10101", "10101"],
  N: ["1001", "1101", "1011", "1001", "1001"],
  O: ["010", "101", "101", "101", "010"],
  P: ["110", "101", "110", "100", "100"],
  Q: ["010", "101", "101", "011", "001"],
  R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
  W: ["10101", "10101", "10101", "11011", "10001"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  ":": ["000", "010", "000", "010", "000"],
  ".": ["000", "000", "000", "000", "010"],
  "-": ["000", "000", "111", "000", "000"],
  "/": ["001", "001", "010", "100", "100"],
  "'": ["010", "010", "000", "000", "000"],
  " ": ["000", "000", "000", "000", "000"],
  "?": ["110", "001", "010", "000", "010"],
};

export function drawText(
  buffer: FrameBuffer,
  palette: Palette,
  text: string,
  x: number,
  y: number,
  paletteIndex: number,
  scale: number,
): number {
  if (!Number.isInteger(scale) || scale < 1) {
    throw new RangeError("text scale must be a positive integer");
  }
  void palette;

  let cursorX = x;
  for (const character of text.toUpperCase()) {
    const glyph = GLYPHS[character] ?? GLYPHS["?"] as readonly string[];
    const glyphWidth = glyph[0]?.length ?? GLYPH_WIDTH;
    for (let row = 0; row < glyph.length; row += 1) {
      const pattern = glyph[row] as string;
      for (let column = 0; column < pattern.length; column += 1) {
        if (pattern[column] !== "1") continue;
        buffer.fillRect(
          cursorX + column * scale,
          y + row * scale,
          scale,
          scale,
          paletteIndex,
        );
      }
    }
    cursorX += (glyphWidth + GLYPH_GAP) * scale;
  }
  return Math.max(0, cursorX - x - GLYPH_GAP * scale);
}

export function measureText(text: string, scale: number): number {
  if (!Number.isInteger(scale) || scale < 1) {
    throw new RangeError("text scale must be a positive integer");
  }
  let width = 0;
  for (const character of text.toUpperCase()) {
    const glyph = GLYPHS[character] ?? GLYPHS["?"] as readonly string[];
    const glyphWidth = glyph[0]?.length ?? GLYPH_WIDTH;
    width += (glyphWidth + GLYPH_GAP) * scale;
  }
  return Math.max(0, width - GLYPH_GAP * scale);
}

export function drawTextWithShadow(
  buffer: FrameBuffer,
  palette: Palette,
  text: string,
  x: number,
  y: number,
  color: number,
  shadowColor: number,
  scale: number,
): number {
  drawText(buffer, palette, text, x + 1, y + 1, shadowColor, scale);
  return drawText(buffer, palette, text, x, y, color, scale);
}

export const FONT_HEIGHT = GLYPH_HEIGHT;
