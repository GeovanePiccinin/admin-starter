import { defineConfig } from "vitest/config";
import path from "node:path";
import { loadEnv } from "vite";

const envDir = process.cwd();
const testEnv = loadEnv("test", envDir, "");
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL?.trim() || testEnv.TEST_DATABASE_URL?.trim();

type DatabaseTarget = {
  host: string;
  port: string;
  database: string;
};

const targetOverrideParameters = [
  "database",
  "host",
  "hostaddr",
  "port",
  "service",
  "servicefile",
];

function getDatabaseTarget(
  connectionString: string,
  variableName: string,
): DatabaseTarget {
  let url: URL;

  try {
    url = new URL(connectionString);
  } catch {
    throw new Error(
      `${variableName} must be a valid PostgreSQL connection URL.`,
    );
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error(
      `${variableName} must use the postgres: or postgresql: protocol.`,
    );
  }

  if (
    targetOverrideParameters.some((parameter) =>
      url.searchParams.has(parameter),
    )
  ) {
    throw new Error(
      `${variableName} must not override its host, port, or database in the query string.`,
    );
  }

  const database = decodeURIComponent(url.pathname.slice(1));

  return {
    host: url.hostname,
    port: url.port || "5432",
    database,
  };
}

function getLocalTestDatabaseTarget(
  connectionString: string,
  variableName: string,
): DatabaseTarget {
  const target = getDatabaseTarget(connectionString, variableName);

  if (!["127.0.0.1", "[::1]"].includes(target.host)) {
    throw new Error(
      `${variableName} must use a numeric loopback address (127.0.0.1 or ::1).`,
    );
  }

  const database = target.database;

  if (!database || !database.endsWith("_test")) {
    throw new Error(
      `${variableName} must target a dedicated database whose name ends with "_test".`,
    );
  }

  return target;
}

function sameDatabaseTarget(
  first: DatabaseTarget,
  second: DatabaseTarget,
): boolean {
  const loopbackHosts = ["localhost", "127.0.0.1", "[::1]"];
  const sameHost =
    first.host === second.host ||
    (loopbackHosts.includes(first.host) && loopbackHosts.includes(second.host));

  return (
    sameHost &&
    first.port === second.port &&
    first.database === second.database
  );
}

if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL is required to run tests. Configure a dedicated local PostgreSQL database; see .env.test.example.",
  );
}

const testDatabaseTarget = getLocalTestDatabaseTarget(
  testDatabaseUrl,
  "TEST_DATABASE_URL",
);

const normalDatabaseUrls = [
  process.env.DATABASE_URL,
  loadEnv("development", envDir, "").DATABASE_URL,
  loadEnv("production", envDir, "").DATABASE_URL,
].filter((value): value is string => Boolean(value?.trim()));

for (const normalDatabaseUrl of normalDatabaseUrls) {
  const normalTarget = getDatabaseTarget(
    normalDatabaseUrl,
    "DATABASE_URL from the application environment",
  );

  if (sameDatabaseTarget(testDatabaseTarget, normalTarget)) {
    throw new Error(
      "TEST_DATABASE_URL points to the same database as DATABASE_URL. Configure a separate test database.",
    );
  }
}

const configuredTestDatabaseUrl = testEnv.DATABASE_URL?.trim();

if (configuredTestDatabaseUrl) {
  const configuredTestTarget = getDatabaseTarget(
    configuredTestDatabaseUrl,
    "DATABASE_URL from the test environment",
  );

  if (!sameDatabaseTarget(testDatabaseTarget, configuredTestTarget)) {
    throw new Error(
      "DATABASE_URL from the test environment conflicts with TEST_DATABASE_URL. Remove it or point both variables to the same dedicated test database.",
    );
  }
}

process.env.DATABASE_URL = testDatabaseUrl;

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
      ...testEnv,
      TEST_DATABASE_URL: testDatabaseUrl,
      DATABASE_URL: testDatabaseUrl,
    },
  },
});
