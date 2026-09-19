# BOOM M14 — Promotion Engine — 2026-09-19

## Objective
Validate a complete promotion campaign after M05 Offer Chess selects an offer worth considering.

## Separation from M05
M05 answers: which offer type may be worth testing?
M14 answers: is the full promotion campaign truthful, measurable and economically safe enough for owner review?

## Campaign checks
- supported promotion type
- verified availability
- fixed start and end timestamps
- no resetting countdown
- no fabricated original price
- no preselected paid extras
- clear final price
- customer-history truth for new/repeat/win-back offers

## Economics
M14 recomputes expected contribution after landed cost, shipping subsidy, payment fees, returns allowance, affiliate allocation, discount, tax and margin floor.

Missing cost inputs are blockers. Zero is not assumed.

## Experiment contract
Every candidate requires hypothesis, audience, control, primary metric, margin guardrail, refund guardrail, stop rule and rollback.

## Studio integration
M14 consumes M05 offer candidates.
Current Studio intentionally leaves promotion-level availability, affiliate allocation and tax allocation unverified where the evidence does not exist.

## Invariants
PROMOTION_ACTIVATE: false
EXTERNAL_PUBLISH: false
CHECKOUT_APPLICATION: false
EXECUTE: false
OWNER_GATE: REVIEW_REQUIRED