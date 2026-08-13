import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadCharacter } from "./character/load.js";
import { loadConfig } from "./config/load.js";
import { fetchContributionDays } from "./contributions/github.js";
import { normalizeCalendar } from "./contributions/normalize.js";
import type { RawContributionDay } from "./contributions/types.js";
import { encodeGif, writeGifAtomic } from "./output/gif.js";
import { createScene, type IndexedFrame } from "./render/scene.js";

const MILLISECONDS_PER_DAY = 86_400_000;
const DISPLAY_WEEK_OFFSET = 52 * 7;

export interface GenerateOptions {
  configPath: string;
  outputPath?: string;
  fixturePath?: string;
  token?: string;
  now?: Date;
}

export interface GenerateResult {
  path: string;
  frames: number;
  width: number;
  height: number;
}

export async function generate(
  options: GenerateOptions,
): Promise<GenerateResult> {
  const config = await loadConfig(options.configPath);
  const character = await loadCharacter(config.characterPath);
  const source = options.fixturePath
    ? await loadFixture(options.fixturePath)
    : await fetchLiveDays(config.github.username, options.token, options.now);
  const calendar = normalizeCalendar(source.days, source.endDate);
  const scene = createScene(config, character);
  const frameCount = Math.round(
    config.output.fps * config.output.durationSeconds,
  );
  const frames: IndexedFrame[] = [];
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    frames.push(scene.render(calendar, frameIndex));
  }

  const delayMs = Math.round(1000 / config.output.fps);
  const bytes = encodeGif(frames, delayMs);
  const outputPath = options.outputPath
    ? resolve(options.outputPath)
    : config.outputPath;
  await writeGifAtomic(outputPath, bytes);

  return {
    path: outputPath,
    frames: frameCount,
    width: config.output.width,
    height: config.output.height,
  };
}

async function loadFixture(
  fixturePath: string,
): Promise<{ endDate: string; days: RawContributionDay[] }> {
  const path = resolve(fixturePath);
  const raw = await readFile(path, "utf8");
  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${path}: invalid fixture JSON: ${message}`);
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path}: fixture must be an object`);
  }
  const fixture = value as Record<string, unknown>;
  if (typeof fixture.endDate !== "string" || !Array.isArray(fixture.days)) {
    throw new Error(`${path}: fixture must contain endDate and days`);
  }
  return {
    endDate: fixture.endDate,
    days: fixture.days as RawContributionDay[],
  };
}

async function fetchLiveDays(
  username: string,
  token: string | undefined,
  now = new Date(),
): Promise<{ endDate: string; days: RawContributionDay[] }> {
  if (token === undefined || token.trim().length === 0) {
    throw new Error("GITHUB_TOKEN is required unless --fixture is used");
  }
  if (Number.isNaN(now.getTime())) {
    throw new Error("generation date is invalid");
  }

  const endDate = now.toISOString().slice(0, 10);
  const endTimestamp = Date.parse(`${endDate}T00:00:00Z`);
  const endDayOfWeek = new Date(endTimestamp).getUTCDay();
  const startTimestamp =
    endTimestamp -
    (endDayOfWeek + DISPLAY_WEEK_OFFSET) * MILLISECONDS_PER_DAY;
  const startDate = new Date(startTimestamp).toISOString().slice(0, 10);
  const days = await fetchContributionDays({
    username,
    token,
    from: `${startDate}T00:00:00Z`,
    to: `${endDate}T23:59:59Z`,
  });
  return { endDate, days };
}
