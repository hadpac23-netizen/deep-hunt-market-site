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

### Awin Offers API
- Uses the official Publisher Offers API.
- Retrieves active promotions and vouchers from authorized Awin data.
- Preserves advertiser identity, terms, start/end dates, regions and voucher code when available.
- Imported offers remain `pending_review` until HUNT verifies redemption at checkout.

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

## Checkout Verifier and Deal Passport

Promotion verification is a separate internal step from discovery.

The verifier records:
- source freshness
- structure completeness
- checkout reproduction
- landed-cost completeness
- mission quantity fit
- comparison evidence
- final verdict: BUY / WAIT / SWITCH / SKIP

BUY is intentionally difficult:
checkout verification, complete landed cost, no mission overbuy, and evidence that the option is the best verified choice are all required.

The verifier defaults to dry-run and does not publish campaigns automatically.
Every non-dry-run verification writes an audit record to `hunt_promotion_verifications`.
The Deal Passport UI mirrors these truth gates for shoppers.
