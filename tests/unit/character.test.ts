import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadCharacter, validateCharacter } from "../../src/character/load.js";

const blankFrame = Array.from({ length: 8 }, () => " ".repeat(12));

function validPack(): Record<string, unknown> {
  return {
    version: 1,
    name: "Test buddy",
    cellSize: 4,
    anchor: { x: 6, y: 7 },
    palette: { P: "#8a63e8", E: "#171225" },
    frames: {
      idle: [...blankFrame],
      blink: [...blankFrame],
      walk: [
        [...blankFrame],
        [...blankFrame],
        [...blankFrame],
        [...blankFrame],
      ],
    },
  };
}

describe("loadCharacter", () => {
  it("loads the original Ube pack with four consistent walk poses", async () => {
    const ube = await loadCharacter(resolve("characters/ube.json"));
    const frames = [ube.frames.idle, ube.frames.blink, ...ube.frames.walk];

    expect(ube.name).toBe("Ube");
    expect(ube.frames.walk).toHaveLength(4);
    expect(frames.every((frame) => frame.length === 8)).toBe(true);
    expect(frames.every((frame) => frame.every((row) => row.length === 12))).toBe(true);
  });
});

describe("validateCharacter", () => {
  it("points to the exact undeclared symbol", () => {
    const pack = validPack();
    const frames = pack.frames as Record<string, unknown>;
    frames.idle = [`?${" ".repeat(11)}`, ...blankFrame.slice(1)];

    expect(() => validateCharacter(pack)).toThrow(
      "frames.idle[0][0] uses undeclared symbol '?'",
    );
  });

  it("rejects frames with inconsistent row widths", () => {
    const pack = validPack();
    const frames = pack.frames as Record<string, unknown>;
    frames.blink = [" ".repeat(11), ...blankFrame.slice(1)];

    expect(() => validateCharacter(pack)).toThrow(
      "frames.blink[0] must contain exactly 12 symbols",
    );
  });
});
