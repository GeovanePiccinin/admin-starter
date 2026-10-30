# Implementation Plan: Dedicated Attendance Workspace

**Branch**: `003-attendance-interface` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

## Summary

Add a tenant- and professional-scoped attendance detail query and an ID-addressable workspace with Attendance, History, and read-only Records tabs. Reuse existing Attendance and ClientRecord models, server authorization conventions, UI feedback, and the Attendance creation action.

## Technical Context

**Language/Version**: TypeScript strict, React, Next.js App Router
**Primary Dependencies**: Prisma, Zod, TanStack Query, existing shadcn/ui components
**Storage**: Existing PostgreSQL schema via Prisma; no schema change
**Testing**: Vitest, Testing Library, existing database-backed repository tests
**Target Platform**: Web application
**Project Type**: Feature within existing Next.js application
**Performance Goals**: Load workspace and related client context in a bounded set of database queries.
**Constraints**: Tenant scope from authenticated session; professional scope enforced server-side; records read-only.
**Scale/Scope**: One attendance, its client's history, and its client records.

## Constitution Check

- Feature-based vertical slice within `attendance`; reuse existing `client-record` model and shared UI.
- No new shared abstractions or ORM layer.
- Validate the ID and derive tenant/professional scope on the server.
- No schema changes; preserve current CRUD and status behavior.
- Add focused repository and UI tests; run lint, typecheck, and build.

**Gate**: PASS. No known constitutional exceptions.

## Project Structure

```text
src/app/(dashboard)/attendances/[id]/page.tsx
src/features/attendance/
├── attendance.actions.ts
├── attendance.query.ts
├── attendance.repository.ts
├── attendance-workspace.tsx
└── attendance.test.ts
src/features/appointment/appointment-container.tsx
```

**Structure Decision**: Extend the existing Attendance feature and route group; keep the list route and its CRUD intact. The appointment container navigates to the new route after starting an attendance.

## Design

- A Zod-validated server operation returns `null` for missing or unauthorized IDs.
- The repository scopes the current attendance by `tenantId` and optional professional ID, then selects the appointment context, prior attendances for the same client excluding the current attendance, and all client records for that client.
- The page uses existing authenticated dashboard routing conventions and a feature client component to handle loading, retryable errors, not-found, tabs, and expandable read-only entries.
- Creating attendance returns its new ID to the existing appointment mutation, which navigates to `/attendances/{id}`. Existing attendance actions navigate to that same route.
- No external contract or database migration is needed.
