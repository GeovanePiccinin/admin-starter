# Client Management Validation Guide

## Prerequisites

- Install dependencies using the repository's pinned package manager.
- Configure `DATABASE_URL` for a PostgreSQL database used only for development/testing.
- Apply the existing database migrations before running database-backed feature tests.
- Authenticate as a user with either `ADMIN` or `PROFESSIONAL` role and an associated
  tenant.

## Automated checks

Run the focused feature test after implementation:

```powershell
pnpm test:run -- src/features/client/client.test.ts
```

Then run static checks and a production build:

```powershell
pnpm lint
pnpm build
```

Expected: feature tests pass; lint reports no errors; build completes successfully.
Database-backed tests require the test database to be reachable.

## End-to-end scenarios

1. Create clients for two tenants. Sign in as ADMIN in tenant A and verify list, search,
   sort, pagination, edit, and delete only expose tenant A's records.
2. Repeat access as PROFESSIONAL in tenant A; verify the same CRUD permissions.
3. In one browser session, sign in to tenant A, then switch to a user in tenant B. Verify
   tenant A's cached Client rows are not shown under tenant B.
4. Submit an empty name, malformed email, and valid name without optional contact values.
   Verify invalid input is rejected and the optional values are accepted as absent.
5. Attempt to edit and delete a tenant B client while signed in to tenant A. Verify no
   foreign record is read, changed, or removed.
6. Attempt to delete a client referenced by an appointment or ficha. Verify the operation
   reports failure and preserves both the client and dependent records.
7. Search for a non-existent contact value and inspect the empty-search state; clear the
   search and inspect the no-clients state in a tenant without clients.
8. With up to 1,000 clients in one tenant, run at least 20 representative searches under
   normal local test conditions. Verify at least 95% complete within 2 seconds (SC-001).

## Expected UI behavior

The Clients navigation link opens the dashboard list. The initial page contains at most
10 rows, and sorting/search changes begin at page one. Successful mutations update the list
without a manual browser reload. See [the application contract](contracts/client-management.md)
and [the data model](data-model.md) for boundaries and record fields.
