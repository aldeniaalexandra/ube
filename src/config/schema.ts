const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const MAX_FRAME_COUNT = 300;

export interface UbeConfig {
  version: 1;
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
}

export interface ResolvedConfig extends UbeConfig {
  configPath: string;
  characterPath: string;
  outputPath: string;
}

export class ConfigError extends Error {
  public override readonly name = "ConfigError";
}

type JsonObject = Record<string, unknown>;

export function validateConfig(value: unknown): UbeConfig {
  const config = requireObject(value, "config");
  assertOnlyKeys(config, ["version", "github", "character", "output", "theme"], "config");

  if (config.version !== 1) {
    throw new ConfigError("version must be 1");
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

  return {
    version: 1,
    github: { username },
    character,
    output,
    theme,
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
