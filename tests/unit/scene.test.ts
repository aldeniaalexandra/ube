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
  "2d3031623b50cb2ad308f5d007c9d5d378986e3a881c8bd129a284d503165279",
  "9515738829c10418f9addfd1be8dfdee7e1c800eec8cd4c32aec0d3ecebf9be8",
  "2d3031623b50cb2ad308f5d007c9d5d378986e3a881c8bd129a284d503165279",
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
