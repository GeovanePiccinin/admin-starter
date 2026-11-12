import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import {
  assertEnvironmentDatabase,
  clearPostgresEnvironmentOverrides,
} from "./database-target";

clearPostgresEnvironmentOverrides();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const appEnvironment = process.env.APP_ENV;
const connectionString = process.env.DATABASE_URL;

if (
  appEnvironment !== "development" &&
  appEnvironment !== "test" &&
  appEnvironment !== "production"
) {
  throw new Error(
    "APP_ENV must be set by an explicit application command before Prisma Client starts.",
  );
}

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not configured for this application environment.",
  );
}

assertEnvironmentDatabase(connectionString, appEnvironment);

const adapter = new PrismaPg(
  {
    connectionString,
  },
  {
    schema: process.env.DATABASE_SCHEMA ?? "public",
  },
);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
