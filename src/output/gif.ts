import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { GIFEncoder } from "gifenc";
import type { IndexedFrame } from "../render/scene.js";

const GIF_MINIMUM_DELAY_MS = 10;
const pendingWrites = new Map<string, Promise<void>>();

export function encodeGif(
  frames: readonly IndexedFrame[],
  delayMs: number,
): Uint8Array {
  if (frames.length === 0) {
    throw new Error("cannot encode a GIF without frames");
  }
  if (!Number.isInteger(delayMs) || delayMs < GIF_MINIMUM_DELAY_MS) {
    throw new Error("GIF delay must be an integer of at least 10 ms");
  }

  const firstFrame = frames[0] as IndexedFrame;
  validateFrame(firstFrame);
  const encoder = GIFEncoder({
    initialCapacity: Math.max(4096, firstFrame.pixels.length),
  });

  for (const [index, frame] of frames.entries()) {
    validateCompatibleFrame(frame, firstFrame, index);
    encoder.writeFrame(frame.pixels, frame.width, frame.height, {
      ...(index === 0 ? { palette: frame.palette } : {}),
      delay: delayMs,
      repeat: 0,
      dispose: 1,
    });
  }
  encoder.finish();
  return new Uint8Array(encoder.bytes());
}

export async function writeGifAtomic(
  outputPath: string,
  bytes: Uint8Array,
): Promise<void> {
  const previousWrite = pendingWrites.get(outputPath) ?? Promise.resolve();
  const currentWrite = previousWrite
    .catch(() => undefined)
    .then(() => writeGifAtomicNow(outputPath, bytes));
  pendingWrites.set(outputPath, currentWrite);

  try {
    await currentWrite;
  } finally {
    if (pendingWrites.get(outputPath) === currentWrite) {
      pendingWrites.delete(outputPath);
    }
  }
}

async function writeGifAtomicNow(
  outputPath: string,
  bytes: Uint8Array,
): Promise<void> {
  const outputDirectory = dirname(outputPath);
  const temporaryPath = join(
    outputDirectory,
    `.${basename(outputPath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  await mkdir(outputDirectory, { recursive: true });
  try {
    await writeFile(temporaryPath, bytes);
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

function validateFrame(frame: IndexedFrame): void {
  if (!Number.isInteger(frame.width) || frame.width < 1) {
    throw new Error("GIF frame width must be a positive integer");
  }
  if (!Number.isInteger(frame.height) || frame.height < 1) {
    throw new Error("GIF frame height must be a positive integer");
  }
  if (frame.pixels.length !== frame.width * frame.height) {
    throw new Error("GIF frame pixel count does not match its dimensions");
  }
  if (frame.palette.length < 1 || frame.palette.length > 256) {
    throw new Error("GIF palette must contain between 1 and 256 colors");
  }
}

function validateCompatibleFrame(
  frame: IndexedFrame,
  firstFrame: IndexedFrame,
  index: number,
): void {
  validateFrame(frame);
  if (frame.width !== firstFrame.width || frame.height !== firstFrame.height) {
    throw new Error(`GIF frame ${index} dimensions do not match the first frame`);
  }
  if (!palettesMatch(frame.palette, firstFrame.palette)) {
    throw new Error(`GIF frame ${index} palette does not match the first frame`);
  }
}

function palettesMatch(left: number[][], right: number[][]): boolean {
  return (
    left.length === right.length &&
    left.every(
      (color, index) =>
        color.length === right[index]?.length &&
        color.every((channel, channelIndex) => channel === right[index]?.[channelIndex]),
    )
  );
}
