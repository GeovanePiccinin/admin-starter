import { spawnSync } from "node:child_process";

const environment = process.env.CI === "true" ? "production" : "development";
const result = spawnSync(
  process.execPath,
  [
    "node_modules/tsx/dist/cli.mjs",
    "scripts/run-env.ts",
    environment,
    "node_modules/next/dist/bin/next",
    "build",
  ],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  },
);

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
