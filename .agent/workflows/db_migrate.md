# Workflow: /db-migrate
**Goal**: Safely modify the database schema and update type definitions.

1. **Audit Current State**: Inspect the current schema file (e.g., `schema.prisma` or SQL files).
2. **Draft Change**: Propose the new schema addition in an 'Implementation Plan'.
3. **Safety Check**: Verify that the change does not include "Breaking Changes" (e.g., deleting a column with data) without a migration strategy.
4. **Execute**: Run the migration command in the terminal (e.g., `npx prisma migrate dev`).
5. **Sync Types**: Automatically regenerate TypeScript types or Zod schemas to match the new DB state.
6. **Verify**: Run a small script to verify the connection and the new table/column.
