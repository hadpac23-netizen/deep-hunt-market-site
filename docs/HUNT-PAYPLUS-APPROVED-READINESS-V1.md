# HUNT PayPlus — Approved Readiness V1

Date: 2026-09-27

## Current status

PayPlus provider approval is **owner-reported**. The connected Gmail search did not surface a direct PayPlus approval message, so the exact commercial/terminal terms are not treated as independently verified yet.

The technical integration is already substantially prepared:

- `hunt-payment-session` is deployed and active.
- `hunt-payplus-callback` is deployed and active.
- Callback authentication verifies the PayPlus user-agent and HMAC hash, then performs an independent `ipn-full` verification.
- Prelaunch callbacks are blocked.
- Paid acceptance remains behind a runtime kill switch.
- `hunt-payplus-sandbox-evidence` is deployed for controlled sandbox proof.

## Safety state

All payment activation gates remain OFF:

- `hunt_payment_live = false / owner_approved = false`
- `hunt_payplus_callback_accept_paid = false / owner_approved = false`
- `hunt_payplus_sandbox_evidence = false / owner_approved = false`
- `hunt_bundle_discount_apply = false / owner_approved = false`

No Production payment activation was performed.

## Evidence gap

Current database evidence contains 32 prelaunch payment sessions and no sandbox/live payment session proof. The next technical milestone is therefore **sandbox proof**, not Live activation.

## Required sequence

1. Verify the PayPlus terminal/account details received after approval.
2. Verify that the API key, secret key and payment-page UID are configured in the Edge Function environment without exposing values.
3. Keep Live mode OFF.
4. Enable sandbox evidence only after explicit owner approval.
5. Generate one controlled sandbox payment session.
6. Verify callback signature, IPN FULL response, request UID, transaction UID, session reference, amount and currency.
7. Verify provider-status mapping.
8. Re-run HUNT checkout E2E against fresh product, variant, stock, shipping and profit truth.
9. Keep Live disabled until a separate explicit owner approval.

This document records readiness only. It does not authorize payment activation.
