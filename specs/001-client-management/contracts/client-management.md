# Client Management Application Contract

This is an authenticated dashboard feature using the application's existing Server Action
pattern. It does not add a public HTTP API.

## Authorization

- Every list and mutation operation requires an authenticated session with a tenant ID.
- `ADMIN` and `PROFESSIONAL` roles have equal permission to perform all CRUD operations.
- The server obtains role and tenant from the session for every operation.
- A tenant identifier supplied by the browser is never authoritative.
- Reads, updates, and deletes are constrained by both record ID where applicable and session
  tenant ID. A foreign-tenant record is not returned, changed, or deleted.

## List operation

**Input**: search text, 1-based page, page size, allowlisted sort field, and sort direction.

**Behavior**: validate input; default to page 1, page size 10, name ascending, and empty
search; trim and limit search to 100 characters; match partial text case-insensitively
against name, email, and phone; count and return only records from the session tenant.
Use an allowlist for sort fields and append a unique ID tie-breaker for deterministic pages.

**Output**: page items with `id`, `name`, `email`, and `phone`, plus `total`, `page`,
`pageSize`, and `pageCount`.

**Failure behavior**: invalid query input is rejected; authorization or database failures
must not be represented as an empty successful result.

## Create and update

**Input**: name, optional email, optional phone; update additionally receives a client ID.

**Behavior**: validate fields on the server, persist only within the session tenant, and
return success only after the database operation succeeds.

**Failure behavior**: invalid fields are reported; a missing or foreign-tenant update must
not reveal the existence or data of a record outside the tenant.

## Delete

**Input**: client ID and explicit user confirmation in the interface.

**Behavior**: delete only a client in the session tenant.

**Failure behavior**: cancellation performs no operation. A database restriction caused by
existing appointments or fichas preserves all records and produces a clear failure message.
An absent or foreign-tenant ID is not disclosed as a foreign record. Other errors remain
visible to the user and are logged using the established feature operation logging pattern.

## User interface behavior

- Use the generic DataTable with feature-owned, typed columns and manual server pagination
  and sorting.
- Use the existing list-controls and search components; changing search or sort resets to
  the first page.
- Include list parameters and authenticated-user cache identity in the client query key.
  Cache identity is not trusted for server authorization; each server action resolves the
  session and tenant independently.
- Distinguish initial loading, refresh, empty list, empty search result, and query failure.
- Use the existing CRUD form and confirmation dialogs; show success and failure feedback
  and invalidate the client list query after a successful mutation.
- After deleting the only row on a later page, move back to the previous valid page.
