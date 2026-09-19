# BOOM M03 — Multi-Channel Measurement Hub — 2026-09-19

## Objective
Give every HUNT commerce event one canonical event identity before connecting additional ad/commerce platforms.

## Implemented
- boom-measurement-hub.js
- privacy-safe canonical measurement contract
- destination readiness for GA4, HUNT first-party, Google Ads/Data Manager, Meta CAPI, TikTok Events API and Pinterest Conversions API
- analytics.js canonical event_id generation
- deterministic purchase event identity from transaction ID
- hunt:measurement-envelope browser event
- event_id forwarded to the existing first-party signal payload
- same event_id forwarded to GA4/GTM payload
- pre-consent queued events retain their event_id after consent
- owner Growth OS Measurement Hub dashboard

## Current destination truth
GA4:
- configured with existing GA4 measurement ID
- runtime send still requires analytics consent

HUNT first-party:
- existing hunt-commerce-signal Edge Function is present
- VERIFIED for canonical first-party event identity/dedup through M23/M25; paid conversion attribution remains separately gated by M20/M22
- existing 1.2 second session/event/item duplicate window is not treated as server event identity

Google Ads / Data Manager:
- not connected by M03
- external send OFF

Meta Conversions API:
- not connected by M03
- external send OFF

TikTok Events API:
- not connected by M03
- external send OFF

Pinterest Conversions API:
- not connected by M03
- external send OFF

## Privacy boundary
No raw email, phone, address or full name is added to the canonical envelope.
Enhanced conversions / customer-data matching are separate future capabilities and require explicit consent/policy/account configuration.

## Purchase safety
HuntAnalytics.purchase remains fail-closed:
- confirmed must be true
- transaction ID required
- numeric value required
- state is confirmed_real_order

Checkout preview does not become purchase analytics.

## Open gap
M20 adds a local, undeployed hunt-commerce-signal preview that persists event_id into analytics metadata. M23 now adds the reviewed database-uniqueness design and feature-gated atomic insert path, but the live schema/function remain unchanged; durable cross-worker dedup and paid attribution therefore remain blocked.

## Invariants
EXTERNAL_MEASUREMENT_SEND: false
CUSTOMER_DATA_MATCHING: false
PAID_SPEND_CHANGED: false
PRODUCTION_CHANGED: false
PAYMENT_CHANGED: false
SUPPLIER_ORDER_CHANGED: false
OWNER_GATE: REVIEW_REQUIRED
