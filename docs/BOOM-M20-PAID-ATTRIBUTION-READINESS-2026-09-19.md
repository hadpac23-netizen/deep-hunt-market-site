# BOOM M20 — Paid Attribution Readiness — 2026-09-19

## Objective
Require a complete server-side evidence chain before BOOM treats paid marketing as attributable revenue.

## Durable identity — now verified
M23/M24/M25 completed the canonical event identity layer.

Live state:
- hunt-commerce-signal v11
- analytics_events.event_id exists
- UNIQUE(event_id) exists
- public canonical identity injection is blocked
- database duplicate proof passed
- live canonical event_id persistence is verified
- durable cross-worker dedup is verified

M20 therefore no longer blocks on event identity or durable dedup.

## Remaining paid-attribution blockers
Paid attribution is still HOLD until the remaining server chain is proven:
- server-confirmed real purchase
- persisted campaign/touchpoint context in the live payment session
- deterministic purchase ↔ touchpoint linkage
- provider click validation where required
- paid destination connection
- explicit paid-launch owner approval

M22 reads payment/order proof without creating it. Current project state has no provider-confirmed real purchase, so this gate remains closed.

## Browser purchase boundary
A browser purchase event alone is never treated as a confirmed paid conversion.

## Payment boundary
No payment activation occurred during M23/M24/M25.
- hunt_payment_live=false
- hunt_payplus_callback_accept_paid=false
- paid launch=false
- paid spend=0

## Current state
LIVE_EVENT_ID_PERSISTENCE: true
DURABLE_SERVER_DEDUP: true
PAID_ATTRIBUTION_READY: false
PAID_DESTINATION_SEND: false
PAID_LAUNCH: false
PAID_SPEND: false
EXECUTE_ACTIONS: false
OWNER_GATE: REVIEW_REQUIRED
