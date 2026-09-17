# HUNT 2037 — Phase 0 Architecture Audit

Date: 2026-09-18
Branch: feature/boom-brand-factory-v1
Status: Foundation audit before UI rewrite

## Existing reusable systems

- market-core.js: category model, device-level shopping signals, personalScore, core routing helpers.
- skills/boom-personalization-brain.md: cold start, diversity, novelty, privacy, holdout guidance.
- skills/boom-commerce-brain.md: hard truth rules, ranking pipeline, merchandising, AOV playbook.
- boom-deal-builder.js: complementary-category graph and bundle persistence.
- boom-love-engine.js: engagement quality signal.
- supplier-gravity.js: supplier-level ranking influence.
- product-world.js / category.js: existing product ranking surfaces.
- Brand Factory + Visual QA + Media Vault: approved creative pipeline foundation.

## Key gap

Ranking logic is distributed across multiple modules.
There is no single explainable decision contract for:
country eligibility + truth + taste + quality + shipping + freshness + novelty + creative performance + margin + repetition.

The first new foundation is therefore BOOM Decision Brain.
## New modules required

1. BOOM Decision Brain
2. Country Brain normalization layer
3. HUNT Memory / History
4. Share Graph + referral ledger
5. Trust Layer
6. Experiment Engine
7. Post-Purchase Brain
8. HUNT Continuity
9. Customer personalization controls
10. Global localization layer
11. Performance/adaptive-media brain
12. Fraud/reward abuse protection

## First vertical slice

Build a pure, testable decision module before UI integration.

Inputs:
- verified product truth
- market/shipping eligibility
- taste relevance
- quality/trust
- freshness/novelty
- creative performance
- margin as a constrained tie-break signal
- recent exposure/fatigue

Outputs:
- eligible / blocked
- score 0..100
- discovery lane
- reason codes
- score components
- human-readable explanation

No production UI changes in this slice.
## Cold-start rule

Do not aggressively personalize new users.

Modes:
- cold_start: fewer than 5 interactions
- learning: 5–19 interactions
- personalized: 20+ interactions

Discovery lanes are deterministic patterns that mix:
- quality
- personalized
- adjacent
- new
- wildcard

The exact lane percentages remain experimentable.

## Guardrails

- Safety and market eligibility are hard gates.
- RECHECK_REQUIRED products cannot rank as live.
- Margin cannot overpower relevance, quality, trust, or shipping.
- Recent product/category/supplier repetition gets penalized.
- Wildcards still require Product Truth and quality.
- No sensitive-trait inference.
- No autonomous spend or publishing.

## Next integration

After tests pass:
1. expose Decision Brain to selected storefront surfaces behind a feature flag,
2. feed current HuntCore signals into normalized inputs,
3. add History/Share event capture,
4. build one dynamic HUNT Flow prototype,
5. keep current production experience as fallback.
