import { spawnSync } from "node:child_process";
import path from "node:path";

import { verifyLiveDatabase } from "./lib/verify-live-database";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    throw new Error("Provide Prisma CLI arguments.");
  }

  const { target } = await verifyLiveDatabase();
  console.log(
    `Validated ${process.env.APP_ENV} database target: ${target.host}:${target.port}/${target.database} (${target.schema}).`,
  );

  const cliPath = path.resolve(
    process.cwd(),
    "node_modules/prisma/build/index.js",
  );
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  process.exitCode = result.status ?? 1;
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Prisma command failed.",
  );
  process.exitCode = 1;
});
