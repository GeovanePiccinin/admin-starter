import { describe, expect, it } from "vitest";

import {
  assertEnvironmentDatabase,
  resolveDatabaseUrl,
} from "./database-target";

describe("resolveDatabaseUrl", () => {
  it("resolves the configurable local PostgreSQL port", () => {
    expect(
      resolveDatabaseUrl(
        "postgresql://starter:local@127.0.0.1:${STARTER_POSTGRES_PORT}/software_starter_dev",
        { STARTER_POSTGRES_PORT: "54330" },
      ),
    ).toBe(
      "postgresql://starter:local@127.0.0.1:54330/software_starter_dev",
    );
  });

  it.each(["0", "65536", "abc", ""])(
    "rejects an invalid local database port: %s",
    (port) => {
      expect(() =>
        resolveDatabaseUrl(
          "postgresql://starter:local@127.0.0.1:${STARTER_POSTGRES_PORT}/software_starter_dev",
          { STARTER_POSTGRES_PORT: port },
        ),
      ).toThrow("STARTER_POSTGRES_PORT must be a valid TCP port.");
    },
  );

  it("rejects placeholders other than the approved port setting", () => {
    expect(() =>
      resolveDatabaseUrl(
        "postgresql://starter:local@127.0.0.1:${DATABASE_HOST}/software_starter_dev",
        { DATABASE_HOST: "localhost" },
      ),
    ).toThrow("Unsupported DATABASE_URL placeholder: DATABASE_HOST.");
  });
});

describe("assertEnvironmentDatabase", () => {
  it("accepts only the isolated local development and test databases", () => {
    expect(
      assertEnvironmentDatabase(
        "postgresql://starter:local@127.0.0.1:54329/software_starter_dev",
        "development",
      ).database,
    ).toBe("software_starter_dev");

    expect(
      assertEnvironmentDatabase(
        "postgresql://starter:local@127.0.0.1:54329/software_starter_test",
        "test",
      ).database,
    ).toBe("software_starter_test");
  });

  it.each([
    ["sistema_agendamento_dev", "development"],
    ["sistema_agendamento_test", "test"],
    ["software_starter_test", "development"],
    ["software_starter_dev", "test"],
  ] as const)(
    "rejects database %s for the %s environment",
    (database, environment) => {
      expect(() =>
        assertEnvironmentDatabase(
          `postgresql://starter:local@127.0.0.1:54329/${database}`,
          environment,
        ),
      ).toThrow();
    },
  );
});
