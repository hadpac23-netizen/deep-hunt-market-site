# BOOM M11 — Personalization Brain — 2026-09-19

## Objective
Turn HUNT personalization from scattered preference signals into a measurable, privacy-safe ranking contract.

## Existing foundation reused
HUNT already has:
- explicit shopping preferences
- local and signed-in preference continuity
- likes and saves
- behavioral category signals
- recommendation impression analytics hooks
- Commerce Brain context and recommendation strategy

M11 does not replace those systems. It becomes the independent ranking and readiness layer above them.

## M11 ranking order
1. safety and hidden-product checks
2. market eligibility
3. explicit shopping preference
4. behavioral category affinity
5. like/save intent
6. price-band match
7. verified product truth and stock
8. source freshness and media quality
9. duplicate/repeat penalties
10. verified profit as a small tie-break only
11. diversity caps
12. controlled exploration

## Privacy
M11 rejects sensitive profile fields and does not use them in ranking.
Reduced personalization mode ignores explicit/behavioral affinity and falls back to verified product quality.

## Measurement gate
Personal ranking remains OFF until:
- recommendation impressions are measurable
- downstream outcomes are measurable
- a non-personalized holdout exists
- market eligibility is explicit per candidate
- Product Truth is available
- preference reset/privacy controls remain available

## Studio state
M11 is currently a read-only PREPARE layer.
It may simulate cold-start ranking against catalog data, but it does not alter the live storefront ranking.

## Invariants
RANKING_ENABLED: false
EXTERNAL_ACTIONS: false
EXECUTE: false
OWNER_GATE: REVIEW_REQUIRED