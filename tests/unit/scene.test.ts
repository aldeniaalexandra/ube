import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { loadCharacter } from "../../src/character/load.js";
import type { CharacterPack } from "../../src/character/types.js";
import { loadConfig } from "../../src/config/load.js";
import type { ResolvedConfig } from "../../src/config/schema.js";
import { normalizeCalendar } from "../../src/contributions/normalize.js";
import type { ContributionCalendar, RawContributionDay } from "../../src/contributions/types.js";
import { createScene, type Scene } from "../../src/render/scene.js";

const EXPECTED_FRAME_HASHES = [
  "e58d116149b7a37431d832575f5a1673c53d1538a914b02074924c1b3a744923",
  "89ada6103578e5f66c3dcaf0306b04ad42dc65a6780b32d6619b29f45d989588",
  "6acefafb356b12368497b5a79fc3e07cd935b2778847026aed5c40527e9ba942",
];

let scene: Scene;
let calendar: ContributionCalendar;
let config: ResolvedConfig;
let character: CharacterPack;

beforeAll(async () => {
  config = await loadConfig("ube.config.json") as ResolvedConfig;
  character = await loadCharacter(config.characterPath) as CharacterPack;
  const fixture = JSON.parse(
    await readFile("tests/fixtures/calendar.json", "utf8"),
  ) as { endDate: string; days: RawContributionDay[] };
  calendar = normalizeCalendar(fixture.days, fixture.endDate);
  scene = createScene(config, character);
});

describe("createScene", () => {
  it("renders all 371 contribution cells on a stable layout", () => {
    const frame = scene.render(calendar, 60);
    const { gridLeft, gridTop, cellSize, cellGap, columns, rows } = scene.layout;
    let paintedOrigins = 0;

    for (let column = 0; column < columns; column += 1) {
      for (let row = 0; row < rows; row += 1) {
        const x = gridLeft + column * (cellSize + cellGap);
        const y = gridTop + row * (cellSize + cellGap);
        if (frame.pixels[y * frame.width + x] !== 0) paintedOrigins += 1;
      }
    }

    expect(frame.width).toBe(960);
    expect(frame.height).toBe(320);
    expect(paintedOrigins).toBe(371);
  });

  it("renders a wooden Garden Sign layer above the contribution graph", () => {
    const frame = scene.render(calendar, 60);
    const woodIndex = frame.palette.findIndex(
      (color) => color[0] === 139 && color[1] === 104 && color[2] === 64,
    );

    expect(woodIndex).toBeGreaterThanOrEqual(0);
    expect([...frame.pixels].filter((pixel) => pixel === woodIndex).length).toBeGreaterThan(100);
  });

  it("renders the moon as a stepped crescent instead of a square corner", () => {
    const frameIndex = 60;
    const frame = scene.render(calendar, frameIndex);
    const moonIndex = frame.palette.findIndex(
      (color) => color[0] === 245 && color[1] === 220 && color[2] === 161,
    );
    const frameCount = Math.round(config.output.fps * config.output.durationSeconds);
    const moonX = Math.max(26, frame.width - 90);
    const moonY = 34 + Math.round(Math.sin((frameIndex / frameCount) * Math.PI * 2) * 2);
    const pixel = (x: number, y: number): number => frame.pixels[y * frame.width + x] as number;

    expect(moonIndex).toBeGreaterThanOrEqual(0);
    expect(pixel(moonX, moonY)).toBe(frame.pixels[0]);
    expect(pixel(moonX + 9, moonY)).toBe(moonIndex);
    expect(pixel(moonX + 21, moonY + 9)).toBe(frame.pixels[0]);
  });

  it("produces stable entrance, midpoint, and exit frames", () => {
    const hashes = [0, 60, 119].map((frameIndex) =>
      createHash("sha256")
        .update(scene.render(calendar, frameIndex).pixels)
        .digest("hex"),
    );

    expect(hashes).toEqual(EXPECTED_FRAME_HASHES);
  });

  it("adapts the contribution grid to the smallest supported canvas", () => {
    const compactScene = createScene(
      {
        ...config,
        output: { ...config.output, width: 320, height: 160 },
      },
      character,
    );
    const frame = compactScene.render(calendar, 60);
    const { gridLeft, gridTop, cellSize, cellGap } = compactScene.layout;

    expect(frame).toMatchObject({ width: 320, height: 160 });
    expect(gridLeft).toBeGreaterThanOrEqual(0);
    expect(gridTop).toBeGreaterThanOrEqual(0);
    expect(cellSize).toBeLessThan(10);
    expect(cellGap).toBeGreaterThanOrEqual(1);
  });
});
