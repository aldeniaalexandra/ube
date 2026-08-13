import { describe, expect, it } from "vitest";
import { selectFramesWithinBudget } from "../../src/output/budget.js";
import type { IndexedFrame } from "../../src/render/scene.js";
import { encodePng } from "../../src/output/png.js";

function frame(index: number): IndexedFrame {
  return {
    width: 2,
    height: 1,
    pixels: new Uint8Array([index % 2, (index + 1) % 2]),
    palette: [[0, 0, 0], [255, 255, 255]],
  };
}

describe("selectFramesWithinBudget", () => {
  it("thins frames deterministically until the target budget fits", () => {
    const frames = Array.from({ length: 10 }, (_, index) => frame(index));
    const selected = selectFramesWithinBudget(
      frames,
      (candidate) => new Uint8Array(candidate.length * 10),
      { targetBytes: 45, hardMaxBytes: 70 },
    );

    expect(selected.frames).toHaveLength(4);
    expect(selected.bytes).toHaveLength(40);
    expect(selected.frames.map((item) => item.pixels[0])).toEqual([0, 1, 0, 1]);
  });

  it("throws when even one frame exceeds the hard ceiling", () => {
    expect(() =>
      selectFramesWithinBudget([frame(0)], () => new Uint8Array(100), {
        targetBytes: 50,
        hardMaxBytes: 80,
      }),
    ).toThrow("cannot fit one GIF frame within the hard byte budget");
  });
});

describe("encodePng", () => {
  it("writes a PNG signature and dimensions", () => {
    const bytes = encodePng(frame(0));

    expect([...bytes.subarray(0, 8)]).toEqual([
      137, 80, 78, 71, 13, 10, 26, 10,
    ]);
    expect(new DataView(bytes.buffer, bytes.byteOffset).getUint32(16)).toBe(2);
    expect(new DataView(bytes.buffer, bytes.byteOffset).getUint32(20)).toBe(1);
  });
});
