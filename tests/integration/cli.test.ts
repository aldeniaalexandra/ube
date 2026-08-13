import { execFile } from "node:child_process";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { runCli } from "../../src/cli.js";

const temporaryDirectories: string[] = [];
const execFileAsync = promisify(execFile);

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});

describe("runCli", () => {
  it("generates from a fixture and prints the output path", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ube-cli-"));
    temporaryDirectories.push(directory);
    const output: string[] = [];
    const errors: string[] = [];
    const outputPath = join(directory, "ube.gif");

    const exitCode = await runCli(
      [
        "generate",
        "--config",
        resolve("ube.config.json"),
        "--fixture",
        resolve("tests/fixtures/calendar.json"),
        "--output",
        outputPath,
      ],
      {
        env: {},
        writeOut: (message) => output.push(message),
        writeError: (message) => errors.push(message),
      },
    );

    expect(exitCode).toBe(0);
    expect(output).toEqual([
      `Generated 150 frames at ${outputPath} and ${outputPath.replace(/\.gif$/, ".png")} (960x320)`,
    ]);
    expect(errors).toEqual([]);
  }, 30_000);

  it("requires a token outside fixture mode", async () => {
    const errors: string[] = [];

    const exitCode = await runCli(
      ["generate", "--config", resolve("ube.config.json")],
      {
        env: { GITHUB_TOKEN: "" },
        writeOut: () => undefined,
        writeError: (message) => errors.push(message),
      },
    );

    expect(exitCode).toBe(1);
    expect(errors).toEqual([
      "GITHUB_TOKEN is required unless --fixture is used",
    ]);
  });

  it("runs the bundled CLI when npm-style linking changes its entry path", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ube-linked-cli-"));
    temporaryDirectories.push(directory);
    const linkedDist = join(directory, "dist");
    await symlink(
      resolve("dist"),
      linkedDist,
      process.platform === "win32" ? "junction" : "dir",
    );

    const { stdout, stderr } = await execFileAsync(process.execPath, [
      join(linkedDist, "cli.js"),
      "validate",
      "--config",
      resolve("ube.config.json"),
    ]);

    expect(stdout.trim()).toContain("Valid Ube config for Ube:");
    expect(stderr).toBe("");
  });
});
