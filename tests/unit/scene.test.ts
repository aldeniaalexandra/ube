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
  "b286bd1a82628120dcf30200bb5b3ffedd57c4c410651f9697fea7f0e72099fe",
  "95d4380f0fe6815962409bed32e572b5dba269d6db0b0d7278ced6bb837e8830",
  "973372cdcaa7d4e753e687789769b2e7b1a65ca9d12a5e6df292672de862135e",
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
