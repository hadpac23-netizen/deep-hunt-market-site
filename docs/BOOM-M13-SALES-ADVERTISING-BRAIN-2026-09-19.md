# BOOM M13 — Sales & Advertising Brain — 2026-09-19

## Objective
Prepare promotion and advertising decisions from product-page quality, verified economics and measurement readiness without activating spend.

## Product promotion gate
A candidate is checked for:
- title and useful description
- product media
- verified retail price
- Profit Gate
- availability
- shipping and returns clarity
- mobile readability
- brand-claim truth

Weak detail pages are not promoted merely because economics look attractive.

## Audience rule
Only shopping intent, category, price band and market may be used in this layer.
Sensitive targeting fields are rejected.

## Paid-media gate
A paid candidate additionally requires:
- verified unit economics
- positive max safe CAC
- attribution
- control/holdout
- landing-page measurement
- explicit owner approval

Even with every prerequisite ready, M13 returns OWNER_REVIEW rather than launching a campaign.

## Studio state
Current Studio inputs intentionally keep shipping/returns clarity, attribution, holdout, landing measurement and owner paid approval closed when not proven.

## Invariants
PAID_LAUNCHES: 0
SPEND: 0
SPEND_AUTHORIZED: false
EXECUTE_ACTIONS: false
OWNER_GATE: REVIEW_REQUIRED