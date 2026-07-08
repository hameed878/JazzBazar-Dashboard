---
name: External DB alongside Replit-managed env vars
description: DATABASE_URL and related PG* names are runtime-reserved even when the app intentionally uses an external Postgres (e.g. Neon) instead of Replit's built-in DB
---

`setEnvVars`/secrets tooling refuses to set `DATABASE_URL` because it's treated as a runtime-managed key (reserved for Replit's own provisioned Postgres), even in projects that never call `createDatabase()` and instead connect to an external database like Neon.

**Why:** The key is reserved platform-wide, not just when a Replit DB actually exists — so it can silently collide with a user-supplied external connection string.

**How to apply:** When a user supplies their own external Postgres/Neon connection string, store it under a distinct secret name (e.g. `NEON_DATABASE_URL`) and reference that name throughout the app's db client, drizzle config, etc. Don't try to reuse `DATABASE_URL` for this purpose.
