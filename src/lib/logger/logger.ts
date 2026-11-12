import pino from "pino";

import { getObservabilityContext } from "@/lib/observability/context";

const isDevelopment = process.env.NODE_ENV === "development";
const sensitiveFields = [
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
  "set-cookie",
  "DATABASE_URL",
  "connectionString",
  "email",
  "phone",
  "dateOfBirth",
  "content",
  "notes",
];
const redactPaths = sensitiveFields.flatMap((field) => [
  field,
  ...Array.from({ length: 5 }, (_, index) =>
    [...Array.from({ length: index + 1 }, () => "*"), field].join("."),
  ),
]);

const loggerOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      ...redactPaths,
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers.set-cookie",
    ],
    censor: "[REDACTED]",
  },
  mixin() {
    const context = getObservabilityContext();
    return context
      ? {
          operationId: context.operationId,
          operation: context.operation,
          ...(context.tenantId ? { tenantId: context.tenantId } : {}),
        }
      : {};
  },

  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
};

export function createLogger(
  destination?: pino.DestinationStream,
): pino.Logger {
  return pino(loggerOptions, destination);
}

export const logger = createLogger();
