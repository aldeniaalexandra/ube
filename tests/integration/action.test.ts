import { appendFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runAction } from "../../src/action.js";
import type { GenerateOptions, GenerateResult } from "../../src/generate.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});

describe("runAction", () => {
  it("writes the generated path to the GitHub output file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ube-action-"));
    temporaryDirectories.push(directory);
    const githubOutput = join(directory, "github-output.txt");
    const generatedPath = join(directory, "assets", "100%-ube.gif");
    const generateImpl = async (_options: GenerateOptions): Promise<GenerateResult> => ({
      path: generatedPath,
      frames: 120,
      width: 960,
      height: 320,
    });

    const exitCode = await runAction({
      env: {
        INPUT_CONFIG: "ube.config.json",
        INPUT_TOKEN: "secret-token",
        INPUT_OUTPUT: generatedPath,
        GITHUB_OUTPUT: githubOutput,
      },
      appendOutput: appendFile,
      generateImpl,
      writeError: () => undefined,
    });

    expect(exitCode).toBe(0);
    expect(await readFile(githubOutput, "utf8")).toBe(
      `path<<UBE_OUTPUT_PATH\n${generatedPath}\nUBE_OUTPUT_PATH\n`,
    );
  });

  it("never includes the token in a workflow error", async () => {
    const messages: string[] = [];
    const generateImpl = async (): Promise<GenerateResult> => {
      throw new Error("request failed");
    };

    const exitCode = await runAction({
      env: {
        INPUT_CONFIG: "ube.config.json",
        INPUT_TOKEN: "secret-token",
        GITHUB_OUTPUT: "unused",
      },
      appendOutput: appendFile,
      generateImpl,
      writeError: (message) => messages.push(message),
    });

    expect(exitCode).toBe(1);
    expect(messages).toEqual(["::error::request failed"]);
    expect(messages.join(" ")).not.toContain("secret-token");
  });
});
