import { copyFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const environmentFiles = [
  [".env.development.example", ".env.development"],
  [".env.test.example", ".env.test"],
] as const;

for (const [example, local] of environmentFiles) {
  const localPath = path.join(root, local);
  if (!existsSync(localPath)) {
    copyFileSync(path.join(root, example), localPath);
    console.log(`Created ${local} from ${example}.`);
  } else {
    console.log(`Keeping existing ${local}.`);
  }
}

function runPnpm(
  script:
    | "db:up"
    | "db:migrate:development"
    | "db:migrate:test"
    | "db:seed:development",
): void {
  const isWindows = process.platform === "win32";
  const result = spawnSync(
    isWindows ? (process.env.ComSpec ?? "cmd.exe") : "pnpm",
    isWindows ? ["/d", "/s", "/c", `pnpm run ${script}`] : ["run", script],
    {
      cwd: root,
      env: process.env,
      stdio: "inherit",
    },
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${script} failed with exit code ${result.status ?? 1}.`);
  }
}

try {
  runPnpm("db:up");
  runPnpm("db:migrate:development");
  runPnpm("db:migrate:test");
  runPnpm("db:seed:development");
  console.log("Local development and test databases are ready.");
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : "Local setup failed.");
  process.exitCode = 1;
}
