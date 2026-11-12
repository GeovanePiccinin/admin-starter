import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { parse } from "dotenv";

import {
  assertEnvironmentDatabase,
  getDatabaseTarget,
  resolveDatabaseUrl,
  sameDatabaseTarget,
  type AppEnvironment,
} from "../src/lib/db/database-target";

const ignoredEnvironmentVariables = new Set([
  "APP_ENV",
  "DATABASE_URL",
  "DATABASE_SCHEMA",
  "TEST_DATABASE_URL",
  "NODE_OPTIONS",
  "NODE_PATH",
]);

function isPostgresEnvironmentVariable(name: string): boolean {
  return name.toUpperCase().startsWith("PG");
}

function readEnvFile(fileName: string): Record<string, string> {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) {
    throw new Error(`${fileName} is required for this command.`);
  }

  return parse(readFileSync(filePath));
}

function loadCommandEnvironment(
  environment: AppEnvironment | "schema",
): NodeJS.ProcessEnv {
  const commandEnv: NodeJS.ProcessEnv = { ...process.env };

  for (const variable of [
    "DATABASE_URL",
    "TEST_DATABASE_URL",
    "DATABASE_SCHEMA",
    "NODE_OPTIONS",
    "NODE_PATH",
  ]) {
    delete commandEnv[variable];
  }
  for (const variable of Object.keys(commandEnv)) {
    if (isPostgresEnvironmentVariable(variable)) {
      delete commandEnv[variable];
    }
  }

  commandEnv.APP_ENV = environment;

  if (environment === "schema") {
    return commandEnv;
  }

  if (environment === "production") {
    const connectionString = process.env.DATABASE_URL?.trim();
    if (!connectionString) {
      throw new Error(
        "Production DATABASE_URL must be provided by the deployment environment.",
      );
    }

    assertEnvironmentDatabase(connectionString, environment);
    commandEnv.DATABASE_URL = connectionString;
    commandEnv.DATABASE_SCHEMA = "public";
    return commandEnv;
  }

  const env = readEnvFile(
    environment === "development" ? ".env.development" : ".env.test",
  );
  const configuredConnectionString = env.DATABASE_URL?.trim();
  if (!configuredConnectionString) {
    throw new Error(`DATABASE_URL is required in .env.${environment}.`);
  }
  const connectionString = resolveDatabaseUrl(configuredConnectionString, env);

  const target = assertEnvironmentDatabase(connectionString, environment);
  const configuredSchema = env.DATABASE_SCHEMA?.trim();
  if (configuredSchema && configuredSchema !== target.schema) {
    throw new Error(
      `DATABASE_SCHEMA in .env.${environment} conflicts with DATABASE_URL.`,
    );
  }

  if (environment === "test") {
    const configuredTestConnectionString = env.TEST_DATABASE_URL?.trim();
    if (!configuredTestConnectionString) {
      throw new Error("TEST_DATABASE_URL is required in .env.test.");
    }
    const testConnectionString = resolveDatabaseUrl(
      configuredTestConnectionString,
      env,
    );

    const testTarget = assertEnvironmentDatabase(testConnectionString, "test");
    if (!sameDatabaseTarget(target, testTarget)) {
      throw new Error(
        "DATABASE_URL and TEST_DATABASE_URL in .env.test must match.",
      );
    }

    for (const fileName of [".env", ".env.development"]) {
      if (!existsSync(path.resolve(process.cwd(), fileName))) {
        continue;
      }

      const existingEnv = parse(readFileSync(fileName));
      const configuredUrl = existingEnv.DATABASE_URL?.trim();
      if (
        configuredUrl &&
        sameDatabaseTarget(
          target,
          getDatabaseTarget(resolveDatabaseUrl(configuredUrl, existingEnv)),
        )
      ) {
        throw new Error(
          `.env.test points to the same database as ${fileName}. Configure a dedicated test database.`,
        );
      }
    }

    commandEnv.TEST_DATABASE_URL = testConnectionString;
  }

  for (const [key, value] of Object.entries(env)) {
    if (
      !ignoredEnvironmentVariables.has(key.toUpperCase()) &&
      !isPostgresEnvironmentVariable(key)
    ) {
      commandEnv[key] = value;
    }
  }
  commandEnv.APP_ENV = environment;
  commandEnv.DATABASE_URL = connectionString;
  commandEnv.DATABASE_SCHEMA = target.schema;

  return commandEnv;
}

function main(): void {
  const [environmentArg, ...command] = process.argv.slice(2);
  const validEnvironments = [
    "development",
    "test",
    "production",
    "schema",
  ] as const;

  if (
    !environmentArg ||
    !validEnvironments.includes(
      environmentArg as (typeof validEnvironments)[number],
    ) ||
    command.length === 0
  ) {
    throw new Error(
      "Usage: run-env.ts <development|test|production|schema> <node-script> [args...]",
    );
  }

  const environment = environmentArg as AppEnvironment | "schema";
  const commandEnvironment = loadCommandEnvironment(environment);
  const child = spawn(process.execPath, command, {
    cwd: process.cwd(),
    env: commandEnvironment,
    stdio: "inherit",
  });

  child.on("error", (error: Error) => {
    console.error("Could not start command:", error.message);
    process.exitCode = 1;
  });
  child.on("exit", (code, signal) => {
    process.exitCode = code ?? (signal ? 1 : 0);
  });
}

try {
  main();
} catch (error: unknown) {
  console.error(
    error instanceof Error ? error.message : "Environment setup failed.",
  );
  process.exitCode = 1;
}
