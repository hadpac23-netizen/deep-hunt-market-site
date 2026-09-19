# BOOM M15 — Marketplace Brain — 2026-09-19

## Objective
Add an aggregate seller/product readiness brain above HUNT's existing Seller, Merchant Admin and Merchant Program workflows.

## Existing workflows reused
HUNT already contains:
- merchant application and store flows
- product submission
- admin review/moderation
- merchant program gate
- ad-placement request workflow

M15 does not duplicate those surfaces.

## Seller quality
The brain can evaluate approval/KYC, HTTPS domain, catalog and image quality, category/price clarity, inventory freshness, shipping/returns clarity and broken-link rate.

## Product eligibility
A product must have stable external ID, title, approved store/product states, passed safety, supported category and an HTTPS destination inside the approved store domain.

Submission never equals publication.

## System readiness
Before marketplace automation can progress, M15 requires a verified read-only marketplace snapshot adapter, merchant registry, review workflows, program gate, API-key security proof, revocation/rate-limit controls, attribution and payout controls.

## Current Studio state
The existing workflows are acknowledged as real.
M19 now supplies a read-only live count/status snapshot when its queries succeed. API-key security proof, revocation/rate-limit controls and payout readiness remain explicit blockers rather than being guessed from UI code.

## Invariants
AUTO_APPROVE_MERCHANTS: false
AUTO_APPROVE_PRODUCTS: false
PUBLISH_PRODUCTS: false
ACTIVATE_ADS: false
MERCHANT_PAYOUTS: false
EXECUTE_ACTIONS: false
OWNER_GATE: REVIEW_REQUIRED