import { defineConfig } from "prisma/config";

import {
  assertEnvironmentDatabase,
  clearPostgresEnvironmentOverrides,
} from "./src/lib/db/database-target";

clearPostgresEnvironmentOverrides();

const appEnvironment = process.env.APP_ENV;
const databaseUrl = process.env.DATABASE_URL;

if (
  appEnvironment !== "schema" &&
  appEnvironment !== "development" &&
  appEnvironment !== "test" &&
  appEnvironment !== "production"
) {
  throw new Error(
    "Set APP_ENV through the explicit project scripts before running Prisma CLI commands.",
  );
}

if (appEnvironment !== "schema") {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for this Prisma operation.");
  }

  assertEnvironmentDatabase(
    databaseUrl,
    appEnvironment,
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
