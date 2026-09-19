# BOOM M06 — Lifecycle Brain — 2026-09-19

## Objective
Build retention and post-purchase orchestration without treating an order email address or analytics consent as permission for marketing.

## Implemented trigger contract
Service:
- ORDER_UPDATE
- TRACKING_UPDATE

Marketing:
- SAVED_ITEM_REMINDER
- CART_REMINDER
- BACK_IN_STOCK
- PRICE_VERIFIED
- COMPLEMENTARY_ITEM

## Consent separation
Service/order communication and marketing communication are separate classes.
Saved/cart/back-in-stock/price/complementary messages require explicit marketing consent.
Analytics consent is not reused as marketing consent.

## Frequency safety
- 1 marketing lifecycle message max per 24h
- 2 max per 7d
- cart trigger cooldown 72h
- other marketing triggers 168h
- service events deduplicate by event ID

## Message truth
No fake urgency, countdowns, scarcity or unverified delivery claims.
Back-in-stock requires verified transition evidence.
Price messages require a verified price change.
Complementary-item messages require confirmed purchase + verified complement.

## Current readiness baseline
M06 intentionally reports all lanes LOCKED because:
- dedicated marketing-consent infrastructure is not ready;
- real order lifecycle events are not production-ready;
- tracking events are not ready;
- email/push/SMS/WhatsApp lifecycle connectors are not enabled.

## Execution
The brain prepares decisions/messages only.
EXTERNAL_SEND=false
OWNER_GATE=REVIEW_REQUIRED
PRODUCTION_CHANGED=false
PAID_SPEND_CHANGED=false