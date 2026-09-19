# BOOM M07 — Creator OS — 2026-09-19

## Objective
Build the commercial control plane for creator commerce before HUNT recruits, publishes, boosts or pays creators.

## Live schema finding
HUNT/BOOM currently has adjacent infrastructure, but not a creator-commerce registry.

Existing:
- creator_earnings — BOOM gift/coin earnings, not HUNT creator-commerce attribution
- merchant_conversion_events — merchant/affiliate conversion infrastructure, not creator-specific attribution
- hunt_distribution_drafts — generic distribution drafts
- hunt_partner_matrix — partner integration/media-rights fields

Missing as a proven creator-commerce system:
- creator commercial registry
- creator content-rights ledger
- creator attribution registry
- creator-specific economics ledger
- confirmed creator conversion source

## Live aggregate snapshot
Read-only database snapshot:
- BOOM creator earnings rows: 0
- generic merchant conversion rows: 0
- confirmed merchant conversion rows: 0
- creator-channel distribution drafts: 0
- published distribution drafts: 0
- partner media-rights verified rows: 0
- partner matrix rows: 8

Partner rights and generic merchant conversions are deliberately not counted as creator evidence.

## Implemented M07 core
boom-creator-os.js separates four independent controls:

### Rights
Checks asset verification, usage rights, channel, country, expiry, paid-media permission and edit/remix permission.

### Economics
Calculates total creator-related cost from:
- creator commission
- affiliate commission
- coupon cost
- platform fee
- content fee
- refund reserve
- chargeback reserve
- support cost

A missing cost remains unknown; it is never silently converted to zero.

### Attribution
Requires:
- creator attribution key
- event-id persistence
- click/referral identity
- confirmed conversion source

Performance and commission claims are forbidden until attribution is ready and confirmed conversions exist.

### Scale
Requires confirmed conversion sample plus observed net contribution, refund rate and chargeback rate.

## States
DRAFT
RIGHTS_HOLD
ECONOMICS_HOLD
ATTRIBUTION_HOLD
OWNER_HOLD
TEST_CANDIDATE
SCALE_CANDIDATE

## Growth OS
M07 owner panel reads aggregate counts only.
It explicitly labels generic merchant conversions and partner media rights as non-creator evidence.

## Current expected state
M07 = HOLD.

That is correct because no creator-specific registry/rights/economics/attribution evidence exists yet.

## Invariants
CREATOR_PUBLISH: false
CREATOR_PAYOUT: false
CREATOR_OUTREACH: false
PAID_BOOSTING: false
EXECUTE_ACTIONS: false
PRODUCTION_CHANGED: false
OWNER_GATE: REVIEW_REQUIRED
