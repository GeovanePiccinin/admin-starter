# Sistema de Agendamento

## Database environments

Development, tests, and production use explicit database configuration. See
[Database environments](./docs/database-environments.md) for setup, scripts,
and reset safeguards.

See [Error handling and observability](./docs/observability.md) for logger,
Server Action error handling, Sentry configuration, and privacy safeguards.

See [Audit log and rate limiting](./docs/audit-and-rate-limiting.md) for
audited operations, rate limits, and migration requirements.

## Getting started

Configure `.env.development` from `.env.development.example`, then run:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to use the application.
