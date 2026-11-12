import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { parse } from "dotenv";
import { defineConfig } from "vitest/config";

import {
  assertEnvironmentDatabase,
  clearPostgresEnvironmentOverrides,
  getDatabaseTarget,
  resolveDatabaseUrl,
  sameDatabaseTarget,
} from "./src/lib/db/database-target";

const envPath = path.resolve(process.cwd(), ".env.test");
if (!existsSync(envPath)) {
  throw new Error(".env.test is required to run tests.");
}

const testEnv = parse(readFileSync(envPath));
const configuredDatabaseUrl = testEnv.DATABASE_URL?.trim();
const configuredTestDatabaseUrl = testEnv.TEST_DATABASE_URL?.trim();

if (!configuredDatabaseUrl || !configuredTestDatabaseUrl) {
  throw new Error(".env.test must define DATABASE_URL and TEST_DATABASE_URL.");
}
const databaseUrl = resolveDatabaseUrl(configuredDatabaseUrl, testEnv);
const testDatabaseUrl = resolveDatabaseUrl(configuredTestDatabaseUrl, testEnv);

const databaseTarget = assertEnvironmentDatabase(databaseUrl, "test");
const testDatabaseTarget = assertEnvironmentDatabase(testDatabaseUrl, "test");
if (!sameDatabaseTarget(databaseTarget, testDatabaseTarget)) {
  throw new Error(
    "DATABASE_URL and TEST_DATABASE_URL in .env.test must match.",
  );
}

for (const fileName of [".env", ".env.development"]) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) {
    continue;
  }

  const configuredEnv = parse(readFileSync(filePath));
  const configuredUrl = configuredEnv.DATABASE_URL?.trim();
  if (
    configuredUrl &&
    sameDatabaseTarget(
      databaseTarget,
      getDatabaseTarget(resolveDatabaseUrl(configuredUrl, configuredEnv)),
    )
  ) {
    throw new Error(
      `.env.test points to the same database as ${fileName}. Configure a dedicated test database.`,
    );
  }
}

const configuredSchema = testEnv.DATABASE_SCHEMA?.trim();
if (configuredSchema && configuredSchema !== databaseTarget.schema) {
  throw new Error("DATABASE_SCHEMA in .env.test conflicts with DATABASE_URL.");
}

clearPostgresEnvironmentOverrides();
const isolatedTestEnv = Object.fromEntries(
  Object.entries(testEnv).filter(
    ([key]) => !key.toUpperCase().startsWith("PG"),
  ),
);

process.env.APP_ENV = "test";
process.env.TEST_DATABASE_URL = testDatabaseUrl;
process.env.DATABASE_URL = databaseUrl;
process.env.DATABASE_SCHEMA = databaseTarget.schema;

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    env: {
      ...isolatedTestEnv,
      APP_ENV: "test",
      TEST_DATABASE_URL: testDatabaseUrl,
      DATABASE_URL: databaseUrl,
      DATABASE_SCHEMA: databaseTarget.schema,
    },
  },
});
