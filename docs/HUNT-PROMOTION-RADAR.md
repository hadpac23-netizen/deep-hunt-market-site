# HUNT Promotion Radar

## Mission

Promotion Radar finds promotion candidates from official or authorized sources and keeps discovery separate from verification.

Pipeline:

OFFICIAL SOURCE → OBSERVATION → NORMALIZE → SAFETY → RED TEAM → CHECKOUT VERIFY → VERIFIED DEAL → DEAL CHESS

An observation is never automatically a deal.

## Current source lanes

### Shopify Admin GraphQL
- Uses the current `discountNodes` query.
- Requires an authorized shop and `read_discounts` access.
- Active discounts are imported as `pending_review`.
- The radar stores the official object type, summary, dates and source identity as evidence.
- It does not parse marketing copy into invented quantities or savings.

### HUNT merchants
Merchant-created campaigns remain a first-party source lane.
They still require source evidence and checkout verification before receiving a VERIFIED DEAL badge.

### Supplier / affiliate feeds
Future adapters may ingest promotions only from official APIs, feeds or authorized partner data.
No scraping is part of the Promotion Radar design.

## Observation warehouse

`hunt_promotion_observations` is private and internal:
- RLS enabled
- anon/authenticated grants revoked
- observations start at `pending_review`
- source URL must be HTTPS
- deal type is constrained
- discount and quantity fields have sanity checks

The migration is currently local only and has been transaction-tested with rollback.

## Promotion verification rules

A candidate can progress only when HUNT can establish:
- source identity
- active time window
- redemption conditions
- products / variants affected
- required quantity or spend
- reward value
- market eligibility
- checkout behavior
- current verification timestamp

BOOM must reject or downgrade:
- stale promotions
- expired promotions
- terms that cannot be reproduced
- apparent discounts already baked into the displayed price
- unsupported stacking assumptions
- promotions that require unnecessary overbuy for the current HUNT Mission

## Deal Chess

Deal Chess compares verified combinations, not headlines.
A larger advertised discount does not automatically rank higher than a lower landed cost or a better mission fit.
