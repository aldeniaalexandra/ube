const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
import {
  isHemisphere,
  isIdentityStyle,
  isStatsPeriod,
} from "../experience/defaults.js";
import type { ExperienceConfig } from "../experience/types.js";

const MAX_FRAME_COUNT = 300;
const MAX_LINK_LENGTH = 2_048;
const MAX_IDENTITY_LENGTH = 80;
const MIN_TARGET_BYTES = 100_000;
const MAX_HARD_MAX_BYTES = 5_000_000;

export interface UbeConfig {
  version: 1 | 2;
  github: { username: string };
  character: string;
  output: {
    path: string;
    width: number;
    height: number;
    fps: number;
    durationSeconds: number;
  };
  theme: {
    background: string;
    gridEmpty: string;
    gridLevels: [string, string, string, string];
    accent: string;
  };
  experience?: ExperienceConfig;
}

export interface ResolvedConfig extends UbeConfig {
  configPath: string;
  characterPath: string;
  outputPath: string;
  experience: ExperienceConfig;
}

export class ConfigError extends Error {
  public override readonly name = "ConfigError";
}

type JsonObject = Record<string, unknown>;

export function validateConfig(value: unknown): UbeConfig {
  const config = requireObject(value, "config");
  assertOnlyKeys(
    config,
    ["version", "github", "character", "output", "theme", "experience"],
    "config",
  );

  if (config.version !== 1 && config.version !== 2) {
    throw new ConfigError("version must be 1 or 2");
  }

  const github = requireObject(config.github, "github");
  assertOnlyKeys(github, ["username"], "github");
  const username = requireString(github.username, "github.username");
  if (!USERNAME_PATTERN.test(username)) {
    throw new ConfigError("github.username must be a valid GitHub username");
  }

  const character = requireString(config.character, "character");
  const output = validateOutput(config.output);
  const theme = validateTheme(config.theme);

  if (output.fps * output.durationSeconds > MAX_FRAME_COUNT) {
    throw new ConfigError(`output must contain at most ${MAX_FRAME_COUNT} frames`);
  }

  const experience = config.experience === undefined
    ? undefined
    : validateExperience(config.experience);

  return {
    version: config.version,
    github: { username },
    character,
    output,
    theme,
    ...(experience ? { experience } : {}),
  };
}

function validateExperience(value: unknown): ExperienceConfig {
  const experience = requireObject(value, "experience");
  assertOnlyKeys(
    experience,
    ["habitat", "calendar", "stats", "identity", "link", "budget"],
    "experience",
  );
  if (experience.habitat !== undefined && experience.habitat !== "moonlit-garden") {
    throw new ConfigError("experience.habitat must be moonlit-garden");
  }

  const calendar = requireObject(experience.calendar ?? {}, "experience.calendar");
  assertOnlyKeys(calendar, ["timezone", "hemisphere"], "experience.calendar");
  const timezone = calendar.timezone === undefined
    ? "UTC"
    : requireString(calendar.timezone, "experience.calendar.timezone");
  const hemisphere = calendar.hemisphere === undefined
    ? "north"
    : calendar.hemisphere;
  if (!isHemisphere(hemisphere)) {
    throw new ConfigError("experience.calendar.hemisphere must be north or south");
  }

  const stats = requireObject(experience.stats ?? {}, "experience.stats");
  assertOnlyKeys(
    stats,
    ["period", "showStreak", "showTotal"],
    "experience.stats",
  );
  const period = stats.period === undefined ? "displayed-weeks" : stats.period;
  if (!isStatsPeriod(period)) {
    throw new ConfigError(
      "experience.stats.period must be displayed-weeks or calendar-year",
    );
  }
  const showStreak = stats.showStreak === undefined
    ? true
    : requireBoolean(stats.showStreak, "experience.stats.showStreak");
  const showTotal = stats.showTotal === undefined
    ? true
    : requireBoolean(stats.showTotal, "experience.stats.showTotal");

  const identity = requireObject(experience.identity ?? {}, "experience.identity");
  assertOnlyKeys(
    identity,
    ["enabled", "name", "role", "style"],
    "experience.identity",
  );
  const enabled = identity.enabled === undefined
    ? false
    : requireBoolean(identity.enabled, "experience.identity.enabled");
  const name = identity.name === undefined
    ? ""
    : requireOptionalBoundedString(identity.name, "experience.identity.name", MAX_IDENTITY_LENGTH);
  const role = identity.role === undefined
    ? ""
    : requireOptionalBoundedString(identity.role, "experience.identity.role", MAX_IDENTITY_LENGTH);
  const style = identity.style === undefined ? "quiet-label" : identity.style;
  if (!isIdentityStyle(style)) {
    throw new ConfigError(
      "experience.identity.style must be quiet-label or combined-sign",
    );
  }

  const link = experience.link === undefined
    ? ""
    : requireLink(experience.link, "experience.link");
  const budget = requireObject(experience.budget ?? {}, "experience.budget");
  assertOnlyKeys(
    budget,
    ["targetBytes", "hardMaxBytes"],
    "experience.budget",
  );
  const targetBytes = budget.targetBytes === undefined
    ? 2_000_000
    : requireIntegerInRange(
      budget.targetBytes,
      "experience.budget.targetBytes",
      MIN_TARGET_BYTES,
      MAX_HARD_MAX_BYTES,
    );
  const hardMaxBytes = budget.hardMaxBytes === undefined
    ? 5_000_000
    : requireIntegerInRange(
      budget.hardMaxBytes,
      "experience.budget.hardMaxBytes",
      targetBytes,
      MAX_HARD_MAX_BYTES,
    );

  return {
    habitat: "moonlit-garden",
    calendar: { timezone, hemisphere },
    stats: { period, showStreak, showTotal },
    identity: { enabled, name, role, style },
    link,
    budget: { targetBytes, hardMaxBytes },
  };
}

function validateOutput(value: unknown): UbeConfig["output"] {
  const output = requireObject(value, "output");
  assertOnlyKeys(
    output,
    ["path", "width", "height", "fps", "durationSeconds"],
    "output",
  );

  return {
    path: requireString(output.path, "output.path"),
    width: requireIntegerInRange(output.width, "output.width", 320, 1600),
    height: requireIntegerInRange(output.height, "output.height", 160, 800),
    fps: requireNumberInRange(output.fps, "output.fps", 1, 25),
    durationSeconds: requireNumberInRange(
      output.durationSeconds,
      "output.durationSeconds",
      2,
      30,
    ),
  };
}

function validateTheme(value: unknown): UbeConfig["theme"] {
  const theme = requireObject(value, "theme");
  assertOnlyKeys(
    theme,
    ["background", "gridEmpty", "gridLevels", "accent"],
    "theme",
  );

  if (!Array.isArray(theme.gridLevels) || theme.gridLevels.length !== 4) {
    throw new ConfigError("theme.gridLevels must contain exactly four colors");
  }

  const gridLevels = theme.gridLevels.map((color, index) =>
    requireColor(color, `theme.gridLevels[${index}]`),
  ) as [string, string, string, string];

  return {
    background: requireColor(theme.background, "theme.background"),
    gridEmpty: requireColor(theme.gridEmpty, "theme.gridEmpty"),
    gridLevels,
    accent: requireColor(theme.accent, "theme.accent"),
  };
}

function requireObject(value: unknown, path: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ConfigError(`${path} must be an object`);
  }
  return value as JsonObject;
}

function assertOnlyKeys(value: JsonObject, allowed: readonly string[], path: string): void {
  const allowedKeys = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      throw new ConfigError(`${path} contains unknown key '${key}'`);
    }
  }
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ConfigError(`${path} must be a non-empty string`);
  }
  return value;
}

function requireBoundedString(value: unknown, path: string, maximumLength: number): string {
  const result = requireString(value, path);
  if (result.length > maximumLength) {
    throw new ConfigError(`${path} must contain at most ${maximumLength} characters`);
  }
  return result;
}

function requireOptionalBoundedString(
  value: unknown,
  path: string,
  maximumLength: number,
): string {
  if (typeof value !== "string") {
    throw new ConfigError(`${path} must be a string`);
  }
  if (value.length > maximumLength) {
    throw new ConfigError(`${path} must contain at most ${maximumLength} characters`);
  }
  return value;
}

function requireBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    throw new ConfigError(`${path} must be a boolean`);
  }
  return value;
}

function requireLink(value: unknown, path: string): string {
  if (typeof value !== "string") {
    throw new ConfigError(`${path} must be a string`);
  }
  if (value.length > MAX_LINK_LENGTH) {
    throw new ConfigError(`${path} must contain at most ${MAX_LINK_LENGTH} characters`);
  }
  const link = value;
  if (link.length === 0) return link;
  let parsed: URL;
  try {
    parsed = new URL(link);
  } catch {
    throw new ConfigError(`${path} must be an absolute http or https URL`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ConfigError(`${path} must be an absolute http or https URL`);
  }
  return link;
}

function requireColor(value: unknown, path: string): string {
  const color = requireString(value, path);
  if (!HEX_COLOR_PATTERN.test(color)) {
    throw new ConfigError(`${path} must be a six-digit hex color`);
  }
  return color;
}

function requireIntegerInRange(
  value: unknown,
  path: string,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new ConfigError(
      `${path} must be an integer between ${minimum} and ${maximum}`,
    );
  }
  return value as number;
}

function requireNumberInRange(
  value: unknown,
  path: string,
  minimum: number,
  maximum: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new ConfigError(`${path} must be between ${minimum} and ${maximum}`);
  }
  return value;
}
