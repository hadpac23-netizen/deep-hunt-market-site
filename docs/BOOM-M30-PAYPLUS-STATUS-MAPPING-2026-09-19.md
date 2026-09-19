# BOOM M30 — PayPlus Status Mapping Readiness — 2026-09-19

## Objective
Harden the live PayPlus callback and define a fail-closed transaction-type/status mapping contract before any callback can ever mark a payment paid.

## Official PayPlus contract used
PayPlus documents these Payment Page charge methods:
- 0 — Card Check (J2)
- 1 — Charge (J4)
- 2 — Approval (J5)
- 3 — Recurring
- 4 — Refund (J4)
- 5 — Token (J2)

PayPlus also documents that successful transaction callbacks contain successfully charged or refunded transaction details, and that failure callbacks can be enabled separately with send_failure_callback=true.

PayPlus requires validation of incoming requests using both the hash and user-agent headers with the API secret key.

The IPN FULL OpenAPI response schema is not explicit enough to justify inventing a provider status enum. M30 therefore stays fail-closed until sandbox evidence captures the exact response shape.

## Live callback hardening
Live Edge Function:
- hunt-payplus-callback
- version 9
- ACTIVE
- verify_jwt=false because this is a provider webhook
- custom HMAC/user-agent authentication enabled
- independent PayPlus IPN FULL verification retained

A fake callback using a browser user-agent was rejected with HTTP 401 and:
PAYPLUS_USER_AGENT_INVALID

## Status mapper
Rules:
- J2 Card Check → NOT PAID
- J5 Approval → NOT PAID
- J2 Token → NOT PAID
- J4 Charge → candidate only; sandbox proof required
- Refund → candidate only; sandbox proof required
- unknown/missing charge method → UNKNOWN_HOLD

Every mapping result currently enforces:
- accepted_paid = false
- paid_state_write_allowed = false
- refund_state_write_allowed = false

## Observation ledger
Applied migration:
- 20260919144610_payplus_status_observations

Table:
- public.hunt_payplus_status_observations

Stores only safe status fingerprints:
- payment session reference
- provider event reference
- sandbox/live environment
- charge method/type
- provider status/code/short description when present
- mapping state
- HMAC verified flag
- IPN FULL verified flag
- accepted_paid, hard-constrained false

It does not store card number, CVV, customer email, shipping address, or shipping snapshot.

Security:
- RLS enabled
- public/anon/authenticated revoked
- explicit deny-all policy for anon/authenticated
- service_role backend access only
- no table-specific Security Advisor finding

## Sandbox boundary
No sandbox transaction was created during this M30 activation.

Therefore:
- sandbox success proof = false
- sandbox reject proof = false
- provider status mapping ready = false

This is intentional. M30 does not claim a mapping until both paths have been observed from PayPlus staging.

## Payment boundary
Verified after callback v9 deployment:
- hunt_payment_live = false
- hunt_payplus_callback_accept_paid = false
- observation accepted_paid rows = 0

No real charge was created.
No paid state was written.
No real order was created.
No supplier order was activated.
No paid campaign or ad spend was enabled.

## Current state
CALLBACK_HARDENED: true
HMAC_GATE: true
IPN_FULL_VERIFICATION: true
STATUS_MAPPER: FAIL_CLOSED
SANDBOX_SUCCESS_PROVEN: false
SANDBOX_REJECT_PROVEN: false
PROVIDER_STATUS_MAPPING_READY: false
PAYMENTS_LIVE: false
PAID_CALLBACK_ACCEPTANCE: false
ACCEPTED_PAID_OBSERVATIONS: 0
EXECUTE_ACTIONS: false

## M31 preflight result
M31 deployed an isolated staging-only evidence harness, then attempted configuration preflight. The Edge runtime is missing PAYPLUS_API_KEY, PAYPLUS_SECRET_KEY and PAYPLUS_PAYMENT_PAGE_UID. No staging link or sandbox transaction was created. The M31 runtime control was disabled and its token invalidated. M30 remains CALLBACK_HARDENED / SANDBOX_PROOF_PENDING.
