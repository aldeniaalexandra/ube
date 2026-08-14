import { sampleTimeline } from "../animation/timeline.js";
import type { CharacterPack, SpriteFrame } from "../character/types.js";
import type { ResolvedConfig } from "../config/schema.js";
import type { ContributionCalendar, ContributionLevel } from "../contributions/types.js";
import { planScene } from "../experience/planner.js";
import type { ScenePlan, Season, Weather } from "../experience/types.js";
import { FrameBuffer } from "./framebuffer.js";
import { drawText, drawTextWithShadow, measureText } from "./font.js";
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
const SIGN_HEIGHT = 54;
const COMPACT_SIGN_HEIGHT = 44;
const COMPACT_CANVAS_WIDTH = 720;
const TOP_MARGIN = 8;
const PATH_CLEARANCE = 8;
const PIXEL_SCALE = 2;
const MOON_CELL_SIZE = 3;
const MOON_MASK = [
  "  1111 ",
  " 111111",
  "1111111",
  "1111111",
  "1111111",
  " 111111",
  "  1111 ",
] as const;
const MOON_CUTOUT = [
  "    111",
  "   1111",
  "   1111",
  "   1111",
  "   1111",
  "    111",
  "     1 ",
] as const;

export interface SceneLayout {
  gridLeft: number;
  gridTop: number;
  cellSize: number;
  cellGap: number;
  columns: number;
  rows: number;
  baselineY: number;
  gridWidth: number;
  sign: Readonly<{
    left: number;
    top: number;
    width: number;
    height: number;
    postHeight: number;
  }>;
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
  const characterWidth = character.frames.idle[0]?.length ?? 0;
  const characterHeight = character.frames.idle.length;
  const scaledCharacterWidth = characterWidth * character.cellSize;
  const scaledCharacterHeight = characterHeight * character.cellSize;
  const layout = createLayout(
    config.output.width,
    config.output.height,
    scaledCharacterHeight,
  );
  const palette = createPalette(config, character);
  const frameCount = Math.round(
    config.output.fps * config.output.durationSeconds,
  );
  const gridStep = layout.cellSize + layout.cellGap;

  return Object.freeze({
    layout,
    render(calendar: ContributionCalendar, frameIndex: number): IndexedFrame {
      validateCalendar(calendar);
      const plan = planScene(calendar, config);
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

      drawBackground(buffer, palette, config, plan, frameIndex, frameCount);
      drawBaseline(buffer, palette, config, layout);
      drawCalendar(buffer, palette, config, layout, calendar, sample.wakeColumn);
      drawGardenProps(buffer, palette, config, layout, plan);
      drawCharacter(
        buffer,
        palette,
        character,
        chooseFrame(character, sample.pose, sample.blink),
        sample.x,
        layout.baselineY + sample.bob,
      );
      drawVignette(buffer, palette, config, layout, plan, sample.x, frameIndex, frameCount);

      return {
        width: buffer.width,
        height: buffer.height,
        pixels: buffer.pixels,
        palette: palette.toRgb(),
      };
    },
  });
}

function createLayout(
  width: number,
  height: number,
  characterHeight: number,
): SceneLayout {
  const isCompact = width < COMPACT_CANVAS_WIDTH;
  const signHeight = isCompact ? COMPACT_SIGN_HEIGHT : SIGN_HEIGHT;
  const minimumBaselineY = TOP_MARGIN + signHeight + characterHeight + PATH_CLEARANCE;
  const maximumGridHeight = height
    - GRID_BOTTOM_MARGIN
    - CHARACTER_GRAPH_GAP
    - minimumBaselineY;
  const { cellSize, cellGap } = fitGridToArea(width, maximumGridHeight);
  const gridWidth =
    GRID_COLUMNS * cellSize + (GRID_COLUMNS - 1) * cellGap;
  const gridHeight =
    GRID_ROWS * cellSize + (GRID_ROWS - 1) * cellGap;
  const gridLeft = Math.floor((width - gridWidth) / 2);
  const gridTop = height - GRID_BOTTOM_MARGIN - gridHeight;
  if (gridLeft < 0 || gridTop < 0) {
    throw new RangeError("canvas is too small for the contribution scene");
  }

  const baselineY = gridTop - CHARACTER_GRAPH_GAP;
  const signWidth = Math.min(
    204,
    Math.max(132, Math.floor(width * (isCompact ? 0.42 : 0.22))),
  );
  const signLeft = gridLeft + gridWidth - signWidth;
  const signTop = baselineY - characterHeight - PATH_CLEARANCE - signHeight;
  const postHeight = characterHeight + PATH_CLEARANCE;

  return Object.freeze({
    gridLeft,
    gridTop,
    cellSize,
    cellGap,
    columns: GRID_COLUMNS,
    rows: GRID_ROWS,
    baselineY,
    gridWidth,
    sign: Object.freeze({
      left: signLeft,
      top: signTop,
      width: signWidth,
      height: signHeight,
      postHeight,
    }),
  });
}

function fitGridToArea(
  width: number,
  height: number,
): { cellSize: number; cellGap: number } {
  for (let cellSize = GRID_CELL_SIZE; cellSize >= 1; cellSize -= 1) {
    const horizontalGap = Math.floor(
      (width - GRID_COLUMNS * cellSize) / (GRID_COLUMNS - 1),
    );
    const verticalGap = Math.floor(
      (height - GRID_ROWS * cellSize) / (GRID_ROWS - 1),
    );
    const availableGap = Math.min(horizontalGap, verticalGap);
    if (availableGap >= GRID_MINIMUM_GAP) {
      return {
        cellSize,
        cellGap: Math.min(GRID_CELL_GAP, availableGap),
      };
    }
  }
  throw new RangeError("canvas is too small for the contribution scene");
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
  for (const color of [
    "#f5dca1",
    "#eee9ff",
    "#87dba8",
    "#8ee9ad",
    "#65b96f",
    "#96e6a5",
    "#684c2e",
    "#8b6840",
    "#5a4027",
    "#d9c79d",
    "#fff3ce",
    "#8da8b5",
    "#496c76",
    "#a7d9df",
    "#273e53",
    "#6f52ca",
    "#c7a0ef",
  ]) palette.index(color);
  for (const color of Object.values(character.palette)) palette.index(color);
  return palette;
}

function drawBackground(
  buffer: FrameBuffer,
  palette: Palette,
  config: ResolvedConfig,
  plan: ScenePlan,
  frameIndex: number,
  frameCount: number,
): void {
  const topColor = palette.index(seasonSkyColor(config.theme.background, plan.season));
  const middleColor = palette.index(
    mixHex(config.theme.background, config.theme.accent, 0.04),
  );
  const topHeight = Math.floor(buffer.height * 0.32);
  const middleHeight = Math.floor(buffer.height * 0.24);
  buffer.fillRect(0, 0, buffer.width, topHeight, topColor);
  buffer.fillRect(0, topHeight, buffer.width, middleHeight, middleColor);

  const moonX = Math.max(26, buffer.width - 90);
  const moonY = 34 + Math.round(Math.sin((frameIndex / frameCount) * Math.PI * 2) * 2);
  const moon = palette.index("#f5dca1");
  const shadow = topColor;
  drawMoon(buffer, moonX, moonY, moon, shadow);

  drawStars(buffer, palette, plan.seed);
  drawWeather(buffer, palette, plan.weather, frameIndex, frameCount);
}

function drawMoon(
  buffer: FrameBuffer,
  left: number,
  top: number,
  moonColor: number,
  shadowColor: number,
): void {
  for (let row = 0; row < MOON_MASK.length; row += 1) {
    const maskRow = MOON_MASK[row] as string;
    for (let column = 0; column < maskRow.length; column += 1) {
      if (maskRow[column] !== "1") continue;
      buffer.fillRect(
        left + column * MOON_CELL_SIZE,
        top + row * MOON_CELL_SIZE,
        MOON_CELL_SIZE,
        MOON_CELL_SIZE,
        moonColor,
      );
    }
  }

  for (let row = 0; row < MOON_CUTOUT.length; row += 1) {
    const cutoutRow = MOON_CUTOUT[row] as string;
    for (let column = 0; column < cutoutRow.length; column += 1) {
      if (cutoutRow[column] !== "1") continue;
      buffer.fillRect(
        left + column * MOON_CELL_SIZE,
        top + row * MOON_CELL_SIZE,
        MOON_CELL_SIZE,
        MOON_CELL_SIZE,
        shadowColor,
      );
    }
  }
}

function drawStars(buffer: FrameBuffer, palette: Palette, seed: number): void {
  const color = palette.index("#8ee9ad");
  const softColor = palette.index("#c7a0ef");
  const stars = [
    [0.08, 0.18], [0.17, 0.29], [0.27, 0.14], [0.39, 0.24],
    [0.52, 0.12], [0.63, 0.27], [0.74, 0.16], [0.86, 0.25],
    [0.93, 0.12],
  ];
  for (const [index, [relativeX, relativeY]] of stars.entries()) {
    const x = Math.floor(buffer.width * (relativeX as number));
    const y = Math.floor(buffer.height * (relativeY as number));
    const paletteIndex = ((seed + index) % 3 === 0) ? softColor : color;
    buffer.fillRect(x, y, 2, 2, paletteIndex);
  }
}

function drawWeather(
  buffer: FrameBuffer,
  palette: Palette,
  weather: Weather,
  frameIndex: number,
  frameCount: number,
): void {
  if (weather === "clear") return;
  const phase = Math.floor((frameIndex / frameCount) * 8);
  if (weather === "clouds") {
    const cloud = palette.index("#273e53");
    for (const x of [0.14, 0.55, 0.78]) {
      const left = Math.floor(buffer.width * x) + ((phase % 2) * 2);
      const top = Math.floor(buffer.height * (0.24 + (x * 0.03)));
      buffer.fillRect(left, top, 32, 5, cloud);
      buffer.fillRect(left + 8, top - 4, 20, 5, cloud);
      buffer.fillRect(left + 15, top - 7, 10, 4, cloud);
    }
    return;
  }

  const mist = palette.index(weather === "mist" ? "#a7d9df" : "#8da8b5");
  const lineCount = weather === "mist" ? 6 : 12;
  for (let index = 0; index < lineCount; index += 1) {
    const x = (index * 83 + phase * 7) % Math.max(1, buffer.width - 4);
    const y = 54 + ((index * 29 + phase * 3) % Math.max(1, Math.floor(buffer.height * 0.35)));
    buffer.fillRect(x, y, weather === "mist" ? 9 : 2, weather === "mist" ? 1 : 8, mist);
  }
}

function drawGardenProps(
  buffer: FrameBuffer,
  palette: Palette,
  config: ResolvedConfig,
  layout: SceneLayout,
  plan: ScenePlan,
): void {
  const groundY = layout.baselineY - 1;
  const plantColor = palette.index(plan.season === "autumn" ? "#d09b67" : "#65b96f");
  const leafColor = palette.index(plan.season === "winter" ? "#8da8b5" : "#96e6a5");
  for (const position of [0.04, 0.18, 0.34, 0.52]) {
    const x = layout.gridLeft + Math.round(layout.gridWidth * position);
    buffer.fillRect(x, groundY - 13, 2, 13, plantColor);
    buffer.fillRect(x - 5, groundY - 15, 7, 4, leafColor);
    buffer.fillRect(x + 2, groundY - 20, 7, 4, leafColor);
  }

  drawGardenSign(buffer, palette, config, layout, plan);
  if (plan.identity.enabled && (plan.identity.name || plan.identity.role)) {
    drawIdentity(buffer, palette, plan, layout);
  }
}

function drawGardenSign(
  buffer: FrameBuffer,
  palette: Palette,
  config: ResolvedConfig,
  layout: SceneLayout,
  plan: ScenePlan,
): void {
  const {
    left: signLeft,
    top: signTop,
    width: signWidth,
    height: signHeight,
    postHeight,
  } = layout.sign;
  const wood = palette.index("#684c2e");
  const woodLight = palette.index("#77583a");
  const post = palette.index("#5a4027");
  const label = palette.index("#ffe9b3");
  const value = palette.index("#ffffff");
  const outline = palette.index("#3d2b1a");

  buffer.fillRect(signLeft, signTop, signWidth, signHeight, wood);
  buffer.fillRect(signLeft + 5, signTop + 5, signWidth - 10, signHeight - 10, woodLight);
  if (postHeight > 0) {
    buffer.fillRect(signLeft + 14, signTop + signHeight, 10, postHeight, post);
    buffer.fillRect(signLeft + signWidth - 24, signTop + signHeight, 10, postHeight, post);
  }

  const statsPeriod = config.experience.stats.period;
  const total = statsPeriod === "calendar-year"
    ? plan.metrics.calendarYearTotal
    : plan.metrics.displayedTotal;
  const width = signWidth - 28;
  const showStreak = config.experience.stats.showStreak;
  const showTotal = config.experience.stats.showTotal;
  const columnWidth = Math.floor(width / ((showStreak ? 1 : 0) + (showTotal ? 1 : 0) || 1));
  const valueScale = (text: string): number =>
    measureText(text, 2) <= columnWidth ? 2 : 1;
  let cursor = signLeft + 14;
  if (showStreak) {
    drawTextWithShadow(buffer, palette, "STREAK", cursor, signTop + 12, label, outline, 1);
    const days = `${plan.metrics.currentStreak} DAYS`;
    drawTextWithShadow(buffer, palette, days, cursor, signTop + 27, value, outline, valueScale(days));
    cursor += columnWidth;
  }
  if (showTotal) {
    const caption = statsPeriod === "calendar-year" ? "YEAR" : "53 WEEKS";
    drawTextWithShadow(buffer, palette, caption, cursor, signTop + 12, label, outline, 1);
    drawTextWithShadow(buffer, palette, `${total}`, cursor, signTop + 27, value, outline, valueScale(`${total}`));
  }
}

function drawIdentity(
  buffer: FrameBuffer,
  palette: Palette,
  plan: ScenePlan,
  layout: SceneLayout,
): void {
  const name = plan.identity.name.trim().toUpperCase();
  const role = plan.identity.role.trim().toUpperCase();
  const textColor = palette.index("#eee9ff");
  const roleColor = palette.index("#87dba8");
  if (plan.identity.style === "combined-sign") {
    const signLeft = layout.sign.left;
    const signTop = Math.max(TOP_MARGIN, layout.sign.top - 47);
    buffer.fillRect(signLeft, signTop, layout.sign.width, 39, palette.index("#684c2e"));
    drawText(buffer, palette, name.slice(0, 14), signLeft + 10, signTop + 7, textColor, 1);
    drawText(buffer, palette, role.slice(0, 22), signLeft + 10, signTop + 22, roleColor, 1);
    return;
  }

  const left = Math.max(10, Math.floor(buffer.width * 0.07));
  const top = Math.max(8, Math.floor(buffer.height * 0.12));
  drawText(buffer, palette, name.slice(0, 16), left, top, textColor, 1);
  drawText(buffer, palette, role.slice(0, 24), left, top + 9, roleColor, 1);
}

function drawVignette(
  buffer: FrameBuffer,
  palette: Palette,
  config: ResolvedConfig,
  layout: SceneLayout,
  plan: ScenePlan,
  characterX: number,
  frameIndex: number,
  frameCount: number,
): void {
  const x = Math.max(6, Math.min(buffer.width - 24, characterX + 36));
  const y = layout.baselineY - 5;
  const green = palette.index("#96e6a5");
  const purple = palette.index("#c7a0ef");
  const warm = palette.index("#f5dca1");
  const phase = Math.floor((frameIndex / frameCount) * 6) % 2;

  if (plan.vignette === "water") {
    buffer.fillRect(x, y - 12, 5, 12, palette.index("#8da8b5"));
    buffer.fillRect(x - 2, y - 15, 9, 4, palette.index("#496c76"));
    buffer.fillRect(x + 8, y - 2, 13, 2, palette.index("#a7d9df"));
    return;
  }
  if (plan.vignette === "read") {
    buffer.fillRect(x, y - 12, 12, 8, warm);
    buffer.fillRect(x + 5, y - 13, 2, 10, palette.index("#8b6840"));
    return;
  }
  if (plan.vignette === "nap") {
    drawText(buffer, palette, phase === 0 ? "Z" : "Z Z", x, y - 23, purple, 1);
    return;
  }
  if (plan.vignette === "rain-watch") {
    buffer.fillRect(x, y - 26, 18, 3, palette.index("#273e53"));
    buffer.fillRect(x + 5, y - 29, 9, 3, palette.index("#273e53"));
    buffer.fillRect(x + 2, y - 20, 2, 7, palette.index("#a7d9df"));
    buffer.fillRect(x + 12, y - 17, 2, 7, palette.index("#a7d9df"));
    return;
  }
  if (plan.vignette === "puddle-hop") {
    buffer.fillRect(x, y, 22, 2, palette.index("#a7d9df"));
    buffer.fillRect(x + 5, y + 3, 12, 1, palette.index("#8da8b5"));
    return;
  }
  if (plan.vignette === "celebrate") {
    const sparkles: readonly [number, number][] = [[0, -20], [12, -27], [24, -17], [9, -8]];
    for (const [offsetX, offsetY] of sparkles) {
      buffer.fillRect(x + offsetX, y + offsetY, 3, 3, phase === 0 ? warm : purple);
    }
    return;
  }

  const fireflies: readonly [number, number][] = [[0, -18], [14, -26], [28, -14]];
  for (const [offsetX, offsetY] of fireflies) {
    buffer.fillRect(x + offsetX, y + offsetY, 3, 3, phase === 0 ? green : warm);
  }
  void config;
}

function seasonSkyColor(background: string, season: Season): string {
  const seasonTint: Record<Season, string> = {
    spring: "#275b52",
    summer: "#2d4569",
    autumn: "#68433e",
    winter: "#283b59",
  };
  return mixHex(background, seasonTint[season], 0.28);
}

function drawBaseline(
  buffer: FrameBuffer,
  palette: Palette,
  config: ResolvedConfig,
  layout: SceneLayout,
): void {
  const color = palette.index(
    mixHex(config.theme.gridEmpty, config.theme.accent, 0.35),
  );
  buffer.fillRect(layout.gridLeft, layout.baselineY, layout.gridWidth, 1, color);
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
