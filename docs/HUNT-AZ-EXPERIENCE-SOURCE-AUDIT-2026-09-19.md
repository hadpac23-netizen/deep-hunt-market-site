# HUNT A→Z Experience Source Audit — 2026-09-19

## Baseline
- HUNT source commit: `3243e4b`
- BOOM Studio lane: A7 Release / Integration QA
- Audit mode: source baseline + safe local preview
- Production changed: false
- Payment changed: false
- Supplier ordering changed: false

## Summary
- Departments mapped: 18
- PASS: 5
- PARTIAL: 12
- BLOCKED: 1
- Known gaps: 38

This is not a launch score. PASS means the current source baseline contains enough evidence for that department's defined contract. PARTIAL and BLOCKED items require browser/backend evidence or implementation before they can be treated as complete.

## Strong areas already present
- Product loading with fail-closed cached fallback
- Price / availability Decision Check
- BOOM Product Truth Q&A
- Browse continuity from product back to the original card
- Like / Save state with anonymous-local and signed-in sync
- Review text/photo submission and moderation state
- Verified-media product video path
- Endless Discovery, Product Pulse and Deal Builder
- Mobile sticky add control
- Product-level shipping/returns links and truth boundaries

## Highest-priority current gaps

### P0 / external gates
- Real-money payment callback proof is incomplete.
- Live supplier ordering remains OFF.
- Supplier-order → tracking E2E remains incomplete.
- Return/cancellation self-service workflow is not live.

### P1 decision gaps
- Product gallery lacks explicit hidden-image count/signposting for large galleries.
- Zoom lacks previous/next media navigation.
- Size guide / fit guide is absent where category requires it.
- Per-variant stock state is not exposed.
- Structured device compatibility matrix is absent.
- Category-aware spec sheet is absent.
- Product-specific return eligibility is not proven.
- Verified delivery ETA is not available on PDP.
- Review rating distribution/filter/sort are absent.
- Share / native-share / copy-link is absent.
- Dedicated Recently Viewed surface is absent.

### P2 friction / quality
- Zoom focus trap is incomplete.
- Gallery arrow-key navigation is absent.
- Review negative-review discovery is weak.
- Verified-purchase review badge is unavailable without real order evidence.
- Review helpfulness is absent.
- 360-view path is absent.
- Video transcript/caption evidence is not checked.
- Quantity cap is hardcoded rather than stock-aware.
- Many PDP strings remain hardcoded English.
- Full RTL PDP evidence is missing.
- No real-user INP/LCP/CLS guard.
- Production funnel analytics still need final verification.
- Product-experience errors do not yet have a dedicated dashboard.

## Research-informed additions to test
- Image gallery must clearly reveal additional hidden media.
- Size selection should remain visible as buttons rather than hidden selection controls when size is a core variation.
- Return-policy access should remain close to the purchase decision.
- Negative reviews should be easy to discover and inspect.
- Product listings and PDP should expose category-specific decision attributes instead of generic filler.
- Rich comparison must remain factual and must not invent a winner.

## Next execution order
1. X08 Reviews
2. X06 Structured Specs
3. X09 Share
4. X13 Recently Viewed / hide feedback
5. X16 Accessibility + RTL
6. X17 Real-user performance guard
7. X18 Observability dashboard
8. X15 payment/order/tracking only after external gates are ready

X03 Gallery / Zoom is closed on HUNT commit `78fc0ad`.
X04 Variant stock truth is closed on HUNT commit `3243e4b`; X04 remains PARTIAL only because verified measurement charts and structured compatibility matrices are not currently supplied by the source.

## Definition of completion
No department moves to PASS without behavior evidence.
Every repair requires:
- source contract,
- desktop browser QA,
- mobile 390 QA,
- applicable keyboard/accessibility QA,
- regression test,
- Git rollback point.
