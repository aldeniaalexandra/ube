import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config/load.js";
import { validateConfig } from "../../src/config/schema.js";

const validConfig = {
  version: 1,
  github: { username: "aldeniaalexandra" },
  character: "characters/ube.json",
  output: {
    path: "assets/ube.gif",
    width: 960,
    height: 320,
    fps: 12.5,
    durationSeconds: 9.6,
  },
  theme: {
    background: "#0d1117",
    gridEmpty: "#21262d",
    gridLevels: ["#0e4429", "#006d32", "#26a641", "#39d353"],
    accent: "#8a63e8",
  },
};

describe("validateConfig", () => {
  it("accepts the version-one project contract", () => {
    expect(validateConfig(validConfig)).toEqual(validConfig);
  });

  it("reports the exact path of an invalid width", () => {
    const invalid = {
      ...validConfig,
      output: { ...validConfig.output, width: 0 },
    };

    expect(() => validateConfig(invalid)).toThrow(
      "output.width must be an integer between 320 and 1600",
    );
  });

  it("rejects unknown keys", () => {
    expect(() => validateConfig({ ...validConfig, legacy: true })).toThrow(
      "config contains unknown key 'legacy'",
    );
  });
});

describe("loadConfig", () => {
  it("resolves character and output paths from the config directory", async () => {
    const fixtureDirectory = resolve("tests/fixtures/config/valid");
    const loaded = await loadConfig(resolve(fixtureDirectory, "ube.config.json"));

    expect(loaded.characterPath).toBe(
      resolve(fixtureDirectory, "characters/ube.json"),
    );
    expect(loaded.outputPath).toBe(
      resolve(fixtureDirectory, "assets/ube.gif"),
    );
  });

  it("includes the config filename in schema errors", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ube-invalid-config-"));
    const configPath = join(directory, "ube.config.json");
    await writeFile(
      configPath,
      JSON.stringify({
        ...validConfig,
        output: { ...validConfig.output, width: 0 },
      }),
    );

    try {
      await expect(loadConfig(configPath)).rejects.toThrow(
        `${configPath}: output.width must be an integer between 320 and 1600`,
      );
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
});
