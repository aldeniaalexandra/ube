import { mkdir } from "node:fs/promises";
import { build } from "esbuild";

await mkdir("dist", { recursive: true });

await Promise.all([
  build({
    entryPoints: ["src/cli-entry.ts"],
    outfile: "dist/cli.js",
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    sourcemap: true,
    sourcesContent: false,
    banner: { js: "#!/usr/bin/env node" },
  }),
  build({
    entryPoints: ["src/action-entry.ts"],
    outfile: "dist/action.js",
    bundle: true,
    platform: "node",
    target: "node24",
    format: "esm",
    sourcemap: true,
    sourcesContent: false,
  }),
]);
