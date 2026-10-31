# Plop CRUD generator

Run `pnpm plop`, choose `crud`, then select a Prisma model and confirm the
generated identifiers and Portuguese labels. The generator reads
`prisma/schema.prisma` every time it starts.

The scaffold follows the project's tenant-scoped feature structure and creates:

- schema, server actions, query types, and Prisma repository;
- form, TanStack Query container, and dashboard route;
- a Vitest file covering the generated Zod schema.

Only models with a string `id` marked `@id`, a string `tenantId`, and supported
scalar fields are offered. `Json`, `Bytes`, scalar-list, and password/secret
fields are not generated. Relation fields are omitted, but their scalar
foreign-key fields are included as plain inputs. For models with relationships
or business rules (including appointments and professionals), adapt the form,
repository, and tests to the domain before using the scaffold in production.
The generated test covers validation; add repository tests and fixtures for the
new model.

The route page is created automatically. Add its link to
`src/config/navigation.ts` when it should appear in the dashboard navigation.
Existing files are not overwritten.
