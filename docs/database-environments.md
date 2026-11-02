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
`pnpm db:check:production`, `pnpm db:migrate:production`, and
`pnpm db:seed:production` only in the deployment environment. Run
`pnpm db:check:production` first and confirm its reported host, database, and
schema before any write.

Demo seeding is disabled in production by default. It creates a demo tenant,
accounts, and sample business records. To explicitly run it in a production
environment, set `ALLOW_DEMO_SEED_IN_PRODUCTION=true` and provide distinct
`DEMO_ADMIN_PASSWORD` and `DEMO_PROFESSIONAL_PASSWORD` values of at least 16
characters, then run `pnpm db:seed:production`. The seed refuses to overwrite
conflicting accounts and is limited to its fixed demo IDs, but it may update
existing records with those IDs in the demo tenant. Never reuse these
credentials for real accounts. Never use reset commands against production.

The migration `20261104130000_backfill_client_professional_assignments` creates
assignments for existing client-professional pairs evidenced by appointments.
Clients without appointments remain unassigned and must be explicitly assigned
by an administrator; the migration does not infer a relationship for them.

## Other commands

- `pnpm db:generate` generates Prisma Client from the schema without connecting
  to a database.
- `pnpm db:check:development` and `pnpm db:check:test` validate and report the
  live database target without writing.
- `.env` is not a source of database configuration for project scripts.
