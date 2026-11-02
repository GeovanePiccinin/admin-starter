interface SentryEventPayload {
  user?: object;
  request?: object;
  extra?: object;
  breadcrumbs?: unknown[];
  contexts?: object;
  transaction?: string;
  fingerprint?: string[];
  message?: string;
  logentry?: {
    message?: string;
    params?: unknown[];
  };
  tags?: Record<string, unknown>;
  exception?: {
    values?: Array<{
      value?: string | null;
      mechanism?: { data?: object };
    }>;
  };
}

const safeTagKeys = new Set([
  "operation",
  "operation_id",
  "error_category",
  "environment",
]);

export function scrubSentryEvent<T extends SentryEventPayload>(event: T): T {
  delete event.user;
  delete event.request;
  delete event.extra;
  delete event.breadcrumbs;
  delete event.contexts;
  delete event.fingerprint;
  event.message = "Unhandled application error";
  if (event.transaction) {
    event.transaction = "Next.js application error";
  }
  if (event.logentry) {
    event.logentry.message = "Unhandled application error";
    delete event.logentry.params;
  }

  if (event.tags) {
    for (const key of Object.keys(event.tags)) {
      if (!safeTagKeys.has(key)) {
        Reflect.deleteProperty(event.tags, key);
      }
    }
  }

  for (const exception of event.exception?.values ?? []) {
    exception.value = "Unhandled application error";
    if (exception.mechanism) {
      delete exception.mechanism.data;
    }
  }

  return event;
}
