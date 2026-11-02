import { describe, expect, it } from "vitest";

import { scrubSentryEvent } from "./sentry-event";

describe("scrubSentryEvent", () => {
  it("removes identifying request data and keeps only correlation tags", () => {
    const event = {
      user: { email: "person@example.com", id: "user-1" },
      request: { url: "https://example.test/?token=secret", data: "payload" },
      extra: { password: "secret" },
      breadcrumbs: [{ message: "user entered clinical notes" }],
      contexts: { custom: { clientName: "person" } },
      transaction: "/clients/person@example.com",
      fingerprint: ["customer@example.com"],
      message: "Database error containing customer input",
      logentry: {
        message: "error includes customer@example.com",
        params: ["private@example.com"],
      },
      tags: {
        operation: "client.create",
        operation_id: "operation-1",
        clientEmail: "person@example.com",
      },
      exception: {
        values: [
          {
            type: "Error",
            value: "password=secret",
            mechanism: { data: { email: "private@example.com" } },
          },
        ],
      },
    };

    expect(scrubSentryEvent(event)).toEqual({
      message: "Unhandled application error",
      transaction: "Next.js application error",
      logentry: { message: "Unhandled application error" },
      tags: {
        operation: "client.create",
        operation_id: "operation-1",
      },
      exception: {
        values: [
          {
            type: "Error",
            value: "Unhandled application error",
            mechanism: {},
          },
        ],
      },
    });
  });
});
