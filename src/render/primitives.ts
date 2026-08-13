import type { CharacterPack, SpriteFrame } from "../character/types.js";
import { FrameBuffer } from "./framebuffer.js";
import { Palette } from "./palette.js";

export function drawSprite(
  buffer: FrameBuffer,
  palette: Palette,
  frame: SpriteFrame,
  character: CharacterPack,
  anchorX: number,
  baselineY: number,
): void {
  const cellSize = character.cellSize;
  const originX = anchorX - character.anchor.x * cellSize;
  const originY = baselineY - (character.anchor.y + 1) * cellSize;

  for (const [rowIndex, row] of frame.entries()) {
    for (let column = 0; column < row.length; column += 1) {
      const symbol = row[column] as string;
      if (symbol === " ") continue;
      const color = character.palette[symbol];
      if (color === undefined) {
        throw new Error(`sprite uses undeclared palette symbol '${symbol}'`);
      }
      buffer.fillRect(
        originX + column * cellSize,
        originY + rowIndex * cellSize,
        cellSize,
        cellSize,
        palette.index(color),
      );
    }
  }
}
