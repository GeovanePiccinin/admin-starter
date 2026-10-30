# Tasks: Client Management

**Input**: Design documents from `/specs/001-client-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/client-management.md,
quickstart.md

**Tests**: Include feature tests for schema and Prisma-backed behavior, as required by the
project constitution and the plan's quality criteria. Follow the existing Vitest pattern in
`src/features/service/service.test.ts`.

**Organization**: Tasks are grouped by the user stories in `spec.md`. Shared tenant resolution
is foundational; list, create/update, and delete behavior are delivered in their respective
story phases.

## Phase 1: Setup

**Purpose**: Confirm the existing persistence model is sufficient; no project bootstrap or
new database infrastructure is required.

- [X] T001 Confirm the existing `Client` fields, tenant index, and restrictive relations in `prisma/schema.prisma`; do not modify the schema or create a migration for this feature.

## Phase 2: Foundational

**Purpose**: Establish the server-side tenant context required by all protected Client
operations. Complete before the user-story actions.

- [X] T002 Implement a feature-local authenticated tenant resolver using `auth()` and the session `tenantId` in `src/features/client/client.actions.ts`; reject sessions without a tenant and do not accept tenant context from action input.

**Checkpoint**: Tenant context is derived on the server and ready for all Client operations.

## Phase 3: User Story 1 - Encontrar clientes (Priority: P1) 🎯 MVP

**Goal**: Allow authenticated users to list, search, sort, and paginate only clients in their
own tenant, with clear loading, error, and empty states.

**Independent Test**: Seed clients in two tenants and confirm the signed-in user's list,
search, sort, and page navigation show only records from that user's tenant; verify empty
search and empty-list feedback.

### Tests for User Story 1

- [X] T003 [US1] Add list-query schema tests for trimmed search up to 100 characters, positive page, page-size default 10/cap 100, allowed sort fields, and asc/desc direction in `src/features/client/client.test.ts`.
- [X] T004 [US1] Add repository tests for partial case-insensitive search across name/email/phone, tenant isolation, total/page metadata, sorting, and deterministic page results in `src/features/client/client.test.ts`.

### Implementation for User Story 1

- [X] T005 [P] [US1] Define the list-query schema, allowlisted sort fields, and `ClientListItem`/`ClientListResult` types in `src/features/client/client.query.ts` after T003 and T004 fail as expected.
- [X] T006 [US1] Implement Prisma list/count queries in `src/features/client/client.repository.ts`, depending on T005; filter both list and count by `tenantId`, match name/email/phone, order by the validated sort field plus unique `id`, and apply server pagination.
- [X] T007 [US1] Add the authenticated `getClients` server action in `src/features/client/client.actions.ts`, depending on T002 and T006; parse input with the list schema and pass only the session-derived tenant to the repository.
- [X] T008 [US1] Build the typed client list container in `src/features/client/client-container.tsx`, depending on T007, using `useListControls`, the existing DataTable, SearchInput, DataTableSkeleton, EmptyState, and ErrorState; include every search/page/page-size/sort value in the React Query key and preserve separate loading, refresh, error, and empty states.
- [X] T009 [P] [US1] Add the Clients dashboard page in `src/app/(dashboard)/clients/page.tsx`, following the existing Services page pattern; use the Clients navigation entry already present in `src/config/navigation.ts` without changing it.

**Checkpoint**: User Story 1 list/search/sort/pagination is testable for authenticated tenants. The empty-list registration action is completed with the create flow in User Story 2.

## Phase 4: User Story 2 - Cadastrar e atualizar clientes (Priority: P1)

**Goal**: Create and edit a client's name and optional contact details, scoped to the current
tenant, with validation and mutation feedback.

**Independent Test**: As either ADMIN or PROFESSIONAL, create clients with and without optional
contact details, edit a tenant-owned client, reject invalid input, and confirm another
tenant's client cannot be changed.

### Tests for User Story 2

- [X] T010 [US2] Add create/update schema tests for required trimmed name, optional email/phone, malformed email rejection, and non-empty update ID in `src/features/client/client.test.ts`.
- [X] T011 [US2] Add Prisma-backed create/update tests verifying session-tenant scoping at the repository boundary, valid field persistence, and no modification when an ID belongs to another tenant in `src/features/client/client.test.ts`.

### Implementation for User Story 2

- [X] T012 [US2] Add create/update Zod schemas and inferred input/output types in `src/features/client/client.schema.ts`, depending on T010 and T011; require trimmed `name`, allow optional valid `email` and optional text `phone`, and require a non-empty update `id`.
- [X] T013 [US2] Implement `createClient` and `updateClient` in `src/features/client/client.repository.ts`, depending on T012; inject `tenantId` on create and scope update by both `id` and `tenantId`, reporting a non-matching update without exposing foreign-tenant data.
- [X] T014 [US2] Add `createClientAction` and `updateClientAction` in `src/features/client/client.actions.ts`, depending on T002 and T013; derive tenant with the foundational resolver, parse untrusted input with Zod, log operations using the Service action pattern, and rethrow logged failures.
- [X] T015 [P] [US2] Implement the client form in `src/features/client/client-form.tsx`, depending on T012; use React Hook Form, `zodResolver`, existing `TextFormField` and Button components, optional email/phone inputs, field errors, pending state, and cancel/save controls.
- [X] T016 [US2] Integrate create/edit dialogs and mutations in `src/features/client/client-container.tsx`, depending on T008, T014, and T015; provide a create action in the empty-list state, invalidate the `clients` query after successful writes, show success/error toasts, and prevent closing a pending form.

**Checkpoint**: User Stories 1 and 2 work together; create and edit update the visible list without a manual reload.

## Phase 5: User Story 3 - Excluir clientes (Priority: P2)

**Goal**: Allow confirmed deletion of a tenant-owned client while preserving clients and
dependent data when existing relations restrict deletion.

**Independent Test**: Cancel one deletion and verify no change; confirm deletion of an
unreferenced client; attempt to delete clients referenced by Appointment or Ficha and verify
the data remains and the user sees a clear failure.

### Tests for User Story 3

- [X] T017 [US3] Add Prisma-backed delete tests for successful deletion, generic not-found failure with no success result for absent or foreign-tenant IDs, and preservation of clients referenced by Appointment or Ficha in `src/features/client/client.test.ts`.

### Implementation for User Story 3

- [X] T018 [US3] Add a non-empty ID delete schema in `src/features/client/client.schema.ts` after T017 fails as expected.
- [X] T019 [US3] Implement tenant-scoped `deleteClient` in `src/features/client/client.repository.ts`, depending on T018; check the `deleteMany` count and throw a generic not-found error when it is zero, matching `service.repository.ts` without revealing foreign-tenant records; preserve database Restrict behavior and translate only Prisma's known foreign-key constraint failure into a deletion-blocked error.
- [X] T020 [US3] Add `deleteClientAction` in `src/features/client/client.actions.ts`, depending on T002 and T019; derive tenant from session, validate ID with Zod, log success/failure, and rethrow unexpected errors.
- [X] T021 [US3] Integrate row delete action and existing CrudConfirmDialog in `src/features/client/client-container.tsx`, depending on T008 and T020; on success invalidate the clients query, show feedback, and return to the previous page when deleting its final row.

**Checkpoint**: All three stories satisfy their acceptance scenarios without cascading deletion or managing relationships.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify the feature against the documented acceptance criteria and repository checks.

- [X] T022 Verify all list and mutation paths derive tenant from the session and all Prisma filters include tenant scope in `src/features/client/client.actions.ts` and `src/features/client/client.repository.ts`.
- [ ] T023 Run the focused feature tests, ESLint, and production build using the commands documented in `specs/001-client-management/quickstart.md`.
- [ ] T024 Measure at least 20 representative searches against up to 1,000 tenant clients and verify at least 95% complete within 2 seconds; only propose an index/migration if measurements show the existing schema cannot meet SC-001, documenting results in `specs/001-client-management/quickstart.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Confirms the existing model and deletion constraints; no schema setup
  or migration is required.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user-story server actions.
- **User Stories (Phase 3+)**: Depend on the foundational tenant resolver. The create/edit
  and delete stories extend the list container and action/repository modules.
- **Polish (Phase 6)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Starts after the foundational resolver. Delivers the list and is
  the MVP. Its empty state is completed with the registration entry point in User Story 2.
- **User Story 2 (P1)**: Depends on User Story 1's container, list query, repository, and
  dashboard route so create/edit feedback can update the existing list. Independent as a
  complete CRUD increment after User Story 1.
- **User Story 3 (P2)**: Depends on User Story 1's list. Deletion does not depend on the
  create/edit business flow, though the shared container file must be edited sequentially.

### Within Each User Story

- Add the story's focused tests before its implementation tasks.
- Keep each change within the feature files already identified in `plan.md`.
- Do not introduce a migration unless measured performance or a newly confirmed requirement
  demonstrates a schema change is necessary.

### Parallel Opportunities

- Complete setup verification T001 before the foundational resolver T002.
- In User Story 1, T003 and T004 both modify `client.test.ts` and must be handled
  sequentially before implementation. Once they pass/fail as expected, T005 and T009 can
  proceed independently in their separate files.
- In User Story 2, T010 and T011 both modify `client.test.ts` and must be handled
  sequentially before implementation. After T012 settles the schema contract, T015 can
  proceed alongside T013 in separate files.
- In User Story 3, T017 must be added before delete implementation; T019 and T020 are
  sequential, followed by integration.
- Do not parallelize tasks that modify the same feature file at the same time.

## Parallel Example: User Story 1

```text
First complete T003 and T004, then run these independent implementation tasks in parallel:
T005: Define list query schema and types in src/features/client/client.query.ts
T009: Add dashboard route in src/app/(dashboard)/clients/page.tsx
```

## Parallel Example: User Story 2

```text
First complete T010 and T011, then complete T012. Afterward these tasks can run in parallel:
T013: Implement create/update repository operations in src/features/client/client.repository.ts
T015: Implement form UI in src/features/client/client-form.tsx
```

## Parallel Example: User Story 3

No safe parallel pair is identified for this story: the deletion tests must precede the
implementation, and its remaining tasks depend on preceding tasks or edit the same feature
files.

## Implementation Strategy

### MVP First (User Story 1)

1. Verify the existing Client model and complete the shared tenant resolver.
2. Implement and test tenant-scoped list/search/sort/pagination.
3. Add the Clients route and validate User Story 1 independently.

### Incremental Delivery

1. Complete User Story 1 and validate tenant isolation and list behavior.
2. Add User Story 2; verify create/edit flows and successful list invalidation.
3. Add User Story 3; verify confirmation, restricted deletion, and page recovery.
4. Run cross-cutting tests, lint, build, and the SC-001 measurement.

## Notes

- `[P]` marks tasks that may run in parallel because they affect different files and have no
  unmet dependencies.
- `[US1]`, `[US2]`, and `[US3]` map directly to the stories in `spec.md`.
- No navigation code, shared component API, Prisma schema, or migration is changed by default.
- Email and phone are not unique; do not add uniqueness constraints without a confirmed
  requirement.
