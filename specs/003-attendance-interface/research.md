# Research: Dedicated Attendance Workspace

- **Decision**: Use the existing Attendance and ClientRecord models and a tenant-scoped detail query.
  **Rationale**: The schema already relates Attendance to Appointment and ClientRecord to Client and optionally Attendance. No schema change is needed.
- **Decision**: Enforce professional scope by filtering through the appointment's `professionalId`.
  **Rationale**: Existing Attendance queries and mutations derive the professional ID from the authenticated user and apply this same scope.
- **Decision**: Use an ID-addressable dashboard route and navigate to it after successful attendance creation.
  **Rationale**: Appointment already starts Attendance through the existing protected action; returning the created ID enables direct navigation without adding another operation.
- **Alternatives considered**: A separate generic repository/service layer or a new attendance relation; both duplicate existing infrastructure or schema semantics.
