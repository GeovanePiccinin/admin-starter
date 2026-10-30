# Feature Specification: Dedicated Attendance Workspace

**Feature Branch**: `003-attendance-interface`
**Created**: 2026-10-28
**Status**: Draft
**Input**: Dedicated attendance screen with details, client history and records.

## User Scenarios & Testing

### User Story 1 - Work in an attendance workspace (Priority: P1)

An authenticated administrator or professional opens an attendance and sees its details, the client's prior attendances, and the client's records in separate tabs.

**Why this priority**: This is the core workflow for professionals to consult the context needed while handling an attendance.

**Independent Test**: Open an authorized attendance and verify its details, client history, and client records are available in the three tabs.

**Acceptance Scenarios**:

1. **Given** an attendance visible to the authenticated user, **When** its dedicated page opens, **Then** the attendance, appointment, client, professional, service, and current status details are shown.
2. **Given** the attendance has a client, **When** the user opens History, **Then** only that client's other attendances are listed and each item can be expanded and collapsed.
3. **Given** the client has records, **When** the user opens Records, **Then** only that client's records are listed and each content can be expanded and collapsed without edit or delete controls.
4. **Given** an attendance was just created from the Appointment calendar or table, **When** creation succeeds, **Then** the user is taken to that attendance's dedicated page.

### User Story 2 - Handle unavailable or unauthorized attendance (Priority: P2)

An authenticated user receives a clear not-found experience if the attendance does not exist or is outside their tenant or professional scope.

**Independent Test**: Request a missing, foreign-tenant, or out-of-scope attendance ID and verify no attendance, history, or records are exposed.

**Acceptance Scenarios**:

1. **Given** an unknown or unauthorized attendance ID, **When** the user opens its page, **Then** no workspace data is returned and a not-found state is shown.
2. **Given** the workspace query fails, **When** the page loads, **Then** an explicit error state and retry action are available.

### Edge Cases

- The attendance exists but has no prior attendances or client records: show an empty state within the relevant tab.
- The current attendance is excluded from History even when it is the client's only attendance.
- A professional can access only attendances assigned to their own professional profile.
- A record associated with another client's attendance must not appear in the current client's history or records.

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide an authenticated dedicated page addressable by attendance ID.
- **FR-002**: The page MUST present Attendance, History, and Records tabs.
- **FR-003**: Attendance MUST show the current attendance, its appointment, client, professional, service, status, timestamps, and notes when present.
- **FR-004**: History MUST list the same client's attendances except the current one; each history item MUST be expandable and collapsible to reveal its available details.
- **FR-005**: Records MUST list only ClientRecords belonging to the attendance's client; each record MUST be expandable and collapsible to reveal its content.
- **FR-006**: Records in this workspace MUST be read-only; it MUST NOT expose edit or delete actions.
- **FR-007**: Every data query MUST derive tenant scope from the authenticated server session and MUST enforce professional scope for professional users.
- **FR-008**: Unknown and unauthorized IDs MUST NOT disclose whether records exist in another tenant or professional scope.
- **FR-009**: Successful Attendance creation from Appointment entry points MUST navigate to the created attendance workspace; existing attendances MUST navigate to their workspace.
- **FR-010**: Loading, empty, not-found, and query-error states MUST be communicated clearly.

### Key Entities

- **Attendance**: The current work item, uniquely associated with one appointment within a tenant.
- **Appointment**: Supplies schedule, client, professional, and service context.
- **Client**: Determines which prior attendances and records are shown.
- **ClientRecord**: Read-only client content displayed in the workspace.

## Success Criteria

### Measurable Outcomes

- **SC-001**: An authorized user can open any accessible attendance by ID and reach all three tabs without leaving its workspace.
- **SC-002**: In test scenarios, 100% of returned history and records belong to the current attendance's client, and the current attendance is absent from history.
- **SC-003**: In test scenarios, 100% of missing, foreign-tenant, and out-of-scope IDs expose no attendance or related client data.
- **SC-004**: Each history item and record can be expanded and collapsed, and records provide no mutation controls.

## Assumptions

- Existing authenticated roles retain their current attendance permissions; professional users are limited to their assigned profile.
- History is ordered newest appointment first and contains the details available from the Appointment and Attendance models.
- "Records" refers to all ClientRecords for the client, regardless of whether a record is linked to an attendance.
- The existing `/attendances` list remains available; the dedicated workspace is an additional route.
- No schema or business-state changes are required.
