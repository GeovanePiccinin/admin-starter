import { createHmac } from "node:crypto";

import { prisma } from "@/lib/db/prisma";

const ACTION_WINDOW_MS = 60_000;
const DEFAULT_ACTION_LIMIT = 120;
const MUTATION_ACTION_LIMIT = 30;
const LOGIN_WINDOW_MS = 15 * 60_000;
const LOGIN_LIMIT = 5;

export class RateLimitExceededError extends Error {
  constructor() {
    super("Muitas tentativas em pouco tempo. Aguarde e tente novamente.");
    this.name = "RateLimitExceededError";
  }
}

function getRateLimitSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.APP_ENV === "production") {
    throw new Error("AUTH_SECRET is required for production rate limiting.");
  }

  return "local-development-rate-limit-key";
}

function getBucketKey(scope: string, windowMs: number, now: number): string {
  const window = Math.floor(now / windowMs);
  return createHmac("sha256", getRateLimitSecret())
    .update(`${scope}:${window}`)
    .digest("hex");
}

async function consumeBucket(
  scope: string,
  limit: number,
  windowMs: number,
): Promise<void> {
  const now = Date.now();
  const expiresAt = new Date((Math.floor(now / windowMs) + 1) * windowMs);
  const bucketKey = getBucketKey(scope, windowMs, now);
  const bucket = await prisma.rateLimitBucket.upsert({
    where: { bucketKey },
    create: { bucketKey, count: 1, expiresAt },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  if (bucket.count === 1) {
    await prisma.rateLimitBucket.deleteMany({
      where: { expiresAt: { lt: new Date(now - 60_000) } },
    });
  }

  if (bucket.count > limit) {
    throw new RateLimitExceededError();
  }
}

export async function enforceAuthenticatedActionRateLimit(
  tenantId: string,
  actorId: string,
  operation: string,
): Promise<void> {
  const isMutation = /\.(create|update|delete|complete)$/.test(operation);
  await consumeBucket(
    `action:${tenantId}:${actorId}:${operation}`,
    isMutation ? MUTATION_ACTION_LIMIT : DEFAULT_ACTION_LIMIT,
    ACTION_WINDOW_MS,
  );
}

export async function enforceLoginRateLimit(
  email: string,
  clientAddress?: string,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  await consumeBucket(
    `login:email:${normalizedEmail}`,
    LOGIN_LIMIT,
    LOGIN_WINDOW_MS,
  );
  if (clientAddress) {
    await consumeBucket(
      `login:address:${clientAddress}`,
      LOGIN_LIMIT,
      LOGIN_WINDOW_MS,
    );
  }
}
