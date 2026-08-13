import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { deflateSync } from "node:zlib";
import type { IndexedFrame } from "../render/scene.js";

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const pendingWrites = new Map<string, Promise<void>>();

export function encodePng(frame: IndexedFrame): Uint8Array {
  validateFrame(frame);
  const raw = new Uint8Array(frame.height * (1 + frame.width * 3));
  for (let y = 0; y < frame.height; y += 1) {
    const rowStart = y * (1 + frame.width * 3);
    raw[rowStart] = 0;
    for (let x = 0; x < frame.width; x += 1) {
      const paletteIndex = frame.pixels[y * frame.width + x] as number;
      const color = frame.palette[paletteIndex] ?? frame.palette[0] as number[];
      const pixelStart = rowStart + 1 + x * 3;
      raw[pixelStart] = color[0] as number;
      raw[pixelStart + 1] = color[1] as number;
      raw[pixelStart + 2] = color[2] as number;
    }
  }

  const header = new Uint8Array(13);
  writeUint32(header, 0, frame.width);
  writeUint32(header, 4, frame.height);
  header[8] = 8;
  header[9] = 2;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;
  const compressed = new Uint8Array(deflateSync(raw));
  return concat(
    PNG_SIGNATURE,
    chunk("IHDR", header),
    chunk("IDAT", compressed),
    chunk("IEND", new Uint8Array()),
  );
}

export async function writePngAtomic(
  outputPath: string,
  bytes: Uint8Array,
): Promise<void> {
  const previousWrite = pendingWrites.get(outputPath) ?? Promise.resolve();
  const currentWrite = previousWrite
    .catch(() => undefined)
    .then(() => writePngAtomicNow(outputPath, bytes));
  pendingWrites.set(outputPath, currentWrite);
  try {
    await currentWrite;
  } finally {
    if (pendingWrites.get(outputPath) === currentWrite) pendingWrites.delete(outputPath);
  }
}

async function writePngAtomicNow(outputPath: string, bytes: Uint8Array): Promise<void> {
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

function chunk(type: string, data: Uint8Array): Uint8Array {
  const result = new Uint8Array(12 + data.length);
  writeUint32(result, 0, data.length);
  for (let index = 0; index < 4; index += 1) result[4 + index] = type.charCodeAt(index);
  result.set(data, 8);
  writeUint32(result, 8 + data.length, crc32(result.subarray(4, 8 + data.length)));
  return result;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint32(target: Uint8Array, offset: number, value: number): void {
  target[offset] = (value >>> 24) & 0xff;
  target[offset + 1] = (value >>> 16) & 0xff;
  target[offset + 2] = (value >>> 8) & 0xff;
  target[offset + 3] = value & 0xff;
}

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function validateFrame(frame: IndexedFrame): void {
  if (!Number.isInteger(frame.width) || frame.width < 1 || !Number.isInteger(frame.height) || frame.height < 1) {
    throw new Error("PNG frame dimensions must be positive integers");
  }
  if (frame.pixels.length !== frame.width * frame.height) {
    throw new Error("PNG frame pixel count does not match its dimensions");
  }
  if (frame.palette.length < 1 || frame.palette.length > 256) {
    throw new Error("PNG palette must contain between 1 and 256 colors");
  }
}
