# Data Model: Dedicated Attendance Workspace

No persisted data changes are required.

- **Attendance**: Scope by `tenantId` and ID; professional users additionally scope through `appointment.professionalId`. Provides status, timestamps, notes, and its appointment.
- **Appointment**: Provides date/time, client, professional, service, and appointment status for the current and historical attendances.
- **Client**: The current appointment's client is the sole source for the history and record collections.
- **ClientRecord**: Query by the same `tenantId` and `clientId`; include records whether or not they are linked to an attendance.

The current attendance is excluded from historical items by ID. Foreign-tenant and out-of-scope records are treated as not found.
