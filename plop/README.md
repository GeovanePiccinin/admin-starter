# Plop CRUD generator

Run `pnpm plop`, choose `crud`, then select a Prisma model and confirm the
generated identifiers and Portuguese labels. The generator reads
`prisma/schema.prisma` every time it starts.

The scaffold follows the project's tenant-scoped feature structure and creates:

- schema, server actions, query types, and Prisma repository;
- form, TanStack Query container, and dashboard route;
- a Vitest file covering the generated Zod schema.

Only models explicitly enabled in `plop/generators/crud-policy.ts` and with a
string `id` marked `@id`, a string `tenantId`, supported scalar fields, and no
tenant-scoped foreign-key scalar fields are offered. `Json`, `Bytes`,
scalar-list, and password/secret fields are not generated. Currently only
`Service` is enabled. `Client` and models with relational access scopes
(appointments, attendances, clinical records, payments, professionals, users,
and audit logs) require feature-specific repositories and are intentionally
excluded until their behavior is implemented and reviewed.

Generated reads use `requireAuthenticatedActor` and scope queries to that
actor's tenant. The service policy permits tenant-scoped reads for both roles
and requires `ADMIN` for writes. The generated interface hides actions the
actor cannot perform; server actions remain authoritative. Add a model to the
policy only after reviewing its approved RBAC and data relationships.

Generated tests cover schema parsing and validation. Add action authorization,
repository isolation, domain-specific tests, and fixtures before using a new
feature in production.

The route page is created automatically. Add its link to
`src/config/navigation.ts` when it should appear in the dashboard navigation.
Existing files are not overwritten.
