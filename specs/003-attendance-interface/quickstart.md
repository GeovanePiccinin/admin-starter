# Quickstart: Dedicated Attendance Workspace

1. Configure the test database and apply the existing Prisma migrations.
2. Run focused workspace and repository tests:

   ```sh
   pnpm exec vitest run src/features/attendance/attendance-workspace.test.tsx src/features/attendance/attendance.test.ts
   ```

3. Verify quality:

   ```sh
   pnpm exec eslint src/features/attendance src/features/appointment/appointment-container.tsx
   pnpm exec tsc --noEmit
   pnpm run build
   ```

4. Manually create or select an appointment, start its attendance, verify navigation to `/attendances/{id}`, then inspect the three tabs and empty states.
