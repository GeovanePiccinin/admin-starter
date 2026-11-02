export type AppEnvironment = "development" | "test" | "production";

export interface DatabaseTarget {
  host: string;
  port: string;
  database: string;
  schema: string;
}

export function clearPostgresEnvironmentOverrides(): void {
  for (const variable of Object.keys(process.env)) {
    if (variable.toUpperCase().startsWith("PG")) {
      delete process.env[variable];
    }
  }
}

const targetOverrideParameters = [
  "database",
  "host",
  "hostaddr",
  "port",
  "options",
  "search_path",
  "service",
  "servicefile",
];

export function getDatabaseTarget(connectionString: string): DatabaseTarget {
  let url: URL;

  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use PostgreSQL.");
  }

  if (!url.hostname || !url.port || !url.pathname.startsWith("/")) {
    throw new Error("DATABASE_URL must specify a host, port, and database.");
  }

  if (
    targetOverrideParameters.some((parameter) =>
      url.searchParams.has(parameter),
    )
  ) {
    throw new Error(
      "DATABASE_URL cannot override its host, port, or database in query parameters.",
    );
  }

  const encodedDatabase = url.pathname.slice(1);
  if (
    !encodedDatabase ||
    encodedDatabase.includes("%") ||
    encodedDatabase.includes("/")
  ) {
    throw new Error("DATABASE_URL must use a plain database name.");
  }

  const schemas = url.searchParams.getAll("schema");
  if (schemas.length > 1 || (schemas.length === 1 && schemas[0] !== "public")) {
    throw new Error('DATABASE_URL must use the "public" schema.');
  }

  return {
    host: url.hostname.toLowerCase(),
    port: url.port,
    database: encodedDatabase,
    schema: schemas[0] ?? "public",
  };
}

export function assertEnvironmentDatabase(
  connectionString: string,
  environment: AppEnvironment,
): DatabaseTarget {
  const target = getDatabaseTarget(connectionString);
  const loopbackHosts = ["127.0.0.1", "[::1]"];

  if (environment === "development") {
    if (
      !loopbackHosts.includes(target.host) ||
      !/(?:_dev|_development)$/.test(target.database)
    ) {
      throw new Error(
        "Development must use a dedicated local database ending in _dev or _development.",
      );
    }
  } else if (environment === "test") {
    if (
      !loopbackHosts.includes(target.host) ||
      !target.database.endsWith("_test")
    ) {
      throw new Error(
        "Tests must use a dedicated local database ending in _test.",
      );
    }
  } else if (target.database.endsWith("_test")) {
    throw new Error("Production cannot use a test database.");
  }

  return target;
}

export function sameDatabaseTarget(
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
    first.database === second.database &&
    first.schema === second.schema
  );
}
