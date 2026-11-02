import { z } from "zod";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  setTag: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
  withScope: (callback: (scope: { setTag: typeof mocks.setTag }) => void) =>
    callback({ setTag: mocks.setTag }),
}));

vi.mock("@/lib/auth/get-authenticated-user", () => ({
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
}));

vi.mock("@/lib/logger/logger", () => ({
  logger: {
    error: mocks.error,
    warn: mocks.warn,
  },
}));

import { DomainError } from "@/lib/errors/domain-error";

import { runServerAction } from "./server-action";

describe("runServerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports unexpected errors with a correlation id and hides technical details", async () => {
    const internalError = new Error(
      "postgres connection string contains customer@example.com",
    );

    await expect(
      runServerAction("client.list", async () => {
        throw internalError;
      }),
    ).rejects.toThrow(
      /^Não foi possível concluir a operação\. Tente novamente\. \(referência: [0-9a-f-]+\)$/i,
    );

    expect(mocks.error).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "client.list",
        category: "internal",
        errorType: "Error",
        operationId: expect.any(String),
      }),
      "Unhandled Server Action failure",
    );
    expect(JSON.stringify(mocks.error.mock.calls)).not.toContain(
      "customer@example.com",
    );
    expect(mocks.captureException).toHaveBeenCalledWith(internalError);
  });

  it("returns known domain errors without reporting them as infrastructure failures", async () => {
    await expect(
      runServerAction("payment.create", async () => {
        throw new DomainError("Este atendimento já possui um pagamento.");
      }),
    ).rejects.toThrow("Este atendimento já possui um pagamento.");

    expect(mocks.warn).toHaveBeenCalledWith(
      expect.objectContaining({ category: "domain" }),
      "Server Action rejected",
    );
    expect(mocks.error).not.toHaveBeenCalled();
    expect(mocks.captureException).not.toHaveBeenCalled();
  });

  it("does not return rejected input values from validation errors", async () => {
    const parse = () => z.string().email().parse("invalid-secret");

    await expect(
      runServerAction("client.create", async () => parse()),
    ).rejects.toThrow(
      "Os dados informados são inválidos. Revise e tente novamente.",
    );

    expect(mocks.warn).toHaveBeenCalledWith(
      expect.objectContaining({ category: "validation" }),
      "Server Action rejected",
    );
    expect(mocks.captureException).not.toHaveBeenCalled();
  });
});
