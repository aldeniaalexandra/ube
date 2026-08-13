import { sampleTimeline } from "../animation/timeline.js";
import type { CharacterPack, SpriteFrame } from "../character/types.js";
import type { ResolvedConfig } from "../config/schema.js";
import type { ContributionCalendar, ContributionLevel } from "../contributions/types.js";
import { FrameBuffer } from "./framebuffer.js";
import { Palette } from "./palette.js";
import { drawSprite } from "./primitives.js";

const GRID_COLUMNS = 53;
const GRID_ROWS = 7;
const GRID_CELL_SIZE = 10;
const GRID_CELL_GAP = 5;
const GRID_MINIMUM_GAP = 1;
const GRID_BOTTOM_MARGIN = 18;
const CHARACTER_GRAPH_GAP = 8;
const CHARACTER_STRIDE_CELLS = 3;

export interface SceneLayout {
  gridLeft: number;
  gridTop: number;
  cellSize: number;
  cellGap: number;
  columns: number;
  rows: number;
  baselineY: number;
}

export interface IndexedFrame {
  width: number;
  height: number;
  pixels: Uint8Array;
  palette: number[][];
}

export interface Scene {
  readonly layout: SceneLayout;
  render(calendar: ContributionCalendar, frameIndex: number): IndexedFrame;
}

export function createScene(
  config: ResolvedConfig,
  character: CharacterPack,
): Scene {
  const layout = createLayout(config.output.width, config.output.height);
  const palette = createPalette(config, character);
  const frameCount = Math.round(
    config.output.fps * config.output.durationSeconds,
  );
  const characterWidth = character.frames.idle[0]?.length ?? 0;
  const scaledCharacterWidth = characterWidth * character.cellSize;
  const gridStep = layout.cellSize + layout.cellGap;

  return Object.freeze({
    layout,
    render(calendar: ContributionCalendar, frameIndex: number): IndexedFrame {
      validateCalendar(calendar);
      const sample = sampleTimeline(frameIndex, {
        frameCount,
        canvasWidth: config.output.width,
        characterWidth: scaledCharacterWidth,
        stridePixels: character.cellSize * CHARACTER_STRIDE_CELLS,
        gridLeft: layout.gridLeft,
        gridCellStep: gridStep,
        gridColumns: layout.columns,
      });
      const buffer = new FrameBuffer(
        config.output.width,
        config.output.height,
        0,
      );

      drawBackground(buffer, palette, config);
      drawBaseline(buffer, palette, config, layout);
      drawCalendar(buffer, palette, config, layout, calendar, sample.wakeColumn);
      drawCharacter(
        buffer,
        palette,
        character,
        chooseFrame(character, sample.pose, sample.blink),
        sample.x,
        layout.baselineY + sample.bob,
      );

      return {
        width: buffer.width,
        height: buffer.height,
        pixels: buffer.pixels,
        palette: palette.toRgb(),
      };
    },
  });
}

function createLayout(width: number, height: number): SceneLayout {
  const { cellSize, cellGap } = fitGridToWidth(width);
  const gridWidth =
    GRID_COLUMNS * cellSize + (GRID_COLUMNS - 1) * cellGap;
  const gridHeight =
    GRID_ROWS * cellSize + (GRID_ROWS - 1) * cellGap;
  const gridLeft = Math.floor((width - gridWidth) / 2);
  const gridTop = height - GRID_BOTTOM_MARGIN - gridHeight;
  if (gridLeft < 0 || gridTop < 0) {
    throw new RangeError("canvas is too small for the contribution scene");
  }

  return Object.freeze({
    gridLeft,
    gridTop,
    cellSize,
    cellGap,
    columns: GRID_COLUMNS,
    rows: GRID_ROWS,
    baselineY: gridTop - CHARACTER_GRAPH_GAP,
  });
}

function fitGridToWidth(width: number): { cellSize: number; cellGap: number } {
  for (let cellSize = GRID_CELL_SIZE; cellSize >= 1; cellSize -= 1) {
    const availableGap = Math.floor(
      (width - GRID_COLUMNS * cellSize) / (GRID_COLUMNS - 1),
    );
    if (availableGap >= GRID_MINIMUM_GAP) {
      return {
        cellSize,
        cellGap: Math.min(GRID_CELL_GAP, availableGap),
      };
    }
  }
  throw new RangeError("canvas is too narrow for the contribution scene");
}

function createPalette(
  config: ResolvedConfig,
  character: CharacterPack,
): Palette {
  const palette = new Palette(config.theme.background);
  palette.index(mixHex(config.theme.background, config.theme.accent, 0.08));
  palette.index(mixHex(config.theme.background, config.theme.accent, 0.04));
  palette.index(config.theme.gridEmpty);
  for (const color of config.theme.gridLevels) palette.index(color);
  palette.index(mixHex(config.theme.gridEmpty, config.theme.accent, 0.35));
  for (const color of Object.values(character.palette)) palette.index(color);
  return palette;
}

function drawBackground(
  buffer: FrameBuffer,
  palette: Palette,
  config: ResolvedConfig,
): void {
  const topColor = palette.index(
    mixHex(config.theme.background, config.theme.accent, 0.08),
  );
  const middleColor = palette.index(
    mixHex(config.theme.background, config.theme.accent, 0.04),
  );
  const topHeight = Math.floor(buffer.height * 0.3);
  const middleHeight = Math.floor(buffer.height * 0.25);
  buffer.fillRect(0, 0, buffer.width, topHeight, topColor);
  buffer.fillRect(0, topHeight, buffer.width, middleHeight, middleColor);
}

function drawBaseline(
  buffer: FrameBuffer,
  palette: Palette,
  config: ResolvedConfig,
  layout: SceneLayout,
): void {
  const width =
    layout.columns * layout.cellSize +
    (layout.columns - 1) * layout.cellGap;
  const color = palette.index(
    mixHex(config.theme.gridEmpty, config.theme.accent, 0.35),
  );
  buffer.fillRect(layout.gridLeft, layout.baselineY, width, 1, color);
}

function drawCalendar(
  buffer: FrameBuffer,
  palette: Palette,
  config: ResolvedConfig,
  layout: SceneLayout,
  calendar: ContributionCalendar,
  wakeColumn: number,
): void {
  const step = layout.cellSize + layout.cellGap;
  for (let column = 0; column < layout.columns; column += 1) {
    const week = calendar.weeks[column];
    if (week === undefined) {
      throw new Error(`calendar is missing week ${column}`);
    }
    for (let row = 0; row < layout.rows; row += 1) {
      const day = week[row];
      if (day === undefined) {
        throw new Error(`calendar week ${column} is missing day ${row}`);
      }
      const level = column === wakeColumn ? brightenLevel(day.level) : day.level;
      const color = contributionColor(config, level);
      buffer.fillRect(
        layout.gridLeft + column * step,
        layout.gridTop + row * step,
        layout.cellSize,
        layout.cellSize,
        palette.index(color),
      );
    }
  }
}

function drawCharacter(
  buffer: FrameBuffer,
  palette: Palette,
  character: CharacterPack,
  frame: SpriteFrame,
  leftX: number,
  baselineY: number,
): void {
  const anchorX = leftX + character.anchor.x * character.cellSize;
  drawSprite(buffer, palette, frame, character, anchorX, baselineY);
}

function chooseFrame(
  character: CharacterPack,
  pose: 0 | 1 | 2 | 3,
  blink: boolean,
): SpriteFrame {
  if (blink) return character.frames.blink;
  return character.frames.walk[pose];
}

function contributionColor(
  config: ResolvedConfig,
  level: ContributionLevel,
): string {
  if (level === 0) return config.theme.gridEmpty;
  const color = config.theme.gridLevels[level - 1];
  if (color === undefined) {
    throw new Error(`theme is missing contribution level ${level}`);
  }
  return color;
}

function brightenLevel(level: ContributionLevel): ContributionLevel {
  return Math.min(4, level + 1) as ContributionLevel;
}

function validateCalendar(calendar: ContributionCalendar): void {
  if (calendar.weeks.length !== GRID_COLUMNS) {
    throw new Error(`calendar must contain exactly ${GRID_COLUMNS} weeks`);
  }
  if (!calendar.weeks.every((week) => week.length === GRID_ROWS)) {
    throw new Error(`each calendar week must contain exactly ${GRID_ROWS} days`);
  }
}

function mixHex(base: string, accent: string, ratio: number): string {
  const baseRgb = parseHex(base);
  const accentRgb = parseHex(accent);
  const mixed = baseRgb.map((channel, index) =>
    Math.round(channel + ((accentRgb[index] as number) - channel) * ratio),
  );
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function parseHex(value: string): [number, number, number] {
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ];
}
