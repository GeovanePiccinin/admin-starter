import { verifyLiveDatabase } from "./lib/verify-live-database";

async function main(): Promise<void> {
  const { environment, target } = await verifyLiveDatabase();
  console.log(
    `Database connection OK: ${environment} ${target.host}:${target.port}/${target.database} (${target.schema}).`,
  );
}

main().catch((error: unknown) => {
  console.error(
    "Database connection failed:",
    error instanceof Error ? error.message : "unknown error",
  );
  process.exitCode = 1;
});
