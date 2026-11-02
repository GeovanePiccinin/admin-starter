# Audit log and rate limiting

Successful create, update, delete, completion, and login operations write
metadata to `audit_logs`: tenant, actor, action, entity, and entity ID. Payloads
are intentionally omitted so personal and clinical data are not copied into
audit history.

Authenticated Server Actions use database-backed fixed-window limits:

- Reads/options: 120 calls per actor, operation, and minute.
- Mutations: 30 calls per actor, operation, and minute.
- Login: 5 attempts per email and, when available, client address per 15 minutes.

Bucket identifiers are HMACs derived from `AUTH_SECRET` (or
`NEXTAUTH_SECRET`), so the database does not store raw login identifiers.
Production requires one of these existing NextAuth secrets.

Before deploying this change, apply the new migration using the project's
production migration procedure. No migration is run automatically by the app.
