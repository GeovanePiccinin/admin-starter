# Implementation Plan: Client Management

**Branch**: `001-client-management` | **Date**: 2026-10-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-client-management/spec.md`

## Summary

Deliver the Client CRUD using the existing feature-oriented structure and the Service CRUD
as the implementation reference. Reuse the shared DataTable, search input, list-controls
hook, CRUD dialogs, form field, and feedback states. Obtain tenant ID from the authenticated
server session for every protected operation and apply tenant scope to every database
operation. As in Service, require a valid authenticated session with tenant context;
ADMIN and PROFESSIONAL have the same access, with no feature-specific role distinction.
The current Prisma schema already includes Client and its relations, so this feature is not
expected to require a schema change or migration.

## Technical Context

**Language/Version**: TypeScript 5, strict mode; React 19

**Primary Dependencies**: Next.js App Router 16, NextAuth session, Prisma 7, Zod 4,
TanStack Query 5, TanStack Table 9, React Hook Form, Vitest

**Storage**: PostgreSQL through the existing Prisma Client and adapter

**Testing**: Vitest feature tests following `service.test.ts` for schema validation and
Prisma-backed CRUD/list behavior, including tenant isolation and restrictive deletion;
ESLint and production build as applicable

**Target Platform**: Existing Next.js web application

**Project Type**: Full-stack web application

**Performance Goals**: Meet SC-001: at least 95% of searches return matching results within
2 seconds for up to 1,000 clients in one tenant under normal operating conditions.

**Constraints**: Preserve the established Service CRUD interaction patterns; use the shared
generic DataTable; no `any`; validate external inputs with Zod; no client-supplied tenant
context; no unrelated schema, feature, or shared-component changes.

**Scale/Scope**: One tenant-scoped Client list with server-side search, sorting, and
pagination, plus create, update, and delete. Initial page size is 10. No appointment,
professional, or service relationship workflows.

## Constitution Check

| Principle | Plan compliance |
|---|---|
| Feature-based architecture | Client behavior remains in `src/features/client`; the dashboard route only hosts the feature container. |
| Architectural simplicity | Follow the existing CRUD slice and use only shared components already present; no new generic layer or repository abstraction. |
| Stack and typing | Use the installed Next.js, React, strict TypeScript, and Zod conventions; do not use `any`. |
| Persistence | Use the existing Prisma Client and PostgreSQL schema. No schema edit or migration is planned because Client fields and tenant relationship already exist. |
| Conscious reuse | Reuse DataTable, `useListControls`, search, dialogs, form field, and feedback components; keep Client rules local to its feature. |
| Security | Every server operation authenticates from the server session and derives tenant ID there; every read/write scopes by that tenant. ADMIN and PROFESSIONAL have equal CRUD access as clarified in the spec. |
| Quality and tests | Add schema and database behavior coverage, including tenant isolation, pagination/search, and deletion restriction; run focused tests, lint, and build as appropriate. |
| Enterprise requirements | Preserve operation logging patterns and report errors explicitly; do not introduce extra observability mechanisms without a requirement. |
| Incremental evolution | Limit changes to the Client route/feature; preserve the existing Clients navigation entry, Services, and other behavior. |

**Gate result**: PASS. No constitutional exception or additional complexity is proposed.

## Project Structure

### Documentation (this feature)

```text
specs/001-client-management/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── client-management.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   └── (dashboard)/
│       └── clients/
│           └── page.tsx
├── features/
│   └── client/
│       ├── client-container.tsx
│       ├── client-form.tsx
│       ├── client.actions.ts
│       ├── client.query.ts
│       ├── client.repository.ts
│       ├── client.schema.ts
│       └── client.test.ts
```

The navigation configuration already contains the Clients link to `/clients`; no navigation
file change is planned. Reuse existing shared components without changing their APIs.
Use the established Service query-cache pattern: include search, page, page size, sort field,
and sort direction in the feature query key, then invalidate the feature key after successful
mutations. Each server action independently resolves the authenticated session and tenant;
the cache is not an authorization boundary.
The exact set of feature files may be reduced if implementation does not need a separate
module, consistent with the architecture document.

**Structure Decision**: Single Next.js application using the existing feature-based vertical
slice and App Router dashboard grouping. Client persistence stays inside the Client feature
and uses Prisma directly, following the established Service pattern.

## Complexity Tracking

No constitution violations or added architectural complexity.
