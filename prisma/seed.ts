import { runDemoSeed } from "./seed-demo";

runDemoSeed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Seed failed.");
  process.exitCode = 1;
});
