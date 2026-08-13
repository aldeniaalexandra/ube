import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { generate } from "../../src/generate.js";
import { writeGifAtomic } from "../../src/output/gif.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});

describe("generate", () => {
  it("generates a looping 960 by 320 GIF with 150 frames", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ube-gif-"));
    temporaryDirectories.push(directory);
    const outputPath = join(directory, "ube.gif");
    const staticOutputPath = join(directory, "ube.png");

    const result = await generate({
      configPath: resolve("ube.config.json"),
      fixturePath: resolve("tests/fixtures/calendar.json"),
      outputPath,
      now: new Date("2026-08-13T12:00:00Z"),
    });
    const bytes = await readFile(outputPath);
    const staticBytes = await readFile(staticOutputPath);

    expect(bytes.subarray(0, 6).toString("ascii")).toBe("GIF89a");
    expect(readLogicalScreen(bytes)).toEqual({ width: 960, height: 320 });
    expect(countSequence(bytes, [0x21, 0xf9, 0x04])).toBe(150);
    expect(bytes.includes(Buffer.from("NETSCAPE2.0", "ascii"))).toBe(true);
    expect(bytes.at(-1)).toBe(0x3b);
    expect(staticBytes.subarray(0, 8)).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
    expect(result).toEqual({
      path: outputPath,
      staticPath: staticOutputPath,
      frames: 150,
      width: 960,
      height: 320,
    });
  }, 30_000);

  it("keeps concurrent atomic writes isolated", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ube-atomic-gif-"));
    temporaryDirectories.push(directory);
    const outputPath = join(directory, "ube.gif");
    const candidates = Array.from(
      { length: 8 },
      (_, index) => new Uint8Array(4096).fill(index),
    );

    await Promise.all(
      candidates.map((bytes) => writeGifAtomic(outputPath, bytes)),
    );

    const output = await readFile(outputPath);
    expect(candidates.some((bytes) => output.equals(bytes))).toBe(true);
    expect(await readdir(directory)).toEqual(["ube.gif"]);
  });
});

function readLogicalScreen(bytes: Buffer): { width: number; height: number } {
  return {
    width: bytes.readUInt16LE(6),
    height: bytes.readUInt16LE(8),
  };
}

function countSequence(bytes: Buffer, sequence: readonly number[]): number {
  let count = 0;
  for (let offset = 0; offset <= bytes.length - sequence.length; offset += 1) {
    if (sequence.every((byte, index) => bytes[offset + index] === byte)) {
      count += 1;
    }
  }
  return count;
}
