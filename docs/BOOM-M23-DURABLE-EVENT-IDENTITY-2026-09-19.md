# BOOM M23 — Durable Event Identity — 2026-09-19

## Objective
Make canonical measurement identity durable and atomic at the database layer before M20 can treat browser/server dedup as ready.

## Live activation
M23 is now live and verified in the connected boom-social-world Supabase project.

Applied migration:
- 20260919133622_add_durable_event_identity

Live analytics_events now has:
- nullable event_id
- length guard
- UNIQUE(event_id)
- RLS enabled
- public INSERT policy restricted to noncanonical rows

The public path was tested and rejects both top-level event_id and metadata.event_id injection.

## Historical truth
Rows created before activation did not preserve canonical browser event IDs. They were not backfilled. Old rows therefore remain event_id = NULL.

## Live Edge Function
hunt-commerce-signal version 11 is active.

The function reads hunt_runtime_controls key hunt_durable_event_identity. Durable mode requires both enabled=true and owner_approved=true.

Canonical requests:
- persist top-level event_id
- use PostgREST on_conflict=event_id
- request resolution=ignore-duplicates
- report durable_cross_worker_dedup=true

Backward compatibility:
- requests without event_id remain noncanonical
- they continue to be stored without database dedup
- this prevents stale/older clients from breaking

## Live duplicate proof
A canonical event ID was sent through two requests separated beyond the in-memory debounce window.

Observed result:
- first request: deduped=false
- second request: deduped=true
- database rows for the proof event_id: exactly 1
- duplicate canonical rows observed: 0

This proves database-backed dedup rather than only in-memory debounce.

## Runtime control
The durable runtime control is now recorded by migration:
- 20260919134205_enable_durable_event_identity_runtime

Current control:
- hunt_durable_event_identity: enabled=true / owner_approved=true

## Payment boundary
No payment activation was performed. Current controls remain:
- hunt_payment_live=false
- hunt_payplus_callback_accept_paid=false

M23 does not enable payment, supplier orders, advertising spend or external sends.

## Current state
HISTORICAL_BACKFILL_ALLOWED: false
DATABASE_CHANGED: true
FUNCTION_DEPLOYED: true
DURABLE_READY: true
LIVE_EVENT_ID_PERSISTENCE: true
PAID_ATTRIBUTION_READY: false
PAYMENTS_LIVE: false
EXECUTE_ACTIONS: false
OWNER_GATE: REVIEW_REQUIRED
