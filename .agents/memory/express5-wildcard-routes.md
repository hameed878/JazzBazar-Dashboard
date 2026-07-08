---
name: Express 5 wildcard routes
description: Bare "*" catch-all route paths crash Express 5 apps at startup (path-to-regexp v8 change)
---

Express 5 upgraded `path-to-regexp` to a version that no longer accepts a bare `"*"` as a route path. Registering `app.use("*", handler)` throws `PathError: Missing parameter name at index 1: *` and crashes the process before it can listen.

**Why:** `path-to-regexp` v7/v8 requires named wildcard parameters instead of the old bare splat syntax.

**How to apply:** When writing catch-all middleware/routes (e.g. SPA fallback to `index.html`, Vite dev-middleware fallback) on Express 5, use `"/*splat"` (a named wildcard) instead of `"*"`. Applies anywhere a bare `*` or `/*` path string is passed to `app.get/use/all`.
