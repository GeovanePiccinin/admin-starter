# Tasks: Appointment Calendar

**Input**: Design documents from `specs/002-appointment-calendar/`
**Prerequisites**: `plan.md` and `spec.md`

## Phase 1: Setup

- [X] T001 Install the free FullCalendar core, React, timegrid, and daygrid packages at `6.1.22`; update `package.json` and `pnpm-lock.yaml`. Defer the interaction plugin until slot selection is implemented.

## Phase 2: Foundational

No new shared infrastructure is required; reuse the existing Appointment feature, authenticated Server Actions, Prisma models, and React Query setup.

---

## Phase 3: User Story 1 - Consultar agendamentos no calendário (Priority: P1)

**Goal**: Show the authorized appointments overlapping the visible date range, with week as the initial view and day/month views and filters.

**Independent Test**: Navigate weekly, daily, and monthly ranges; verify interval overlap, filters, tenant isolation, and PROFESSIONAL scope.

- [X] T002 [US1] Add standalone range-validation tests in `src/features/appointment/appointment-calendar.test.ts` and repository tests for overlap boundaries, filters, tenant isolation, and professional scope in `src/features/appointment/appointment.test.ts`.
- [X] T003 [US1] Add a Zod calendar query schema with UTC ISO start/end, an exclusive end, existing filters, `from < to`, and a maximum 62-day interval in `src/features/appointment/appointment.query.ts`.
- [X] T004 [US1] Add an unpaginated interval query using `tenantId`, optional professional scope, existing filters, and `startAt < to` plus `endAt > from` in `src/features/appointment/appointment.repository.ts`.
- [X] T005 [US1] Add a calendar Server Action that validates input and derives tenant and professional scope from the authenticated actor in `src/features/appointment/appointment.actions.ts`.
- [X] T006 [US1] Create a FullCalendar client view with week as initial view, day/month controls, existing appointment filters, and loading/error/empty states in `src/features/appointment/appointment-calendar.tsx`.
- [X] T007 [US1] Add a view toggle to the existing Appointment container, keeping the table as the default and sharing search/professional/service/status filters with the calendar in `src/features/appointment/appointment-container.tsx`.
- [ ] T008 [US1] Run the focused Appointment tests, ESLint, TypeScript check, and production build; resolve the missing database tables before closing Stage 1.

**Stage 1 validation note**: Calendar query unit tests, ESLint, TypeScript, and production build pass. The Appointment repository test cannot run because the database selected by Vitest has no `public.clients` or `public.payments` tables; do not apply migrations as part of this UI/query-only stage.

---

## Phase 4: User Story 2 - Criar e inspecionar agendamentos (Priority: P2)

**Goal**: Open the existing Appointment form from a calendar slot with the selected local date/time and inspect an appointment's details.

**Independent Test**: Select a free slot and verify form prefill; select an event and verify its details.

- [X] T009 [US2] Add focused interaction tests for selecting a slot, local-time prefill, and opening appointment details in `src/features/appointment/appointment-calendar.test.tsx`.
- [X] T010 [US2] Pass slot selection into the existing Appointment form with the selected date/time while preserving the table's create/edit behavior in `src/features/appointment/appointment-container.tsx` and `src/features/appointment/appointment-form.tsx`.
- [X] T011 [US2] Add an appointment details interaction for calendar events using the existing appointment fields and accessible dialog patterns in `src/features/appointment/appointment-calendar.tsx`.
- [X] T012 [US2] Run the focused Appointment interaction tests, ESLint, and TypeScript check for Stage 2.

---

## Phase 5: User Story 3 - Atualizar status e iniciar atendimento (Priority: P3)

**Goal**: Change appointment status and start its Attendance from both calendar details and the Appointment table using the existing protected operation.

**Independent Test**: Update each existing status and start Attendance from both entry points; confirm canceled appointments are rejected and an appointment cannot get duplicate attendances.

- [X] T013 [US3] Cover status changes and attendance initiation in calendar interaction tests; reuse the existing Attendance repository tests for canceled appointments, duplicates, and professional scope.
- [X] T014 [US3] Add a status selector to appointment details using existing enum values and the existing update operation in `src/features/appointment/appointment-calendar.tsx`.
- [X] T015 [US3] Expose one reusable start-attendance action in calendar details and the Appointment table, using the existing Attendance Server Action and refreshing appointment/attendance queries in `src/features/appointment/appointment-calendar.tsx` and `src/features/appointment/appointment-container.tsx`.
- [X] T016 [US3] Handle an existing Attendance without creating a duplicate and provide navigation to the existing Attendance experience in `src/features/appointment/appointment-container.tsx`.
- [ ] T017 [US3] Run focused Appointment and Attendance tests, ESLint, TypeScript check, and production build for Stage 3.

**Stage 3 validation note**: Calendar interaction tests (7), targeted ESLint, TypeScript check, and production build pass. Appointment and Attendance repository suites could not run because the configured database is missing `public.payments`; no schema changes are part of this stage, so migrations were not applied.

---

## Dependencies & Execution Order

- T001 precedes calendar UI work.
- User Story 1 (T002-T008) is the MVP and is the only story implemented in this iteration.
- User Story 2 (T009-T012) depends on the calendar from User Story 1.
- User Story 3 (T013-T017) depends on appointment details from User Story 2 and the existing Attendance operation.
- Within each story, complete tests and server-side validation before UI integration. The repository query and the client view can be developed independently after their shared query shape is defined.

## Implementation Strategy

Deliver the stages incrementally: first the read-only calendar with bounded, authorized queries and filters; next slot creation/details; finally status updates and Attendance initiation. Keep the existing table as the default throughout. Do not start a later phase until the current phase's tests and checks pass.
