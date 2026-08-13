import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { CharacterPack, SpriteFrame } from "./types.js";

const FRAME_WIDTH = 12;
const FRAME_HEIGHT = 8;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export class CharacterError extends Error {
  public override readonly name = "CharacterError";
}

type JsonObject = Record<string, unknown>;

export async function loadCharacter(path: string): Promise<CharacterPack> {
  const characterPath = resolve(path);
  const raw = await readFile(characterPath, "utf8");
  return validateCharacter(parseJson(raw, characterPath));
}

export function validateCharacter(value: unknown): CharacterPack {
  const pack = requireObject(value, "character");
  assertOnlyKeys(
    pack,
    ["version", "name", "cellSize", "anchor", "palette", "frames"],
    "character",
  );

  if (pack.version !== 1) {
    throw new CharacterError("version must be 1");
  }

  const name = requireString(pack.name, "name");
  const cellSize = requireIntegerInRange(pack.cellSize, "cellSize", 2, 8);
  const anchor = validateAnchor(pack.anchor);
  const palette = validatePalette(pack.palette);
  const frames = validateFrames(pack.frames, palette);

  return {
    version: 1,
    name,
    cellSize,
    anchor,
    palette: Object.freeze(palette),
    frames,
  };
}

function validateAnchor(value: unknown): CharacterPack["anchor"] {
  const anchor = requireObject(value, "anchor");
  assertOnlyKeys(anchor, ["x", "y"], "anchor");
  return {
    x: requireIntegerInRange(anchor.x, "anchor.x", 0, FRAME_WIDTH - 1),
    y: requireIntegerInRange(anchor.y, "anchor.y", 0, FRAME_HEIGHT - 1),
  };
}

function validatePalette(value: unknown): Record<string, string> {
  const palette = requireObject(value, "palette");
  const entries = Object.entries(palette);
  if (entries.length === 0 || entries.length > 16) {
    throw new CharacterError("palette must contain between 1 and 16 colors");
  }

  const validated: Record<string, string> = {};
  for (const [symbol, color] of entries) {
    if (symbol.length !== 1 || symbol === " ") {
      throw new CharacterError("palette keys must be one visible character");
    }
    if (typeof color !== "string" || !HEX_COLOR_PATTERN.test(color)) {
      throw new CharacterError(`palette.${symbol} must be a six-digit hex color`);
    }
    validated[symbol] = color;
  }
  return validated;
}

function validateFrames(
  value: unknown,
  palette: Readonly<Record<string, string>>,
): CharacterPack["frames"] {
  const frames = requireObject(value, "frames");
  assertOnlyKeys(frames, ["idle", "blink", "walk"], "frames");

  if (!Array.isArray(frames.walk) || frames.walk.length !== 4) {
    throw new CharacterError("frames.walk must contain exactly four frames");
  }

  const idle = validateFrame(frames.idle, "frames.idle", palette);
  const blink = validateFrame(frames.blink, "frames.blink", palette);
  const walk = frames.walk.map((frame, index) =>
    validateFrame(frame, `frames.walk[${index}]`, palette),
  ) as [SpriteFrame, SpriteFrame, SpriteFrame, SpriteFrame];

  return {
    idle,
    blink,
    walk: Object.freeze(walk),
  };
}

function validateFrame(
  value: unknown,
  path: string,
  palette: Readonly<Record<string, string>>,
): SpriteFrame {
  if (!Array.isArray(value) || value.length !== FRAME_HEIGHT) {
    throw new CharacterError(`${path} must contain exactly ${FRAME_HEIGHT} rows`);
  }

  const rows = value.map((row, rowIndex) => {
    if (typeof row !== "string") {
      throw new CharacterError(`${path}[${rowIndex}] must be a string`);
    }
    if (row.length !== FRAME_WIDTH) {
      throw new CharacterError(
        `${path}[${rowIndex}] must contain exactly ${FRAME_WIDTH} symbols`,
      );
    }
    for (let column = 0; column < row.length; column += 1) {
      const symbol = row[column] as string;
      if (symbol !== " " && !(symbol in palette)) {
        throw new CharacterError(
          `${path}[${rowIndex}][${column}] uses undeclared symbol '${symbol}'`,
        );
      }
    }
    return row;
  });

  return Object.freeze(rows);
}

function parseJson(raw: string, path: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CharacterError(`${path}: invalid JSON: ${message}`);
  }
}

function requireObject(value: unknown, path: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new CharacterError(`${path} must be an object`);
  }
  return value as JsonObject;
}

function assertOnlyKeys(value: JsonObject, allowed: readonly string[], path: string): void {
  const allowedKeys = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      throw new CharacterError(`${path} contains unknown key '${key}'`);
    }
  }
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new CharacterError(`${path} must be a non-empty string`);
  }
  return value;
}

function requireIntegerInRange(
  value: unknown,
  path: string,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new CharacterError(
      `${path} must be an integer between ${minimum} and ${maximum}`,
    );
  }
  return value as number;
}
