# HUNT Experience Audit Skill

## Mission
Audit HUNT end to end as a shopper-facing system, not as isolated pages. Map every feature to expected behavior, observed evidence, gaps, severity, repair and regression.

## Scope
Audit these departments:
- Entry, navigation and browse continuity
- Search and category discovery
- Product loading and fallback
- Gallery, zoom and media
- Variants, size, fit and compatibility
- Price, availability and Product Truth
- Product details and specifications
- Shipping, returns and policy confidence
- Ratings and reviews
- Like, Save and Share
- BOOM Product Truth / Q&A
- Deal Builder and complementary shopping
- Cross-sell and recently viewed
- Quantity, cart and checkout
- Payment, supplier order, tracking and returns
- Mobile, accessibility and i18n
- Performance and PWA
- Analytics, observability, security and legal boundaries

## Required test modes
For each feature test:
1. Happy path
2. Empty/no-data path
3. Error/provider-failure path
4. Stale/cached-data path
5. Recovery path
6. Mobile 390
7. Tablet 768
8. Desktop 1440
9. Keyboard-only when interactive
10. Reduced motion when animated

## Evidence rule
Never mark PASS because a control exists in HTML.
PASS requires observed behavior matching the expected contract.

Evidence may include:
- source contract
- browser output
- DOM state
- console state
- network request/response
- database evidence
- screenshot
- regression test result

## Status vocabulary
- PASS: behavior proven
- PARTIAL: core exists but important coverage or evidence is missing
- MISSING: expected capability is absent
- BLOCKED: capability cannot be safely completed until an external gate is resolved
- NEEDS_EVIDENCE: implementation may exist but has not been proven

## Severity
- P0: breaks purchase truth, safety, payment/order integrity, or creates severe failure
- P1: blocks a meaningful shopper decision or journey
- P2: causes friction, uncertainty or avoidable work
- P3: polish, discoverability or refinement

## Hard rules
- No fake price, discount, stock, delivery, rating, popularity or scarcity.
- Missing data remains unknown.
- No Production, payment, supplier-order, publishing or spend change during audit.
- Do not weaken a guard merely to make a test pass.
- Fix the smallest root cause.
- Every repair requires regression.
