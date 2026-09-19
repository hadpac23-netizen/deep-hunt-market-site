# BOOM M20 — Paid Attribution Readiness — 2026-09-19

## Objective
Close the gap between browser event identity and decision-grade paid attribution without enabling campaigns or changing production.

## Live inspection
The connected Supabase project currently runs `hunt-commerce-signal` version 8.

The browser already generates one canonical `event_id` per commerce event and forwards the same identity to GA4/GTM and the first-party signal payload.

Live v8 accepts that payload but does not persist `event_id` into `analytics_events`.
Its 1.2 second in-memory duplicate window is not durable cross-worker deduplication.

Live v8 also does not accept browser `hunt_purchase` as a first-party conversion event.

## Local preview patch
The repo now contains a local source-of-truth preview at:
`supabase/functions/hunt-commerce-signal/index.ts`

The preview:
- preserves the current allowed-origin/event contract
- reads the canonical browser event_id
- stores event_id in analytics_events.metadata
- keeps purchase unsupported
- does not claim durable database uniqueness
- supports the current backend secret environment model without placing secrets in browser code

The preview is NOT deployed.

## Why paid attribution remains HOLD
Persisting event_id is only one layer. M21 now adds a local consent-gated campaign-context path into the payment-session source, but that patch is also undeployed and remains unverified browser context.

Decision-grade paid attribution still requires:
- live event_id persistence
- durable server-side event deduplication
- confirmed purchase created from payment/order truth
- campaign/touchpoint persistence
- deterministic purchase ↔ touchpoint linkage

M22 now checks the purchase/payment/order chain read-only and feeds those three server-side proof flags into M20 instead of hardcoded assumptions.
- paid destination connection
- explicit owner approval

A browser purchase event alone is not treated as confirmed paid conversion evidence.

## Studio integration
M20 exposes every prerequisite independently.
M17 marks paid_attribution VERIFIED only when the M20 attribution core is proven.
M18 therefore continues to downgrade paid TEST_CANDIDATE decisions while this proof is missing.

## Production boundary
No migration was created because the Supabase CLI is not installed locally.
No database schema was changed.
No Edge Function was deployed.
No production payment, ad or external-send behavior changed.

## Invariants
LIVE_FUNCTION_CHANGED: false
DATABASE_CHANGED: false
PAID_ATTRIBUTION_READY: false
PAID_DESTINATION_SEND: false
PAID_LAUNCH: false
PAID_SPEND: false
EXECUTE_ACTIONS: false
OWNER_GATE: REVIEW_REQUIRED