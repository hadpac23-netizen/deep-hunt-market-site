# BOOM M24 — Schema Activation Readiness — 2026-09-19

## Objective
Decide whether the M23 durable-event-identity schema/function change is safe enough to request owner approval, without changing the live system.

## Live preflight findings
The connected Supabase project was inspected directly.

For public.analytics_events:
- RLS is enabled.
- Current INSERT policy is "anyone can log their own events".
- That INSERT policy applies to public and currently has WITH CHECK (true).
- anon and authenticated roles currently hold INSERT privilege.
- event_id column is absent.
- UNIQUE(event_id) is absent.
- 4,630 historical analytics rows were previously observed.
- 0 historical rows contain metadata event_id.
- no analytics_events-specific Security Advisor finding was surfaced in the current advisor check.

These facts mean a new canonical event_id column cannot be added safely without also tightening the public INSERT policy.

## Supabase security compatibility
Current Supabase documentation confirms backend secret/service credentials are elevated server-only credentials that bypass RLS and must never be exposed to the browser.

M23 therefore keeps public browser analytics noncanonical and reserves canonical event_id writes for the trusted Edge Function backend path.

## Activation proposal hardening
The M23 SQL proposal now includes:
- transaction boundary
- lock_timeout = 5s
- statement_timeout = 30s
- nullable event_id
- length check
- UNIQUE(event_id)
- removal of the current broad public INSERT policy
- replacement INSERT policy scoped to anon/authenticated
- explicit rejection of top-level or metadata event_id from the public path

The live table currently has only a few thousand rows, but timeout guards remain mandatory so the operation fails closed rather than waiting indefinitely on a production lock.

## Activation sequence after explicit owner approval
1. Keep HUNT_DURABLE_EVENT_IDENTITY_ENABLED=false.
2. Generate the official migration with a compatible Supabase CLI workflow.
3. Review the generated migration against the M23 proposal.
4. Apply schema/policy change.
5. Immediately verify RLS, policy roles, event_id column and UNIQUE constraint.
6. Verify anon/authenticated noncanonical analytics still insert successfully.
7. Verify anon/authenticated canonical event_id insert is rejected.
8. Deploy the compatible hunt-commerce-signal source while the durable flag remains OFF.
9. Verify ordinary signal flow still works.
10. Enable the durable flag.
11. Send the same canonical event_id through two independent requests.
12. Verify exactly one canonical row exists.
13. Only then allow M23 durable_ready and M20 durable_server_dedup to become true.

## Preferred rollback
Operational rollback is preferred:
1. turn the durable feature flag OFF
2. restore the previously verified Edge Function if needed
3. keep the nullable event_id column, UNIQUE constraint and hardened public policy

This preserves any canonical IDs already written and does not reopen public canonical identity injection.

## Full schema rollback
Full rollback is a last resort.

Before dropping event_id:
- durable writer must be disabled
- owner must explicitly approve potential event-identity loss
- any durable production event IDs must be retained/exported if they matter for measurement evidence

The review-only rollback SQL lives at:
docs/BOOM-M24-SCHEMA-ACTIVATION-ROLLBACK.sql

## Advisor scope
The project has broader advisor findings unrelated to analytics_events. M24 does not claim the entire Supabase project is security-clean; it records only that the current advisor pass did not surface a table-specific analytics_events finding.

## Activation outcome
The owner approved activation after this preflight. The M23 schema migration and compatible Edge Function were then activated and verified.

Applied:
- 20260919133622_add_durable_event_identity
- 20260919134205_enable_durable_event_identity_runtime
- hunt-commerce-signal v11

Post-activation verification passed:
- RLS remained enabled
- public canonical event_id injection was blocked
- legacy noncanonical signals remained compatible
- duplicate canonical event_id produced exactly one database row
- Security Advisor surfaced no analytics_events-specific finding

See M25 for the immutable point-in-time activation receipt.

## Current state
ACTIVATION_READY: true
STATE: ACTIVATED_VERIFIED
LIVE_SCHEMA_CHANGED: true
MIGRATION_APPLIED: true
FUNCTION_DEPLOYED: true
DURABLE_RUNTIME_CONTROL_ENABLED: true
HISTORICAL_BACKFILL_ALLOWED: false
PAYMENTS_LIVE: false
EXECUTE_ACTIONS: false
OWNER_GATE: REVIEW_REQUIRED