# BOOM M25 — Live Activation Verification — 2026-09-19

## Objective
Record the verified live outcome of the owner-approved M23/M24 durable-event-identity activation.

## Applied migrations
- 20260919133622_add_durable_event_identity
- 20260919134205_enable_durable_event_identity_runtime

Both are mirrored back into the repository under supabase/migrations.

## Live Edge Function
hunt-commerce-signal version 11 is ACTIVE with verify_jwt=false, matching the pre-existing public browser invocation contract.

Durable identity is controlled by:
hunt_runtime_controls.key = hunt_durable_event_identity

The durable path requires:
- enabled = true
- owner_approved = true
- a non-empty canonical event_id

Older/stale clients without event_id remain on the noncanonical compatibility path.

## Security proof
Verified live after migration:
- RLS remains enabled on analytics_events
- public top-level event_id insert attempt is rejected by RLS
- public metadata.event_id insert attempt is rejected by RLS
- trusted Edge Function path can persist canonical event_id
- no analytics_events-specific Security Advisor finding was surfaced after activation

## Database duplicate proof
Two independent requests were sent with the same canonical event_id, separated beyond the in-memory debounce window.

Observed:
- request 1: deduped=false
- request 2: deduped=true
- database row count for that event_id: exactly 1
- duplicate canonical rows observed globally: 0

This verifies database-backed uniqueness/dedup rather than only process-local debounce.

## Compatibility proof
A request without event_id was accepted after durable activation and stored as a noncanonical event.

This prevents a stale client from failing simply because it has not yet adopted the canonical identity contract.

## Payment boundary
No payment system was activated.

Verified runtime controls:
- hunt_payment_live = false
- hunt_payplus_callback_accept_paid = false

No live charge, PayPlus paid callback acceptance, supplier-order activation, paid campaign, or external send was enabled by M25.

## Remaining attribution work
Durable event identity is now solved.

Paid attribution remains HOLD because it still requires:
- real provider-confirmed purchase
- live campaign context on that payment session
- deterministic purchase-to-touchpoint linkage
- provider click validation where applicable
- paid destination connection
- explicit paid-launch approval

## Current state
LIVE_ACTIVATION: VERIFIED
DURABLE_EVENT_IDENTITY: VERIFIED
LIVE_EVENT_ID_PERSISTENCE: VERIFIED
DATABASE_DEDUP: VERIFIED
PAYMENTS_LIVE: false
PAYPLUS_CALLBACK_ACCEPT_PAID: false
PAID_ATTRIBUTION_READY: false
PAID_SPEND: 0
EXECUTE_ACTIONS: false