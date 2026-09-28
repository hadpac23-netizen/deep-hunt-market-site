---
name: hunt-supabase-safety
description: This skill should be used for any HUNT Supabase/Postgres schema, SQL, RLS, function, index, query, timeout, cron, migration, or database-performance task.
---

# HUNT Supabase / Postgres Safety

Treat Postgres as the truth store, not the external-work engine.

Rules:
- Inspect current schema/query state before changes.
- Use bounded queries and indexed predicates.
- Avoid broad JSON/catalog scans and unbounded views.
- Avoid expensive supplier/API work inside Postgres.
- Handle external supplier/image/shipping work in workers/Edge with bounded concurrency, then write short batches.
- Protect RLS and tenant/user boundaries.
- Parameterize SQL and validate input.
- Prefer explicit migrations/checkpoints and reversible changes.
- Do not use destructive schema changes without explicit approval.
- Do not re-enable heavy cron jobs casually.
- Diagnose timeouts with query shape, indexes, locks, connection pressure, and execution plans before increasing resources.

For catalog truth:
- canonical route index and exact product identity must remain consistent.
- batch updates and dedupe must be deterministic.
- never inflate readiness via SQL shortcuts.
