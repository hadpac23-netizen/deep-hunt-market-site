# HUNT DEAL — eBay Production + Onsite Checkout Approval

## Current verified state
- eBay Developer account exists.
- HUNT-DEAL Sandbox keyset exists.
- HUNT-DEAL Production keyset was created by eBay but is currently disabled pending Marketplace Account Deletion/Closure compliance.
- Production deletion webhook is deployed at the HUNT Supabase project.
- Webhook challenge GET preflight returns HTTP 200 + JSON challengeResponse.
- Webhook POST preflight returns HTTP 204.
- hunt-ebay-browse is deployed and protected by HUNT internal authentication.
- hunt-ebay-order is implemented but approval-gated.
- EBAY_ORDER_API_APPROVED must remain false until written eBay approval is received.

## Production keyset activation
1. Sign in to eBay Developers Program.
2. Open Application Keysets -> HUNT-DEAL Production -> Notifications.
3. Select Marketplace Account Deletion.
4. Configure alert email, HTTPS endpoint and matching verification token.
5. Save and pass eBay's challenge validation.
6. Send eBay test notification and verify successful acknowledgement.
7. Confirm Production keyset becomes enabled.

## Buy / Order API approval
1. Join / verify eBay Partner Network where required.
2. Submit the Buy API production application for HUNT DEAL.
3. Request guest checkout / Checkout with eBay for onsite purchase.
4. Reply to eBay's application confirmation with UX mocks and end-to-end data flow.
5. After EPN/business approval, open Developer Technical Support ticket for Buy API Production Access.
6. Provide sandbox/review instructions and approval evidence.
7. Address review changes.
8. Sign required contracts.
9. Only after explicit production approval: set EBAY_ORDER_API_APPROVED=true and run end-to-end checkout tests.

## HUNT approval safety gate
Never enable onsite eBay checkout based on a keyset alone. Order API is Limited Release and requires explicit eBay approval.
