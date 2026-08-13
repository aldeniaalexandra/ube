import { loadCharacter } from "./character/load.js";
import { loadConfig } from "./config/load.js";
import { generate } from "./generate.js";

export interface CliRuntime {
  env: NodeJS.ProcessEnv;
  writeOut(message: string): void;
  writeError(message: string): void;
}

interface ParsedArguments {
  command: "generate" | "validate";
  configPath: string;
  fixturePath?: string;
  outputPath?: string;
}

const DEFAULT_RUNTIME: CliRuntime = {
  env: process.env,
  writeOut: (message) => console.log(message),
  writeError: (message) => console.error(message),
};

export async function runCli(
  args: readonly string[],
  runtime: CliRuntime = DEFAULT_RUNTIME,
): Promise<number> {
  try {
    const parsed = parseArguments(args);
    if (parsed.command === "validate") {
      const config = await loadConfig(parsed.configPath);
      const character = await loadCharacter(config.characterPath);
      runtime.writeOut(`Valid Ube config for ${character.name}: ${config.configPath}`);
      return 0;
    }

    const result = await generate({
      configPath: parsed.configPath,
      ...(parsed.fixturePath ? { fixturePath: parsed.fixturePath } : {}),
      ...(parsed.outputPath ? { outputPath: parsed.outputPath } : {}),
      ...(runtime.env.GITHUB_TOKEN
        ? { token: runtime.env.GITHUB_TOKEN }
        : {}),
    });
    runtime.writeOut(
      `Generated ${result.frames} frames at ${result.path} and ${result.staticPath} (${result.width}x${result.height})`,
    );
    return 0;
  } catch (error) {
    runtime.writeError(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function parseArguments(args: readonly string[]): ParsedArguments {
  const [command, ...flagArguments] = args;
  if (command !== "generate" && command !== "validate") {
    throw new Error("usage: ube <generate|validate> [--config path] [--fixture path] [--output path]");
  }

  const flags = new Map<string, string>();
  for (let index = 0; index < flagArguments.length; index += 2) {
    const flag = flagArguments[index];
    const value = flagArguments[index + 1];
    if (flag === undefined || !["--config", "--fixture", "--output"].includes(flag)) {
      throw new Error(`unknown option '${flag ?? ""}'`);
    }
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`${flag} requires a value`);
    }
    if (flags.has(flag)) {
      throw new Error(`${flag} may only be provided once`);
    }
    flags.set(flag, value);
  }

  if (command === "validate" && (flags.has("--fixture") || flags.has("--output"))) {
    throw new Error("validate only accepts --config");
  }

  return {
    command,
    configPath: flags.get("--config") ?? "ube.config.json",
    ...(flags.has("--fixture") ? { fixturePath: flags.get("--fixture") as string } : {}),
    ...(flags.has("--output") ? { outputPath: flags.get("--output") as string } : {}),
  };
}
