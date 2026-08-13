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
  "c90a4d9ef91704342918d120c874ed1174f4592981615fdba123d22046ab7e0e",
  "c47d896b296793f25f56235518ea5ba74889e1057dea6f6cfc8b2c4447ed0823",
  "4d1da46658d4347edd70a91b8a4611b0541dcaa292952ffd9353c4c599770663",
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
