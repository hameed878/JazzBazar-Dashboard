---
name: drizzle-kit push fails non-interactively
description: drizzle-kit push can hang/fail when it needs an interactive prompt (e.g. column rename ambiguity); use a direct SQL script instead in this environment.
---

`drizzle-kit push` sometimes needs an interactive yes/no prompt to resolve ambiguous changes (e.g. "is this a rename or a new column?"). In a non-TTY sandbox shell this hangs or fails silently.

**Why:** Hit this while extending `shared/schema.ts` with new tables/columns — `drizzle-kit push` could not proceed non-interactively.

**How to apply:** When `drizzle-kit push` can't run non-interactively, write a small Node script using `pg` and the same connection string env var the app uses, and run the needed `ALTER TABLE` / `CREATE TABLE` statements directly. Verify with a follow-up query listing tables/columns.
