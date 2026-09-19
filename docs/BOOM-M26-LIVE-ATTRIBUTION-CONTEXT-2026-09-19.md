# BOOM M26 — Live Attribution Context — 2026-09-19

## Objective
Activate the server-side campaign-context path without activating payment.

## Live Edge Function
hunt-payment-session version 13 is ACTIVE.

M26 was merged onto the exact live v12 source rather than replacing it with the older repo copy.

Preserved from v12:
- Commerce Profit Gate
- active profit profile lookup
- supplier-cost readiness checks
- offer application/claim logic
- private commerce-decision storage
- payment-live runtime gate
- PayPlus prelaunch/live separation

Added by M26:
- strict campaign field allowlist
- consent flag requirement
- first/last touch sanitization
- attribution included in the idempotency digest
- attribution stored inside existing commerce_snapshot
- browser context explicitly marked unverified

## Attribution allowlist
Only these fields are accepted:
- utm_source
- utm_medium
- utm_campaign
- utm_content
- utm_term
- gclid
- fbclid
- ttclid
- msclkid
- landing_path
- captured_at

Shipping/customer PII is not part of the attribution allowlist.

## Live prelaunch proof
A synthetic QA request was sent using an already-verified CJ catalog item.

Observed response:
- payment_ready = false
- mode = prelaunch
- status = prelaunch
- reason = AUTHORIZED_PAYMENT_ACCOUNT_REQUIRED
- Commerce Gate = PASS

Observed database session:
- paid_at = NULL
- order_id = NULL
- provider_request_uid = NULL
- provider_redirect_url = NULL
- attribution_status = browser_context_unverified
- attribution.verified = false
- synthetic first-touch UTM persisted
- synthetic last-touch campaign/click ID persisted

Observed payment events:
- only prelaunch_session_created

## Payment boundary
Verified after the probe:
- hunt_payment_live = false
- hunt_payplus_callback_accept_paid = false

No live charge, PayPlus paid callback acceptance or supplier order was enabled.

## Frontend boundary
The repository already contains the M21 browser capture + checkout payload path.

However the current Netlify primary URL returned HTTP 503 during this verification and the current Netlify deploy reported as the older authclean branch deploy.

Therefore M26 records:
BACKEND_LIVE_VERIFIED = true
FRONTEND_LIVE_VERIFIED = false
LIVE_CONTEXT_END_TO_END = false

A backend QA probe proves ingestion/persistence, not that production users are currently sending the context.

## Current state
PAYMENT_SESSION_VERSION: 13
BACKEND_LIVE_VERIFIED: true
FRONTEND_LIVE_VERIFIED: false
LIVE_CONTEXT_END_TO_END: false
ATTRIBUTION_VERIFIED: false
CONVERSION_CLAIM_ALLOWED: false
PAYMENTS_LIVE: false
PAID_LAUNCH: false
PAID_SPEND: 0
EXECUTE_ACTIONS: false