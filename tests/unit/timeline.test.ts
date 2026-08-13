import { describe, expect, it } from "vitest";
import { sampleTimeline, type TimelineOptions } from "../../src/animation/timeline.js";

const options: TimelineOptions = {
  frameCount: 120,
  canvasWidth: 960,
  characterWidth: 48,
  stridePixels: 12,
  gridLeft: 85,
  gridCellStep: 15,
  gridColumns: 53,
};

describe("sampleTimeline", () => {
  it("starts and ends fully outside the canvas", () => {
    expect(sampleTimeline(0, options).x).toBe(-options.characterWidth);
    expect(sampleTimeline(119, options).x).toBeGreaterThanOrEqual(
      options.canvasWidth,
    );
  });

  it("advances gait by distance instead of frame number", () => {
    const slowOptions = {
      ...options,
      canvasWidth: 20,
      characterWidth: 4,
      frameCount: 100,
      stridePixels: 3,
    };

    const samples = Array.from({ length: 30 }, (_, frame) =>
      sampleTimeline(frame, slowOptions),
    );
    const repeatedPosition = samples.findIndex(
      (sample, index) => index > 0 && sample.x === samples[index - 1]?.x,
    );

    expect(repeatedPosition).toBeGreaterThan(0);
    expect(samples[repeatedPosition]?.pose).toBe(
      samples[repeatedPosition - 1]?.pose,
    );
  });

  it("blinks only in the fixed loop windows", () => {
    expect(sampleTimeline(34, options).blink).toBe(true);
    expect(sampleTimeline(35, options).blink).toBe(true);
    expect(sampleTimeline(36, options).blink).toBe(false);
    expect(sampleTimeline(82, options).blink).toBe(true);
  });

  it("disables the wake while Ube is outside either graph edge", () => {
    expect(sampleTimeline(0, options).wakeColumn).toBe(-1);
    expect(sampleTimeline(60, options).wakeColumn).toBeGreaterThanOrEqual(0);
    expect(sampleTimeline(119, options).wakeColumn).toBe(-1);
  });
});
