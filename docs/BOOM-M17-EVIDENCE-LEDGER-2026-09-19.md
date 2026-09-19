# BOOM M17 — Evidence Ledger — 2026-09-19

## Objective
Separate implemented capability from decision-grade evidence.

## Evidence states
- VERIFIED: direct source, available, truth checks pass, required count exists and freshness passes
- STALE: direct evidence exists but freshness is no longer decision-grade
- PARTIAL: direct evidence exists but a truth/count requirement fails
- STRUCTURAL: code, static audit or framework exists but it is not direct outcome evidence
- MISSING: required proof source is unavailable

Only VERIFIED domains are usable for automated decision reasoning.

## Direct evidence classes
M17 recognizes direct database observations, owner functions, verified webhooks and signed providers as potential direct evidence.

## Current Growth Studio sources
The Studio maps evidence from:
- hunt_catalog_products
- hunt_unit_economics
- hunt_deal_candidates
- hunt_marketing_experiments
- hunt_boom_world_ideas
- hunt_business_identity
- product actions/orders/fulfillment observations
- creator/distribution/conversion/rights observations

Static SEO audit and runtime-only personalization/source-verification layers remain structural until direct measured evidence exists.

Marketplace snapshot and canonical paid attribution remain missing until their verified adapters are connected.

## Safety
M17 is read-only.
It does not fetch new evidence, write databases, publish, spend, send, pay or execute external actions.

## Invariants
USABLE_FOR_DECISION requires VERIFIED.
EXECUTE_ACTIONS: false
EXTERNAL_PUBLISH: false
OWNER_GATE: REVIEW_REQUIRED