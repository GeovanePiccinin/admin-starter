import { spawnSync } from "node:child_process";
import path from "node:path";

import { verifyLiveDatabase } from "./lib/verify-live-database";

function run(commandPath: string, args: string[]): void {
  const result = spawnSync(process.execPath, [commandPath, ...args], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Command failed with exit code ${result.status ?? 1}.`);
  }
}

async function main(): Promise<void> {
  if (process.env.APP_ENV !== "test") {
    throw new Error("The database reset script only runs with APP_ENV=test.");
  }
  const consent = process.env.PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION;
  if (consent !== "pode executar o plano") {
    throw new Error(
      'Set PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION to the exact explicit approval "pode executar o plano" before resetting the test database.',
    );
  }

  const { target } = await verifyLiveDatabase();
  if (!target.database.endsWith("_test")) {
    throw new Error("Refusing to reset a database not suffixed _test.");
  }

  console.log(
    `Resetting only validated test database ${target.host}:${target.port}/${target.database} (${target.schema}).`,
  );

  run(
    path.resolve(process.cwd(), "node_modules/prisma/build/index.js"),
    ["migrate", "reset", "--force"],
  );
  run(
    path.resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs"),
    ["prisma/seed.ts"],
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Test DB reset failed.");
  process.exitCode = 1;
});
