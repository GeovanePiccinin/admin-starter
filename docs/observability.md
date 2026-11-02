# Error handling and observability

## Structured logs

The server uses Pino. Set `LOG_LEVEL` to a supported Pino level (`fatal`,
`error`, `warn`, `info`, `debug`, `trace`, or `silent`); the default is `info`.
Development logs are formatted for readability, while production logs remain
structured JSON.

Server Actions run through a shared error boundary. Each operation receives an
`operationId`, which is included in logs and in the safe error message shown for
unexpected failures. The authenticated tenant is added to the async operation
context; names, e-mails, phone numbers, clinical content, credentials, cookies,
and tokens are not included in error logs.

Validation, authentication, authorization, and expected domain failures are
handled separately from unexpected infrastructure failures. Only unexpected
failures are reported to Sentry. Client responses for unexpected failures
contain a generic message and the operation reference, not the underlying
exception.

## Sentry

Sentry is optional. When no DSN is configured, SDK initialization and reporting
are disabled.

Configure these variables in the deployment environment:

- `SENTRY_DSN`: server and Edge runtime DSN.
- `NEXT_PUBLIC_SENTRY_DSN`: browser DSN; set it at build time as a Next.js
  public environment variable.
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT`: optional browser environment label. Server
  events use `APP_ENV`, then `NODE_ENV`.

For Vercel, set `SENTRY_DSN` for the server runtime and
`NEXT_PUBLIC_SENTRY_DSN` for the build/runtime that serves browser assets.
Use the project DSN from Sentry; do not commit DSNs or auth tokens. Source-map
upload is not enabled by this configuration.

Sentry is initialized for browser, Node.js, and Edge runtimes. Next.js request
errors and global rendering errors are captured. Automatic user, cookie, HTTP
header/body, query parameter, GraphQL, AI, MCP, database payload, queue, and
stack-variable collection is disabled. The event scrubber removes user, request,
extra, breadcrumb, and arbitrary context data, retaining only exception stack
frames and allowlisted correlation tags. Exception messages are replaced with a
generic value before sending.

## Operational verification

After setting DSNs, deploy a test build and trigger a controlled application
error in a non-production environment. Confirm the event appears with its
environment and `operation_id`/`operation` tags and without request payload,
user identity, or exception message. Do not trigger test errors against real
users or production data.
