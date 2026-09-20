# HUNT Final Candidate v1 — Consolidation Audit

Date: 2026-09-20  
Repository: hadpac23-netizen/deep-hunt-market-site  
Integration branch: `feature/hunt-final-candidate-v1`

## Baseline decision

Final Candidate v1 is based on PR #19 / `feature/boom-brain-orchestrator-v1` at commit:

`8a8560c88775ef164c892542a4f1ea033a55161f`

Reason: PR #19 is directly ahead of current `main` and therefore already includes the latest main-line F60T Live World Radar and Netlify production-credit guard. It also contains the current Brain OS, shared runtime, launch-readiness, payment/order safety, legal-readiness and critical-journey contracts.

This is an integration target only. It is not authorized for production deployment or live payments.

## Branch ancestry / collapse map

The audit verified these direct ancestry relationships:

- PR #16 `feature/hunt-hero4-urban-luxe` contains PR #15 `feature/hunt-home-3-structural`.
- PR #15 contains PR #14 `feature/hunt-visual-system-v2`.
- PR #7 `feature/boom-brand-factory-v1` contains PR #5 `feature/boom-connect-studio`.
- PR #4 `feature/hunt-supplier-gravity-v1` contains PR #1 `feature/hunt-cj-catalog-cleanup`.

Therefore #14, #15, #5 and #1 are historical source branches for consolidation and should not be merged independently into Final Candidate v1.

## Active source lanes

### Lane A — Brain / runtime foundation
Source: PR #19  
Status: BASELINE FOR FINAL CANDIDATE

Keep:
- BOOM Orchestrator and action/state contracts
- shared identity/session runtime
- single cart/action ownership
- like/save and guest merge behavior
- search/filter/product canonical actions
- checkout quote and commerce-truth gating
- PayPlus proof contract and safe callback policy
- order lifecycle contracts
- legal/business-identity readiness
- analytics/privacy contracts
- mission budgets, confidence decay, shadow mode, circuit breaker
- critical journey E2E contracts

### Lane B — Storefront / living commerce / growth UI
Source: PR #16  
Status: EXTRACT + RECONCILE INTO CANDIDATE

PR #16 is not an ancestor of PR #19. It diverged and changes many of the same storefront files.

Primary targets:
- latest HUNT Home / Hero / discovery experience
- product-finding and product-quality layers
- stylist surface
- personalization
- dynamic world / city experience
- commerce/growth modules that are still valid
- F50/F60T modules that do not duplicate Brain OS ownership

Conflict-sensitive files include:
`index.html`, `hunt-deal.js`, `hunt-shop.css`, `category.*`, `product.*`, `checkout.*`, `profile.html`, `analytics.js`, payment-session/callback functions.

Rule: do not wholesale merge PR #16 over PR #19. Reconcile file-by-file and preserve Brain OS contracts.

### Lane C — Supplier / voice / Brain-v2 historical implementation
Source: PR #4  
Status: SELECTIVE EXTRACTION

PR #4 already contains PR #1 catalog lineage.

Candidate material:
- Supplier Gravity
- supplier/category orchestration
- HUNT BOOM chat/voice/transcribe/speak
- learning loop and topic state
- model telemetry/chess
- security hardening that is not already superseded
- supplier-specific QA assets

Do not reintroduce duplicate Brain ownership where PR #19 now owns orchestration, identity, actions, commerce truth or governance.

### Lane D — BOOM Studio / Stylist / Brand Factory
Source: PR #7  
Status: SELECTIVE EXTRACTION

Candidate material:
- BOOM Studio professional workbench
- Stylist core/alpha and Taste DNA
- Brand Factory / creative QA
- media vault and visual QA
- HUNT 2037 shopper/supplier privacy and country-product truth
- city visual assets where still wanted

PR #5 is already contained in PR #7 and should not be merged separately.

### Lane E — Observability
Source: PR #6  
Status: RECONCILE AFTER STOREFRONT

PR #6 is a sibling of the Brand Factory line. Most user-facing files overlap with newer work, but privacy-safe analytics configuration still needs explicit reconciliation.

Keep only verified observability/privacy pieces not already present in PR #19 or PR #16.

### Lane F — Cinematic city hero
Source: PR #8  
Status: VISUAL EVIDENCE / SELECTIVE EXTRACTION ONLY

PR #8 diverged from its old Brand Factory base. Do not merge wholesale. Preserve only approved city-hero behavior/assets not superseded by the newer Hero 4.1 direction.

## Final Candidate integration order

1. PR #19 baseline — DONE by branch creation.
2. Reconcile PR #16 storefront onto Brain OS contracts.
3. Run storefront critical-journey QA.
4. Extract supplier/voice capabilities from PR #4 without duplicate Brain ownership.
5. Extract BOOM Studio/Stylist/Brand Factory capabilities from PR #7.
6. Reconcile PR #6 observability.
7. Review PR #8 visual-only deltas.
8. Run full browser/mobile critical journey matrix.
9. Run Launch Readiness and payment/order proof.
10. Owner review.
11. Only after explicit approval: merge/deploy decisions.

## Non-negotiable invariants

- No live payment activation during consolidation.
- No production deploy during consolidation.
- No supplier order from prelaunch.
- No fake stock, shipping, price, profit, tracking or quality evidence.
- No duplicate Brain ownership.
- No destructive PR closure until unique code is reconciled.
- Preserve Netlify preview-first / owner-gated production policy.
- Preserve latest main-line F60T runtime.
- Preserve owner approval for material external actions.

## Current status

`FINAL_CANDIDATE_V1 = INTEGRATION_IN_PROGRESS`

Next action: reconcile the storefront lane from PR #16 against the PR #19 Brain OS baseline, starting with the critical customer journey files and preventing regressions.
