# Research: Client Management

## Decision: Keep the existing Client data model

**Rationale**: The current Prisma schema already defines Client with `id`, `tenantId`,
`name`, optional `email` and `phone`, and timestamps. Tenant isolation and indexes are
already present. No new data fields or relationships are in scope.

**Alternatives considered**: Add feature-specific schema fields or relationships. Rejected
because they are not required by the feature and relationships are explicitly out of scope.

## Decision: Do not create a database migration

**Rationale**: This feature adds CRUD behavior for an existing model and does not alter the
Prisma schema. A migration would be unnecessary. Existing references from appointments and
fichas use restrictive deletion behavior, so a client with dependent records must remain
undeleted and receive an understandable failure response.

**Alternatives considered**: Cascade deletion or soft-delete/schema changes. Rejected because
they would change existing data lifecycle behavior and exceed the requested scope.

## Decision: Mirror the established Service CRUD slice

**Rationale**: `architecture.md` identifies Service as the CRUD reference. Keep route,
feature-local validation/query/actions/persistence/UI, and tests together. Use the existing
generic DataTable, server-side list controls, CRUD dialogs, form and feedback components.

**Alternatives considered**: Create a shared CRUD framework, a second table, or a generic
repository layer. Rejected because the project already has the needed reusable components
and the constitution disallows abstractions without concrete benefit.

## Decision: Authorize from the server session on every operation

**Rationale**: The session is the trusted source for both the tenant and the authenticated
role. Both ADMIN and PROFESSIONAL may use all CRUD operations, as recorded in the
clarification. Query and mutation predicates must include the session tenant so a forged
record identifier or tenant value cannot cross organization boundaries.

**Alternatives considered**: Accept tenant context from the browser or rely on the dashboard
layout alone. Rejected because neither is an authorization boundary for server operations.

**Sources**: [Next.js Data Security: Authentication and Authorization](https://nextjs.org/docs/app/guides/data-security#authentication-and-authorization);
[Next.js Authentication: Authorization](https://nextjs.org/docs/app/guides/authentication#authorization).

## Decision: Search, sorting, and pagination remain server-side

**Rationale**: Match the Service list flow: validate query input, allow only known sort
fields, filter by tenant, and apply search, ordering, and pagination in the database.
Return rows and total count for the shared manually paginated DataTable. Reset to page one
when search or sort changes.

**Alternatives considered**: Load all tenant clients and filter/page in the browser.
Rejected because it does not scale with the specified 1,000-client search target and differs
from the existing CRUD pattern.

## Decision: Make offset pages deterministic and follow the existing cache pattern

**Rationale**: Use a stable unique tie-breaker (client ID) after the selected sort field so
equal or null contact values do not make rows unpredictably move between pages. Include all
query variables in the TanStack Query key, matching the existing Service list. Every server
action independently re-reads and authorizes the session and tenant; the cache is not an
authorization boundary.

**Alternatives considered**: Rely on non-unique sort values alone or introduce a
feature-specific identity cache discriminator. The former can make page membership
fluctuate; the latter has no precedent in the existing Service flow and does not replace
server-side authorization.

**Sources**: [Prisma pagination](https://www.prisma.io/docs/orm/v7/prisma-client/queries/pagination);
[PostgreSQL LIMIT/OFFSET](https://www.postgresql.org/docs/current/queries-limit.html);
[TanStack Query query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys).
The project's TanStack Table dependency is v9; use its existing DataTable implementation as
the API reference rather than copying option names from v8 documentation.

## Decision: Keep business validation in feature-local Zod schemas

**Rationale**: Validate and normalize name, optional email, optional phone, list parameters,
and mutation identifiers at the server boundary, reusing the existing Zod conventions.
Enforce required name and valid email as specified. Do not add uniqueness constraints that
are absent from the requirements and current Client model.

**Alternatives considered**: Rely only on browser form validation or impose uniqueness on
email/phone. Rejected because browser validation is bypassable and uniqueness was explicitly
not established as a requirement.

## Decision: Translate only the expected foreign-key delete failure

**Rationale**: Keep the database Restrict relation as the final guard, including against
concurrent inserts. Map Prisma's known foreign-key failure to a clear deletion-blocked
message; preserve explicit logging and rethrow/unhandled reporting for other failures rather
than hiding them or returning a success-shaped result.

**Alternatives considered**: Cascade delete or pre-checking relations as the only protection.
Rejected because cascade changes data lifecycle and a pre-check alone is vulnerable to races.

**Sources**: [Prisma referential actions](https://www.prisma.io/docs/orm/v7/prisma-schema/data-model/relations/referential-actions);
[Prisma error reference](https://www.prisma.io/docs/orm/v7/reference/error-reference#error-codes).
The expected foreign-key failure is Prisma code `P2003`.

## Decision: Keep external contract at the application UI boundary

**Rationale**: The application exposes an authenticated user-facing dashboard, not a public
Client REST API. Document the form/list/action behavior as an internal application contract;
no public endpoint or versioned API is added.

**Alternatives considered**: Create a new HTTP API. Rejected because the existing CRUD
pattern uses server actions and there is no external integration requirement.

## Repository evidence

- `architecture.md` documents the feature slice, DataTable API, authentication, tenant
  scoping, validation, and test conventions.
- `src/features/service/` provides the current CRUD example, including Zod schemas, server
  actions, tenant-scoped Prisma operations, paginated queries, feedback and Vitest tests.
- `src/components/data-table/data-table.tsx` supports typed columns, manual sorting and
  pagination.
- `prisma/schema.prisma` already declares Client and restrictive relations to appointments
  and fichas.
- `package.json` and `vitest.config.ts` provide the installed application and test commands.
- The existing `(tenantId, name)` B-tree index may not accelerate substring matching; assess
  the 1,000-client search target before proposing a specialized index and migration.
