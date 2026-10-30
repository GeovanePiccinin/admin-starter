# Tasks: Dedicated Attendance Workspace

**Input**: Design documents from `specs/003-attendance-interface/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`

## Phase 1: Setup

The existing application already provides Prisma, auth, navigation, and test infrastructure; no setup changes are required.

## Phase 2: Foundational

- [X] T001 Confirm existing dashboard authentication and professional-scope patterns in `src/app/(dashboard)/attendances/page.tsx` and `src/features/attendance/attendance.actions.ts`.

## Phase 3: User Story 1 - Work in an attendance workspace (Priority: P1)

**Goal**: Provide a secure ID-addressable workspace containing current attendance details, client history, and read-only client records.

**Independent Test**: Load a tenant-visible attendance and verify its details, same-client history excluding itself, and same-client records; verify expansion controls and read-only records.

### Tests

- [X] T002 [P] [US1] Add repository tests for attendance lookup by ID, tenant/professional scope, current-item exclusion, and same-client history/records in `src/features/attendance/attendance.test.ts`.
- [X] T003 [P] [US1] Add workspace UI tests for three tabs, expandable history/records, empty state, and absence of record mutation controls in `src/features/attendance/attendance-workspace.test.tsx`.

### Implementation

- [X] T004 [US1] Define the workspace result type and Zod ID query schema in `src/features/attendance/attendance.query.ts`.
- [X] T005 [US1] Implement a tenant- and optional professional-scoped workspace query selecting the appointment context, prior same-client attendances excluding the current attendance, and same-client ClientRecords in `src/features/attendance/attendance.repository.ts`.
- [X] T006 [US1] Add an authenticated workspace Server Action deriving tenant and professional scope from the session and returning no result for missing or unauthorized IDs in `src/features/attendance/attendance.actions.ts`.
- [X] T007 [US1] Create a dedicated workspace client component with Attendance, History, and read-only Records tabs plus loading, not-found, error, and empty states in `src/features/attendance/attendance-workspace.tsx`.
- [X] T008 [US1] Add the ID-addressable dashboard page in `src/app/(dashboard)/attendances/[id]/page.tsx`.

## Phase 4: User Story 2 - Navigate to the attendance workspace (Priority: P2)

**Goal**: Take users directly to the correct workspace after attendance creation and from existing attendance lists.

**Independent Test**: Start an attendance from Appointment and verify navigation uses the created ID; open an existing attendance from its list.

### Implementation

- [X] T009 [US2] Return the created attendance ID from `createAttendanceAction` in `src/features/attendance/attendance.actions.ts` and navigate to `/attendances/{id}` after success in `src/features/appointment/appointment-container.tsx`.
- [X] T010 [US2] Add an action to open each attendance workspace from `src/features/attendance/attendance-container.tsx`.

## Phase 5: Polish and Validation

- [ ] T011 Run focused Attendance and workspace tests, targeted ESLint, TypeScript, and production build; update completed tasks in `specs/003-attendance-interface/tasks.md`.

**Validation note**: Workspace UI tests (2), targeted ESLint, TypeScript check, and production build pass. The Attendance repository test suite could not reach its setup because the configured database lacks `public.clients` (and cleanup reports missing `public.payments`). No schema changes were made; T011 remains pending database synchronization and a successful run of that suite.

## Dependencies & Execution Order

- T001 is a context check and precedes implementation.
- T002/T003 can be written in parallel; T004/T005/T006 establish the data contract and secure query used by T007/T008.
- US2 navigation depends on T006 returning the created attendance ID and the route from US1.
- T011 depends on all implementation and test tasks.

## Implementation Strategy

Deliver US1 first: verify data scoping in repository tests, then add the route and three-tab workspace. Deliver US2 next by connecting existing create/list entry points to the ID route. Finish with focused tests and project checks. No schema migration is expected.
