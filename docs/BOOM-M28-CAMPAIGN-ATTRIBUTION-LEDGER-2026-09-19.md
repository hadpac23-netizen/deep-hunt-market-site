# BOOM M28 — Campaign Attribution Ledger + Provider Click Validation — 2026-09-19

## Objective
Create a durable backend-only evidence ledger between campaign context, payment sessions and future confirmed purchases, without treating browser click identifiers as verified conversions.

## Applied migrations
- 20260919142109_campaign_attribution_ledger
- 20260919142135_harden_campaign_attribution_ledger_rls

Canonical migration files are mirrored under supabase/migrations.

## Ledger model
public.hunt_attribution_ledger has exactly one row per payment session.

It stores first/last UTM source, medium and campaign; detected provider name and click-id type; SHA-256 click-id digest; provider-validation status; future server-purchase status; and the conversion-claim gate.

It does not store raw click IDs, customer email, shipping address, phone, or shipping snapshot.

## Security
The table has RLS enabled, explicitly revokes table access from public/anon/authenticated, grants backend DML to service_role, and has an explicit deny-all RLS policy for anon/authenticated. The trigger function is SECURITY INVOKER and direct execution is revoked from public/anon/authenticated.

The post-hardening Security Advisor run surfaced no hunt_attribution_ledger-specific finding.

## Automatic capture
An AFTER INSERT trigger on hunt_payment_sessions creates one attribution-ledger row. Unattributed sessions are also recorded, giving BOOM a truthful denominator rather than counting only sessions with campaign IDs. Existing sessions were truth-preservingly backfilled.

## Provider detection
Supported classifications:
- gclid → GOOGLE_ADS
- fbclid → META
- ttclid → TIKTOK_ADS
- msclkid → MICROSOFT_ADS

Detection is not validation. A detected click ID enters PENDING_PROVIDER_VALIDATION. Multiple provider IDs enter AMBIGUOUS_PROVIDER_CLICK_IDS. VERIFIED requires future official provider-API evidence with an evidence reference and verification timestamp.

## Live proof
Synthetic prelaunch QA payment session: 04173c44-da56-4363-aa7e-f6a9d77887a8.

Payment session remained prelaunch with paid_at NULL, order_id NULL, provider_request_uid NULL and provider_redirect_url NULL.

Automatically-created ledger row:
- context: BROWSER_CONTEXT_UNVERIFIED
- provider: GOOGLE_ADS
- click type: gclid
- digest length: 64
- digest equals raw click ID: false
- provider validation: PENDING_PROVIDER_VALIDATION
- purchase: NOT_CONFIRMED
- conversion claim: false

## Current live counts
- ledger rows: 23
- rows with click digest: 3
- pending provider validation: 3
- official provider verified: 0
- server-confirmed purchases: 0
- conversion claims allowed: 0

The three click-digest rows are QA evidence, not paid conversions.

## M20 / M21 integration
M21 provider-click validation now consumes M28 rather than a hardcoded false. M20 paid-attribution readiness now explicitly requires provider-click validation. A future server-confirmed purchase still cannot become paid-attribution-ready until official provider evidence is present.

## Payment / ad boundary
Verified:
- hunt_payment_live = false
- hunt_payplus_callback_accept_paid = false
- paid attribution = false
- paid launch = false
- paid spend = 0

M28 does not connect an ad account, create a campaign, spend money, activate PayPlus, or claim a conversion.

## Current state
LEDGER_READY: true
PROVIDER_CLICK_VALIDATION: false
PROVIDER_VALIDATION_PENDING: 3
SERVER_CONFIRMED_PURCHASES: 0
CONVERSION_CLAIMS_ALLOWED: 0
PAID_ATTRIBUTION_READY: false
PAYMENTS_LIVE: false
PAID_SPEND: 0
EXECUTE_ACTIONS: false
