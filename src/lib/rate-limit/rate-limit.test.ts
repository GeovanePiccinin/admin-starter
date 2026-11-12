import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upsert: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    rateLimitBucket: {
      upsert: mocks.upsert,
      deleteMany: mocks.deleteMany,
    },
  },
}));

import {
  enforceAuthenticatedActionRateLimit,
  enforceLoginRateLimit,
  RateLimitExceededError,
} from "./rate-limit";

describe("database-backed rate limiting", () => {
  let bucketCounts: Map<string, number>;

  beforeEach(() => {
    vi.clearAllMocks();
    bucketCounts = new Map();
    process.env.APP_ENV = "test";
    process.env.AUTH_SECRET = "test-secret";
    mocks.deleteMany.mockResolvedValue({ count: 0 });
    mocks.upsert.mockImplementation(
      async (query: { create: { bucketKey: string } }) => {
        const key = query.create.bucketKey;
        const count = (bucketCounts.get(key) ?? 0) + 1;
        bucketCounts.set(key, count);
        return { count };
      },
    );
  });

  it("limits repeated mutations per authenticated actor and operation", async () => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await enforceAuthenticatedActionRateLimit(
        "tenant-1",
        "actor-1",
        "client.create",
      );
    }

    await expect(
      enforceAuthenticatedActionRateLimit(
        "tenant-1",
        "actor-1",
        "client.create",
      ),
    ).rejects.toBeInstanceOf(RateLimitExceededError);
  });

  it("limits login attempts and stores only an HMAC bucket key", async () => {
    mocks.upsert.mockImplementation(
      async (query: { create: { bucketKey: string } }) => {
        expect(query.create.bucketKey).not.toContain("person@example.com");
        const key = query.create.bucketKey;
        const count = (bucketCounts.get(key) ?? 0) + 1;
        bucketCounts.set(key, count);
        return { count };
      },
    );

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await enforceLoginRateLimit("Person@example.com", "192.0.2.1");
    }

    await expect(
      enforceLoginRateLimit("Person@example.com", "192.0.2.1"),
    ).rejects.toBeInstanceOf(RateLimitExceededError);
  });
});
