import type { IndexedFrame } from "../render/scene.js";

export interface BudgetOptions {
  targetBytes: number;
  hardMaxBytes: number;
}

export interface BudgetedFrames {
  frames: IndexedFrame[];
  bytes: Uint8Array;
}

export function selectFramesWithinBudget(
  frames: readonly IndexedFrame[],
  encode: (frames: readonly IndexedFrame[]) => Uint8Array,
  options: BudgetOptions,
): BudgetedFrames {
  if (frames.length === 0) throw new Error("cannot budget an empty frame list");
  if (!Number.isInteger(options.targetBytes) || options.targetBytes < 1) {
    throw new RangeError("targetBytes must be a positive integer");
  }
  if (!Number.isInteger(options.hardMaxBytes) || options.hardMaxBytes < options.targetBytes) {
    throw new RangeError("hardMaxBytes must be greater than or equal to targetBytes");
  }

  const candidates = candidateCounts(frames.length);
  let largestWithinHardMax: BudgetedFrames | undefined;
  for (const count of candidates) {
    const sampled = sampleFrames(frames, count);
    const bytes = encode(sampled);
    const result = { frames: sampled, bytes };
    if (bytes.length <= options.targetBytes) return result;
    if (bytes.length <= options.hardMaxBytes && largestWithinHardMax === undefined) {
      largestWithinHardMax = result;
    }
  }
  if (largestWithinHardMax !== undefined) return largestWithinHardMax;
  throw new Error("cannot fit one GIF frame within the hard byte budget");
}

function candidateCounts(frameCount: number): number[] {
  const counts = new Set<number>([frameCount, 1]);
  for (const ratio of [0.8, 0.66, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1]) {
    counts.add(Math.max(1, Math.floor(frameCount * ratio)));
  }
  return [...counts].sort((left, right) => right - left);
}

function sampleFrames(
  frames: readonly IndexedFrame[],
  count: number,
): IndexedFrame[] {
  if (count >= frames.length) return [...frames];
  const sampled: IndexedFrame[] = [];
  for (let index = 0; index < count; index += 1) {
    const sourceIndex = Math.round((index * (frames.length - 1)) / (count - 1 || 1));
    sampled.push(frames[sourceIndex] as IndexedFrame);
  }
  return sampled;
}
