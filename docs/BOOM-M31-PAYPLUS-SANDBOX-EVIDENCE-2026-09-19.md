# BOOM M31 — PayPlus Provider Status Evidence Harness — 2026-09-19

## Objective
Prove PayPlus success/reject behavior in staging before any provider status can be accepted as paid.

## Official PayPlus prerequisites
PayPlus Payment Pages require:
- payment_page_uid
- api-key
- secret-key

PayPlus documents separate sandbox card numbers for successful and rejected transactions, and supports send_failure_callback=true for failed-transaction callbacks.

## Harness
Edge Function:
- hunt-payplus-sandbox-evidence
- version 2
- ACTIVE
- staging endpoint only
- one-time token required
- runtime-control gated

The harness is intentionally isolated from HUNT_PAYMENT_MODE and does not read or enable:
- hunt_payment_live
- hunt_payplus_callback_accept_paid
- supplier-order live controls

It can only create mode=sandbox evidence sessions and PayPlus staging links.

## Preflight result
The first staging preflight stopped before link creation because the Edge runtime does not currently contain:
- PAYPLUS_API_KEY
- PAYPLUS_SECRET_KEY
- PAYPLUS_PAYMENT_PAGE_UID

Observed error:
PAYPLUS_SANDBOX_CONFIG_MISSING:PAYPLUS_API_KEY,PAYPLUS_SECRET_KEY,PAYPLUS_PAYMENT_PAGE_UID

No PayPlus payment page was created.
No sandbox card was submitted.
No provider callback was received.

## Automatic cleanup
If staging-link creation fails, the harness deletes the temporary sandbox payment session.

Post-preflight verification:
- M31 sandbox sessions: 0
- PayPlus status observations: 0
- accepted_paid observations: 0

The one-time runtime control was then disabled and its token hash was replaced with a disabled note.

Current control:
- hunt_payplus_sandbox_evidence = false / owner_approved=false

## Payment boundary
Verified after preflight:
- hunt_payment_live = false
- hunt_payplus_callback_accept_paid = false
- accepted_paid = 0
- live payment link created = false
- sandbox payment link created = false
- real order created = false
- supplier live order created = false

## Evidence state
The harness itself is ready and safe, but sandbox provider mapping is not proven.

Current:
- success sandbox proof = false
- reject sandbox proof = false
- provider status mapping ready = false

## Next proof
Once the three PayPlus staging configuration values are installed in the Edge runtime:
1. re-enable M31 with a fresh one-time token
2. create a PayPlus staging J4 link
3. run the official PayPlus successful sandbox card
4. capture HMAC + IPN FULL + status observation
5. create a second staging link
6. run the official rejected sandbox card
7. capture the failed callback/status evidence
8. disable M31 again
9. only then decide whether the M30 mapping can become ready

## Current state
HARNESS_READY: true
CONFIG_READY: false
SANDBOX_SUCCESS_PROVEN: false
SANDBOX_REJECT_PROVEN: false
PROVIDER_STATUS_MAPPING_READY: false
PAYMENTS_LIVE: false
PAID_CALLBACK_ACCEPTANCE: false
ACCEPTED_PAID: 0
EXECUTE_ACTIONS: false