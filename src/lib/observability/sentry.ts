import * as Sentry from "@sentry/nextjs";

import { scrubSentryEvent } from "./sentry-event";

export function initializeSentry(): void {
  const dsn =
    process.env.NEXT_PUBLIC_SENTRY_DSN ??
    (typeof window === "undefined" ? process.env.SENTRY_DSN : undefined);

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    enabled: true,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      mcp: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
      frameContextLines: 0,
    },
    tracesSampleRate: 0,
    environment:
      (typeof window === "undefined"
        ? process.env.APP_ENV
        : process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT) ??
      process.env.NODE_ENV,
    beforeSend: scrubSentryEvent,
  });
}
