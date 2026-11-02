# Database environments

The project selects database configuration explicitly; do not rely on `.env`
for a Prisma or application command.

## Development

1. Create a local PostgreSQL database named `sistema_agendamento_dev`.
2. Copy `.env.development.example` to `.env.development`.
3. Set `DATABASE_URL` to that local database and configure local-only demo
   passwords.
4. Run `pnpm dev`, `pnpm db:migrate:development`, or
   `pnpm db:seed:development`.

The development URL must use loopback and a database name ending in `_dev` or
`_development`.

## Tests

1. Create a dedicated local PostgreSQL database named
   `sistema_agendamento_test`.
2. Copy `.env.test.example` to `.env.test`.
3. Set `DATABASE_URL` and `TEST_DATABASE_URL` to the same loopback database.
4. Run tests with `pnpm test:run`; run additive migrations with
   `pnpm db:migrate:test`.

The Vitest config and command runner validate the test URL, reject a target
matching `.env` or `.env.development`, and remove inherited PostgreSQL
connection overrides (including settings loaded by Next.js before Prisma
starts). Missing or conflicting test configuration aborts before tests run.

`pnpm db:reset:test` is destructive and resets every record in the validated
test database before applying migrations and running the demo seed. It requires
the exact explicit approval to be supplied for that invocation:

```powershell
$env:PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION = "pode executar o plano"
pnpm db:reset:test
Remove-Item Env:PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION
```

Do not use the test database for development data.

## Production

The deployment environment must provide `DATABASE_URL`; production commands
never select a local database URL. Next.js may load local env files for other
settings, but the deployment-provided `DATABASE_URL` is passed as a process
variable and takes precedence. Use `pnpm build`, `pnpm start`, and
`pnpm db:migrate:production` only in the deployment environment.

Demo seeding is blocked in production. Never use reset commands against
production.

## Other commands

- `pnpm db:generate` generates Prisma Client from the schema without connecting
  to a database.
- `pnpm db:check:development` and `pnpm db:check:test` validate and report the
  live database target without writing.
- `.env` is not a source of database configuration for project scripts.
