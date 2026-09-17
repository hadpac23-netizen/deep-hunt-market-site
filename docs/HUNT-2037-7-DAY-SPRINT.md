# HUNT 2037 — 7-Day Fast Sprint

Status: aggressive execution target, not a production guarantee
Start date: 2026-09-18
Branch: feature/boom-brand-factory-v1

## Sprint target

By the end of the sprint, aim to have **HUNT 2037 Alpha** working behind feature flags with:
- BOOM Studio brain routing complete,
- Decision Brain connected,
- Country/Product Truth normalization,
- HyperSKU integration foundation,
- Memory/Like/Save/Share event backbone,
- dynamic HUNT Flow,
- at least 3 HUNT Worlds,
- dynamic HUNT identity + night-city prototype,
- BOOM Stylist alpha,
- BOOM Mirror architecture/MVP foundation,
- existing checkout preserved,
- production replacement still owner-gated.

The goal is a convincing working Alpha, not every long-term HUNT 2037 feature.
## Speed rules

1. Parallelize independent workstreams.
2. Reuse current modules; do not rewrite proven systems.
3. Feature-flag all major visual/intelligence changes.
4. One vertical slice must work end-to-end before expanding.
5. HyperSKU uses official Open API/integration only.
6. No live fulfillment, spend, or production switch without required gates.
7. No fake product/stock/shipping data.
8. Use current storefront as rollback/fallback.
9. Prefer tests + adapters over broad refactors.
10. Defer non-critical polish until Alpha is coherent.

## Parallel lanes

### Lane A — Brain
Decision, capability states, routing, learning, freshness.

### Lane B — Commerce
HyperSKU, CJ, EPROLO, Country Brain, Product Truth, shipping, economics.

### Lane C — Experience
Dynamic Flow, Worlds, HUNT wordmark, night-city layer, performance.

### Lane D — Personal
Memory, Share, Stylist, Look Locker, Mirror contracts.

Each lane reports to BOOM Executive.
## Day 1 — Brain + HyperSKU contract

### Brain
- finalize manager ownership for all HUNT 2037 capabilities,
- normalize event contract,
- connect Decision Brain adapter behind a flag,
- add capability health/debug view contract.

### HyperSKU
- define HyperSKU supplier adapter contract,
- auth/config placeholders only; no secret values committed,
- map product identity / SKU / variant,
- map stock/freshness,
- map shipping quote inputs/outputs,
- map order/tracking state contracts,
- add HyperSKU provider normalization everywhere required.

### Verification
- supplier contract tests,
- Decision Brain regression,
- existing BOOM Executive tests,
- no production changes.

Exit:
HyperSKU is a first-class supplier in code architecture, even if live credentials are not yet connected.
## Day 2 — Country Brain + Product Truth

Normalize one shared candidate object:
- provider,
- item_id,
- sku,
- variant,
- warehouse,
- country,
- stock,
- stock_checked_at,
- product_cost,
- shipping_cost,
- ETA,
- landed_cost,
- restrictions,
- returns state,
- margin,
- truth_status.

Connect candidate normalization to Decision Brain.

HyperSKU rule:
country/SKU availability must come from live integration/quote evidence when connected.
Do not infer "nearby warehouse" from supplier marketing.

Exit:
stale/ineligible/unprofitable candidates cannot silently enter normal ranking.
## Day 3 — Event Backbone + Memory + Share

Implement event schema:
- impression
- product_view
- dwell
- like
- save
- share
- skip
- not_interested
- world_enter
- look_save
- try_on
- cart
- purchase
- return
- watch

Implement Alpha surfaces:
- recent history,
- liked,
- saved,
- shared,
- session continuity,
- share-card data contract.

Connect event signals to Taste DNA/Decision inputs.

Exit:
real behavior changes recommendations in a testable way.
## Day 4 — Dynamic HUNT Flow

Build experimental HUNT 2037 route/surface behind feature flag.

Include:
- hero/editorial unit,
- product cluster,
- NEW unit,
- personalized unit,
- adjacent unit,
- controlled wildcard,
- stable Shop CTA,
- stable product facts,
- Search access,
- Like/Save/Share.

Add first 3 Worlds:
- Fashion,
- Jewelry,
- Tech or Home.

Exit:
one complete dynamic session works on mobile and desktop without touching checkout.
## Day 5 — Visual identity + cities + Stylist

### HUNT identity
Prototype dynamic HUNT wordmark:
- subtle movement,
- controlled color changes,
- world-aware state,
- reduced-motion fallback.

### Night City Layer
Create licensed/original asset contract and placeholders/reference slots for:
- Dubai,
- London,
- Tokyo,
- New York,
- Singapore,
- Hong Kong,
- Paris,
- additional cities.

Implement:
- atmospheric background layer,
- parallax/slow crossfade,
- performance fallback,
- world-aware transitions.

### BOOM Stylist Alpha
- Complete the Look,
- Occasion Mode,
- build under budget,
- Look Locker contract,
- Why This Suits You.

Exit:
HUNT visibly feels different, but stays fast and readable.
## Day 6 — BOOM Mirror foundation

Build M0/M1 foundation:
- photo consent contract,
- retention choice,
- delete/no-retention behavior,
- body-anchor schema,
- accessory product-anchor schema,
- Focus Engine rules,
- Mirror session state,
- Save/Share/History integration.

First accessory focus modes:
- necklace,
- earrings,
- ring,
- sunglasses,
- hat.

If generation provider integration is not ready, keep rendering provider abstracted and test the full orchestration with non-deceptive internal fixtures only.

No body scoring.
No exact-fit claims.

Exit:
Mirror architecture is working and UI flow can be exercised safely.
## Day 7 — Integration + QA + Alpha decision

Run full integration:
- BOOM brain routing,
- HyperSKU/CJ/EPROLO supplier abstraction,
- Decision Brain,
- Country/Product Truth,
- Memory,
- Share,
- Dynamic Flow,
- Worlds,
- Stylist,
- Mirror foundation,
- Visual identity.

QA:
- mobile,
- desktop,
- keyboard,
- reduced motion,
- performance,
- console,
- broken buttons,
- dark mode regressions,
- like/save regressions,
- product truth,
- fallback storefront,
- checkout untouched.

Produce:
- Alpha readiness report,
- known gaps,
- blocked integrations,
- owner-gated actions,
- rollback plan.

No production switch as part of the sprint unless separately approved after evidence.
## HyperSKU Alpha Definition of Done

HyperSKU counts as integrated at Alpha when:
- provider normalization works,
- supplier adapter contract exists,
- auth/config path is defined,
- products map to HUNT canonical product objects,
- SKU/variant identity survives mapping,
- stock/freshness fields map correctly,
- shipping quote contract supports country destination,
- tracking/order status mapping exists,
- errors/fallbacks are explicit,
- Decision Brain can consume HyperSKU candidates,
- no unsupported country is shown as eligible.

Live fulfillment is a separate gate.

## What can be deferred beyond Alpha

- full persistent avatar,
- real-time video try-on,
- every world/category,
- every city,
- Shop Together full release,
- referral economics,
- every supplier,
- advanced merchant marketplace,
- full production replacement.

These are not allowed to block a coherent Alpha.
## Daily release discipline

At the end of each day:
1. tests must pass,
2. commit only coherent changes,
3. update capability truth states,
4. record blockers,
5. keep fallback working,
6. do not merge to production without gate.

## Sprint success test

The sprint is successful when a user can open the experimental HUNT 2037 experience and:
- see a dynamic world,
- receive real eligible products,
- interact with Like/Save/Share,
- return to recent history,
- move between worlds,
- receive explainable recommendations,
- use an early Stylist flow,
- enter the Mirror flow safely,
- shop through the existing stable commerce path.

BOOM Studio must simultaneously know what is REAL, PARTIAL, PLANNED, BLOCKED, or OWNER-GATED.
