# BOOM M06 — Lifecycle Brain — 2026-09-19

## Objective
Build an evidence-first retention and post-purchase decision layer without sending customer messages.

## Live HUNT snapshot
Read-only aggregate snapshot at implementation:
- saved product actions: 1
- liked product actions: 2
- total orders: 8
- test orders: 8
- non-test orders: 0
- order events: 8
- fulfillment rows with tracking: 0
- delivered fulfillment rows: 0

The current order history therefore cannot be used as evidence of real post-purchase lifecycle behavior.

## Existing infrastructure reused
HUNT already has:
- hunt_product_actions for likes/saves
- hunt_orders
- hunt_order_events
- hunt_fulfillment_orders
- carrier/tracking fields
- checkout customer email input for future real-order updates
- Product Truth / exact stock verification
- analytics consent infrastructure

## Missing infrastructure
External messaging remains HOLD because HUNT does not yet have a proven:
- lifecycle consent registry
- send-history ledger
- enforceable frequency-cap ledger
- suppression/unsubscribe registry
- connected external messaging provider

## Unified M06 engine
The final M06 combines the strongest parts of two parallel implementations.

Supported triggers:
- saved reminder
- cart reminder
- verified price update
- back in stock
- order update
- tracking update
- complementary follow-up

### Marketing safeguards
- channel-specific opt-in
- explicit channel connection + send enablement
- quiet-hours suppression
- per-trigger cooldowns and 30-day caps
- global 1/24h and 2/7d marketing caps
- unsubscribe/suppression handling

### Service safeguards
- test-order suppression
- confirmed real-order requirement
- verified status/tracking change
- service event_id dedup

### Truth safeguards
- safe category
- Product Truth ready
- verified price
- exact variant stock for back-in-stock
- verified price-change evidence
- verified complement after delivery

## Safe copy
M06 can generate conservative copy only for a fully eligible trigger.
It does not manufacture urgency, scarcity, popularity, shipping promises or compatibility claims.

## Growth OS
The owner dashboard uses aggregate-only counts and readiness probes.
A readiness probe is not a queued customer message.

The dashboard loads no customer email, phone, name or user ID for M06 readiness.

## Current expected state
External lifecycle SEND remains OFF.
The eight existing orders are test orders and are suppressed by design.
There is no real tracking/delivery evidence yet.

## Invariants
LIFECYCLE_EXTERNAL_SEND: false
MESSAGES_SENT: 0
TEST_ORDER_CUSTOMER_MESSAGES: false
PRODUCTION_CHANGED: false
PAYMENT_CHANGED: false
OWNER_GATE: REVIEW_REQUIRED
