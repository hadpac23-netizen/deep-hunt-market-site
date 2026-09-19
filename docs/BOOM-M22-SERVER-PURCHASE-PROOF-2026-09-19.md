# BOOM M22 — Server Purchase Proof — 2026-09-19

## Objective
Replace assumed purchase readiness with read-only proof from payment-session, payment-event and order truth.

## Required server chain
M22 counts a server-confirmed purchase only when all three agree:
1. hunt_payment_sessions has a paid_at timestamp and an order_id
2. hunt_orders contains that order and is_test = false
3. hunt_payment_events contains a payment-confirmation event type accepted by the proof contract

Current accepted proof event types are intentionally narrow:
- payment_confirmed
- callback_verified_paid
- provider_paid_confirmed

Generic callback verification or hold events are not purchases.

## Attribution linkage
A confirmed real purchase is attributed only when the same payment session also contains an attribution context inside commerce_snapshot.

Browser touchpoint context without server purchase proof does not count as a conversion.

## Current callback boundary
The current PayPlus callback remains fail-closed and returns accepted_paid:false.
M22 does not modify it.

## Integration
M22 supplies live read-only evidence to:
- M20 server_purchase_confirmation
- M20 campaign_touchpoint_persistence
- M20 purchase_touchpoint_linkage
- M21 live payment-session context state
- M17 server_purchase_proof evidence domain

If RLS/query access blocks the adapter, readiness fails closed.

## Safety
The adapter reads only minimal proof fields.
It never writes payment sessions, orders or payment events.

## Invariants
READ_ONLY: true
WRITES: 0
BROWSER_EVENT_IS_PURCHASE: false
TEST_ORDER_IS_PURCHASE: false
EXECUTE_ACTIONS: false
OWNER_GATE: REVIEW_REQUIRED

## M29 bridge
M29 now joins M22 server purchase proof with M28 attribution evidence and the finance ledger through a backend-only security-invoker view. It does not replace M22's proof rules and does not write paid/order state.
