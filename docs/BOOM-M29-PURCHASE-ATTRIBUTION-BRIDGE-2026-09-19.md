# BOOM M29 — Purchase Attribution Bridge — 2026-09-19

## Objective
Create a read-only truth bridge from payment evidence to real order, campaign attribution and finance evidence without changing payment/order state.

## Applied migration
- 20260919143150_purchase_attribution_bridge

## Live object
View:
public.hunt_purchase_attribution_bridge

Security:
- security_invoker = true
- public/anon/authenticated SELECT revoked
- service_role SELECT only
- publishable-key REST read test returned HTTP 401 permission denied
- Security Advisor surfaced no bridge-specific finding

## Provider-payment truth
M29 uses the same provider-confirmed event allowlist as M22:
- payment_confirmed
- callback_verified_paid
- provider_paid_confirmed

A purchase is server-confirmed only when all are true:
1. payment_session.paid_at exists
2. payment_session.order_id exists
3. linked hunt_orders row exists
4. order is_test = false
5. one approved provider-confirmed payment event exists

M29 does not create or infer any of these facts.

## Touchpoint linkage
Purchase ↔ touchpoint linkage additionally requires a M28 attribution-ledger row with context_status other than NO_CONTEXT.

Provider click validation remains a separate M28 requirement.

## Profit truth
Finance evidence is independent from purchase evidence.

Profit evidence becomes ready only when:
- a finance-ledger row exists
- finance row is_test = false
- finance order_id matches the payment-session order_id
- settlement_status is locked or settled

Preview/test finance rows never qualify.

## Live state at verification
- payment sessions: 23
- campaign-context sessions: 3
- provider payment confirmed: 0
- paid_at timestamps: 0
- real non-test linked orders: 0
- server-confirmed purchases: 0
- purchase ↔ touchpoint linkage: 0
- provider click validated: 0
- finance ledger rows: 0
- profit evidence ready: 0
- conversion claims allowed: 0

Existing orders:
- 8 test orders
- 0 real orders

Existing payment events:
- prelaunch_session_created only

## Critical blocker
The current PayPlus callback still deliberately does not map provider status into paid state. Even with paid callback acceptance enabled, it returns:
PROVIDER_STATUS_MAPPING_REQUIRES_SANDBOX_PROOF

Therefore:
PROVIDER_STATUS_MAPPING_READY: false

M29 does not bypass this blocker.

## Payment boundary
- hunt_payment_live = false
- hunt_payplus_callback_accept_paid = false
- no live provider request was created
- no paid state was written
- no real order was created
- no supplier live order was created
- no profit was released

## Current state
BRIDGE_READY: true
SERVER_CONFIRMED_PURCHASES: 0
PURCHASE_TOUCHPOINT_LINKAGE: 0
PROVIDER_CLICK_VALIDATION: 0
PROFIT_EVIDENCE_READY: 0
CONVERSION_CLAIMS_ALLOWED: 0
PROVIDER_STATUS_MAPPING_READY: false
PAYMENTS_LIVE: false
PAID_ATTRIBUTION_READY: false
PAID_SPEND: 0
EXECUTE_ACTIONS: false

## M30 status-mapping handoff
M30 has hardened the live PayPlus callback with HMAC/user-agent validation, independent IPN FULL re-verification, and a fail-closed charge-method mapper. Provider status mapping remains not ready until sandbox success and sandbox reject evidence are both captured.
