# BOOM M03.5 — Profit & Feed Control Tower — 2026-09-19

## Why this layer exists
Profit Gate PASS is not the same thing as paid-media readiness or scale readiness.

The current verified economics rows illustrate this clearly:
- verified product 1 max safe CAC: $0.09
- verified product 2 max safe CAC: $0.04
- verified product 3 max safe CAC: $0.51

All three have positive verified contribution before acquisition, but their acquisition headroom is narrow. M03.5 prevents a positive contribution result from being interpreted as automatic permission to buy traffic.

## Current economics coverage
Existing unit economics already models:
- sale price
- customer shipping amount
- supplier product cost
- supplier shipping cost
- payment reserve
- refund reserve
- platform cost
- contribution before coupon/acquisition
- minimum contribution
- safe coupon
- safe CAC

The Control Tower recomputes the known contribution math and checks it against the stored contribution within tolerance.

## Leakage still missing
Not silently treated as zero:
- creator commission
- affiliate commission
- chargeback reserve
- customer-support/service cost

These become required evidence as those channels become active.

## Four decision planes
### Onsite
Can the product remain visible safely?

### External distribution
Is Product Truth/feed truth strong enough to distribute externally?

### Paid test
Is there verified economic and measurement headroom to buy traffic?

### Scale
Do we have observed post-acquisition evidence: conversions, CAC, net contribution, refund rate and chargeback rate?

## Live HUNT implication
At the current baseline, external distribution and paid scale should remain conservative because:
- M02 feed blockers remain open;
- merchant/policy/feed configuration remains incomplete;
- server event_id persistence remains incomplete;
- attribution readiness is not complete;
- owner paid approval remains required;
- only 3 products currently have verified positive unit economics.

## Execution policy
The Control Tower can output STOP/HOLD/PREPARE/PROMOTE_CANDIDATE/TEST_CANDIDATE/SCALE_CANDIDATE.
It cannot execute a stop/start/publish/spend action.

EXECUTE_ACTIONS: false
EXTERNAL_PUBLISHING_CHANGED: false
PAID_SPEND_CHANGED: false
PRODUCTION_CHANGED: false
OWNER_GATE: REVIEW_REQUIRED
