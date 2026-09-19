# BOOM M19 — Marketplace Snapshot Adapter — 2026-09-19

## Objective
Provide M15/M17 with current marketplace evidence without reading seller secrets or performing marketplace mutations.

## Read-only sources
M19 requests count/status evidence only from:
- merchant_accounts
- merchant_stores
- merchant_products
- merchant_outbound_clicks
- merchant_conversion_events
- merchant_ad_requests

It does not query merchant API key material.

## Output
The adapter reports:
- merchant registry readiness
- marketplace snapshot readiness
- attribution registry readiness
- total/approved/pending store counts
- total/approved/pending product counts
- outbound-click and conversion-event counts
- ad-request count
- adapter errors

## Integration
M15 uses the snapshot for real store/product counts and marketplace readiness.
M17 marks marketplace_snapshot VERIFIED only when the adapter is ready.

Failure is fail-closed: query/RLS/schema errors remain visible and do not break the rest of Growth Studio.

## Still gated
M19 does not prove API-key hashing/revocation/rate limiting.
It does not create payout readiness.
Those remain independent M15 blockers.

## Safety
READ_ONLY: true
WRITES: 0
EXECUTE_ACTIONS: false
OWNER_GATE: REVIEW_REQUIRED