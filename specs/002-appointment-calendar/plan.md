# Implementation Plan: Appointment Calendar

**Branch**: `002-appointment-calendar` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

## Summary

Add a calendar view alongside the existing Appointment table. Keep Appointment queries and authorization in the current feature slice, add a bounded interval query using the existing models, and render it with FullCalendar. Stages 1 and 2 provide calendar consultation, slot-prefilled appointment creation, and details; status changes and starting Attendance remain for Stage 3.

## Technical Context

- **Stack**: Next.js 16 App Router, React 19, TypeScript strict, Prisma 7/PostgreSQL, Zod 4, TanStack Query, Vitest.
- **Calendar**: use the free FullCalendar React packages at `6.1.22` (`core`, `react`, `timegrid`, `daygrid`, `interaction`). Registry metadata confirms the React package peers include React/React DOM 19 and core `~6.1.22`; use it only in a client component. No Premium package.
- **Storage**: existing Appointment, Attendance, Tenant, and Professional schema; no schema change or migration.
- **Data/query**: validate UTC ISO interval and filters with Zod; require `from < to` and a maximum 62-day span; query tenant-scoped appointments whose times overlap the interval (`startAt < to`, `endAt > from`), then apply existing professional, service, status, and search filters.
- **Timezone**: the calendar displays browser-local time; send interval instants as UTC ISO strings and convert event instants through the calendar library.
- **Tests**: extend Appointment feature tests for interval validation, overlap boundaries, filters, and tenant/professional scoping; run focused tests, lint, TypeScript, and build.
- **Scope**: Stage 1 includes a weekly-first calendar with day/month views and filters, while the existing table remains available and its current behavior stays the default.

## Constitution Check

| Principle | Plan compliance |
|---|---|
| Feature slices | Calendar query and UI stay in `src/features/appointment`; the existing App Router page continues to host the feature. |
| Simplicity | No new domain layer, schema, shared abstraction, or external API. |
| Stack and validation | Use existing strict TypeScript, Zod, Server Action, and TanStack Query patterns; no `any`. |
| Persistence | Reuse Prisma models directly; no migration. |
| Reuse | Reuse Appointment filter options and existing list controls where appropriate; keep calendar-specific rendering in the feature. |
| Security | Resolve tenant and role from the authenticated server session; scope every query and constrain PROFESSIONAL to their profile. |
| Tests and reliability | Cover interval bounds and scope; show loading, empty, and error states; run relevant quality checks. |
| Incremental evolution | Keep the table as the default and implement only calendar viewing in this change. |

**Gate result**: PASS.

## Design Decisions

- The existing `Appointment` model already contains the event data and optional unique Attendance relation. No new entity or external contract is needed.
- The calendar uses an interval-specific query, rather than paginating through the CRUD list; filters follow the existing list semantics.
- The server action derives tenant and professional scope using the existing Appointment actor pattern. The browser never supplies tenant identity.
- Status values remain the existing Prisma enum values. Existing code validates enum membership but defines no stricter transition graph; Stage 1 does not change statuses.
- Separate research, data-model, contract, and quickstart documents are omitted: the implementation uses existing models and internal Server Actions, and the required decisions and verification are captured here and in `tasks.md`.

## Project Structure

```text
src/
├── app/(dashboard)/appointments/page.tsx
└── features/appointment/
    ├── appointment.actions.ts
    ├── appointment-calendar.tsx
    ├── appointment-container.tsx
    ├── appointment.query.ts
    ├── appointment.repository.ts
    └── appointment.test.ts
```

Stage 1 should preserve `/appointments` and the table; add a view toggle, with the calendar itself opening in week view. Calendar interval and active filters participate in the TanStack Query key.

## Implementation Order

1. Add the calendar interval Zod query and tenant-scoped repository/action.
2. Add the FullCalendar view and integrate it with existing Appointment filters and the table toggle.
3. Add focused tests for interval validation, overlap inclusion/exclusion, filters, and scope; run focused tests, lint, TypeScript, and build.
4. Slot selection and appointment details are implemented in Stage 2. Leave status updates and Attendance initiation for the next request.

## Complexity Tracking

No constitution violations or additional architectural complexity.
