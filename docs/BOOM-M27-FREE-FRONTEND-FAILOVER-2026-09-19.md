# BOOM M27 — Free Frontend Failover + Browser E2E — 2026-09-19

## Objective
Keep HUNT frontend verification available without paying for additional hosting after the current Netlify project returned usage_exceeded.

## Primary host finding
Netlify project: deep-hunt-market

Observed on:
- primary URL
- current deploy permalink
- authclean branch alias

All returned:
HTTP 503
{"error":"usage_exceeded"}

The Netlify API still reported the existing deploy as ready, so this is an account/usage availability condition rather than a build error.

No paid Netlify upgrade was performed.

## Free fallback design
GitHub Pages was already enabled for the public repository.

Original Pages source:
- branch: main
- path: /
- build type: legacy

Because the active HUNT feature branch differs from main by hundreds of files, M27 did not point Pages at the full feature branch.

Instead, a dedicated fallback branch was created from main:
- branch: m26-pages-fallback
- commit: 2709295a634faf8562b6e0be8824744a6ec3688e

Only three frontend files were replaced from approved commit ca77cfe:
- analytics.js
- checkout.js
- checkout.html

No product.html/X08 worktree changes were included.

## Pages activation
GitHub Pages source was changed to:
- branch: m26-pages-fallback
- path: /

A manual Pages build was triggered because changing the legacy source did not automatically create a fresh build.

Observed build:
- status: built
- commit: 2709295a634faf8562b6e0be8824744a6ec3688e
- updated_at: 2026-09-19T14:05:14Z

Live Pages URL:
https://hadpac23-netizen.github.io/deep-hunt-market-site/

Live checks returned HTTP 200 for:
- analytics.js
- checkout.js
- checkout.html

The served files contain the M21/M26 attribution and shipping checkout path.

## Browser E2E
A real browser session opened the public Pages checkout URL with synthetic QA campaign parameters.

Observed browser attribution context:
- consent_granted = true
- first_touch.utm_source = m26_browser
- last_touch.utm_campaign = pages_e2e
- gclid = m26-browser-click-20260919

A synthetic CJ cart item and synthetic shipping/contact data were used.

Browser result after Verify price & shipping:
- status: Price, stock and shipping verified. Payment is still disabled during pre-launch.
- total: $12.19
- payment button: disabled

## Database E2E proof
The same browser click ID was found in hunt_payment_sessions.

Session:
- id: b86c34cd-cf81-472c-8416-f6e456f49bf2
- mode: prelaunch
- status: prelaunch
- paid_at: NULL
- order_id: NULL
- provider_request_uid: NULL
- provider_redirect_url: NULL
- attribution_status: browser_context_unverified
- attribution.verified: false

Payment events for that session:
- prelaunch_session_created only

Runtime controls remained:
- hunt_payment_live = false
- hunt_payplus_callback_accept_paid = false

## Truth boundary
This proves:
Browser -> public Pages fallback -> live payment-session v13 -> database attribution snapshot.

It does NOT prove:
- a real paid purchase
- provider-validated ad click ownership
- purchase-to-touchpoint linkage
- paid attribution
- payment readiness

M20/M22 remain authoritative for those gates.

## Rollback
GitHub Pages source can be restored to:
- branch: main
- path: /

No main merge is required for rollback.

## Current state
NETLIFY_PRIMARY_AVAILABLE: false
NETLIFY_REASON: usage_exceeded
PAID_HOST_UPGRADE: false
GITHUB_PAGES_FALLBACK: LIVE
BROWSER_ATTRIBUTION_E2E: VERIFIED
PAYMENT_MODE: prelaunch
PAYMENTS_LIVE: false
PAID_ATTRIBUTION_READY: false
PAID_SPEND: 0
EXECUTE_ACTIONS: false