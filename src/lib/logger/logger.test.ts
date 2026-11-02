import { describe, expect, it } from "vitest";

import { createLogger } from "./logger";

describe("logger redaction", () => {
  it("redacts credentials, personal data, and clinical fields at nested paths", () => {
    let output = "";
    const logger = createLogger({
      write(line: string) {
        output += line;
      },
    });

    logger.error(
      {
        payload: {
          password: "pass-secret",
          email: "private@example.com",
          authorization: "Bearer token-secret",
          clinical: { content: "confidential notes" },
        },
        DATABASE_URL: "postgresql://user:secret@db.example/app",
      },
      "request failed",
    );

    const record = JSON.parse(output) as {
      payload: {
        password: string;
        email: string;
        authorization: string;
        clinical: { content: string };
      };
      DATABASE_URL: string;
    };

    expect(record.payload.password).toBe("[REDACTED]");
    expect(record.payload.email).toBe("[REDACTED]");
    expect(record.payload.authorization).toBe("[REDACTED]");
    expect(record.payload.clinical.content).toBe("[REDACTED]");
    expect(record.DATABASE_URL).toBe("[REDACTED]");
    expect(output).not.toContain("pass-secret");
    expect(output).not.toContain("private@example.com");
    expect(output).not.toContain("token-secret");
    expect(output).not.toContain("confidential notes");
    expect(output).not.toContain("postgresql://");
  });
});
