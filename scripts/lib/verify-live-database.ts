import { Client } from "pg";

import {
  assertEnvironmentDatabase,
  clearPostgresEnvironmentOverrides,
  type AppEnvironment,
  type DatabaseTarget,
} from "../../src/lib/db/database-target";

export async function verifyLiveDatabase(): Promise<{
  environment: AppEnvironment;
  target: DatabaseTarget;
}> {
  const environment = process.env.APP_ENV;
  const connectionString = process.env.DATABASE_URL;

  if (
    environment !== "development" &&
    environment !== "test" &&
    environment !== "production"
  ) {
    throw new Error("APP_ENV must be set by an explicit environment command.");
  }
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  clearPostgresEnvironmentOverrides();
  const target = assertEnvironmentDatabase(connectionString, environment);
  const client = new Client({ connectionString });

  await client.connect();
  try {
    const result = await client.query<{
      database: string;
      schema: string;
    }>(
      "SELECT current_database() AS database, current_schema() AS schema",
    );
    const actual = result.rows[0];

    if (
      !actual ||
      actual.database !== target.database ||
      actual.schema !== target.schema
    ) {
      throw new Error(
        "The live database/schema does not match the validated DATABASE_URL.",
      );
    }

    return { environment, target };
  } finally {
    await client.end();
  }
}
