# BOOM PayPlus Sandbox Evidence Skill

## Mission
Collect deterministic PayPlus staging evidence for successful and rejected transactions without enabling production payment.

## Preconditions
Require all three staging/runtime values:
- PAYPLUS_API_KEY
- PAYPLUS_SECRET_KEY
- PAYPLUS_PAYMENT_PAGE_UID

If any are missing, stop before session/link creation.

## Isolation
The harness must:
- call only restapidev.payplus.co.il
- create only mode=sandbox payment sessions
- use a one-time token and runtime kill switch
- never read or modify hunt_payment_live
- never read or modify hunt_payplus_callback_accept_paid
- never create supplier orders
- never write paid_at or order_id

## Evidence
Success and reject each require:
- staging payment link
- official PayPlus sandbox card scenario
- authenticated callback
- independent IPN FULL verification
- backend-only status observation

## Cleanup
Disable the runtime control and invalidate the token immediately after proof or after any blocking preflight error.

## Truth rule
No sandbox observation means no status-mapping claim.
A ready harness is not a proven provider mapping.