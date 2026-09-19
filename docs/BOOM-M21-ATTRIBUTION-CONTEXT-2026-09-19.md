# BOOM M21 — Attribution Context — 2026-09-19

## Objective
Create a privacy-conscious campaign-context chain from landing page to checkout/payment-session without claiming a conversion or changing production.

## Browser contract
analytics.js now recognizes only:
- utm_source
- utm_medium
- utm_campaign
- utm_content
- utm_term
- gclid
- fbclid
- ttclid
- msclkid

The current URL candidate is held in memory before consent.
It is persisted to sessionStorage only after analytics consent is granted.

M21 stores:
- first_touch
- last_touch
- landing_path
- captured timestamp

It does not persist raw referrer, email, phone, shipping address or other customer contact fields as attribution context.

Declining analytics removes the attribution session context.

## Checkout preview
checkout.js attaches only the consented HUNT analytics attribution context to the existing payment-session request.

## Server preview
The local hunt-payment-session source sanitizes the same allowlist and places it inside the already-existing commerce_snapshot column.

The snapshot is marked:
`browser_context_unverified`

It is included in the payment-session idempotency digest so the same idempotency key cannot silently represent a different attribution context.

## Important limitation
The payment-session source change is not deployed.
A browser campaign parameter is not provider-verified click evidence.
A payment session is not a confirmed purchase.
Therefore M21 is LOCAL_PREVIEW, not live attribution.

## Relationship to M20
M21 closes the local campaign-context design gap.
M22 now supplies live read-only proof for campaign context persistence, server purchase confirmation and purchase ↔ touchpoint linkage. With current prelaunch/test-only state these remain unproven; paid attribution therefore remains false.

## Production boundary
No Edge Function deployment.
No database migration.
No live checkout/payment behavior changed.
No conversion API send.
No paid campaign or spend.

## Invariants
LOCAL_PREVIEW_READY: true
LIVE_ATTRIBUTION_CONTEXT_READY: false
CONVERSION_CLAIM_ALLOWED: false
PAID_LAUNCH: false
PAID_SPEND: false
EXECUTE_ACTIONS: false
OWNER_GATE: REVIEW_REQUIRED