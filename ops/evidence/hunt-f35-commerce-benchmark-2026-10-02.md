# HUNT F35 Commerce Benchmark — 2026-10-02

## Scope

PR26 / `launch/hunt-candidate-2026-09-29-v1` only. Source/code/schema benchmark plus current official public benchmark evidence from ASOS, SHEIN, H&M, Zara, NEXT and Temu. This is not a Production authorization.

Safety posture remains unchanged:
- Payment Live OFF
- Supplier Live Order OFF
- Profit Release OFF
- PayPlus paid callback acceptance OFF
- No Merge / Production without Owner Gate

Status legend:
- PASS = present and evidenced in HUNT
- PARTIAL = present but incomplete, immature, or not proven E2E
- GAP = not evidenced / missing
- BLOCKER = must close before real-money launch

## F35

| # | Capability / control | HUNT status | Evidence / action |
|---:|---|---|---|
| 1 | Final landed-cost truth: destination tax / customs / COO | BLOCKER | `FINAL_PROFIT_VERIFIED=0`; current EPROLO market rows remain destination-tax unverified. Do not infer duty from taxonomy. |
| 2 | Payment sandbox E2E | BLOCKER | Payment Live remains OFF; signed PayPlus callback/status/idempotent paid transition is not proven. |
| 3 | Supplier order -> tracking -> shipped E2E | BLOCKER | CJ authenticated sandbox fulfillment and EPROLO official order/tracking flow are not fully proven end-to-end. |
| 4 | Supplier freshness automation | BLOCKER | Shadow monitoring exists; live stock/price/shipping freshness loop is not yet proven end-to-end. Stale data must fail closed. |
| 5 | Legal operating identity + customer policy closure | BLOCKER | Business identity, support/privacy/returns details and final reviewed policy pages remain launch work. |
| 6 | Runtime DB/pooler reliability | PARTIAL | Previous load baseline exists, but transaction-pooler runtime remains unproven until Owner-Gated config/deploy/load retest. |
| 7 | Git required checks / branch protection | PARTIAL | CI passes on PR26, but branch protection itself remains unverified through current integration. |
| 8 | Security hardening | PARTIAL | Existing hardening evidence is good, but leaked-password protection / remaining security posture must be closed before launch. |
| 9 | Exact variant selection | PASS | PDP uses exact color/size variant selection and fail-closed cart eligibility. |
| 10 | Product gallery + zoom | PASS | PDP supports gallery and image zoom. |
| 11 | Verified product video | PASS | `product-flow.js` supports approved verified-relation YouTube/MP4 media. |
| 12 | Retail price truth + profit gate | PASS/PARTIAL | Design is fail-closed and only shows verified retail + profit PASS, but many products remain price/profit pending. |
| 13 | Stock + destination shipping truth | PARTIAL | Exact-variant Shadow checks work; current Gap12/Schoolwear sample has verified stock/shipping, but global live coverage/freshness is not complete. |
| 14 | Product facts: material/composition/care/origin | PARTIAL | PDP facts framework exists, but data completeness is insufficient; origin/COO is a current profit blocker. |
| 15 | Size guide with body/product measurements | GAP | No current PDP evidence of a customer size chart / measurement guide comparable to ASOS/SHEIN/NEXT. |
| 16 | Personalized size / Fit Assistant | GAP | No current HUNT fit recommendation flow comparable to ASOS Fit Assistant or SHEIN Check My Size. |
| 17 | Model sizing context | GAP | No current PDP evidence for model height + size worn, a common ASOS/SHEIN decision aid. |
| 18 | Structured fit feedback in reviews | GAP | Reviews exist, but no evidenced true-to-size / small-large / comfort / quality dimensions. |
| 19 | Review stars/comments/photos/moderation | PASS | HUNT supports 1–5 stars, comments, review photos and moderation. |
| 20 | Deep faceted filters | GAP | Current category UX has price filtering/sort, but no evidenced size/color/fit/material/rating/availability facet set comparable to H&M. |
| 21 | Price sort/filter | PASS | Category supports min/max price and price-low / price-high sorting. |
| 22 | Exact category/gender truth | PARTIAL | Multiple guards exist and recent semantic false positives were fixed, but taxonomy correctness still needs continued automated enforcement. |
| 23 | Search quality: autocomplete/synonyms/typo tolerance | PARTIAL | Basic search exists; no current evidence of rich autocomplete/suggestion/synonym/typo-tolerant search. |
| 24 | Personalized related products / endless discovery | PASS | HUNT ranks related products using category, preferences/signals, gender and price proximity, with endless discovery. |
| 25 | Saved / liked products | PASS | `hunt_product_actions` + profile Saved/Liked UX exists. |
| 26 | Shareable wishlist | GAP | Saved list exists but no current evidence of a customer share link comparable to Zara favourites sharing. |
| 27 | Back-in-stock notifications | GAP | No current evidence of restock email/notification flow comparable to Zara. |
| 28 | Low-stock customer messaging | GAP | No current evidence of size-level 'few units' customer messaging. |
| 29 | Search by image | GAP / LATER | No current evidence. Zara exposes image search in its app. Useful later, not a launch blocker. |
| 30 | Delivery promise / ETA before purchase | PARTIAL | Account order UI supports ETA after order data exists; PDP/checkout does not yet evidence a mature customer-facing destination ETA promise. |
| 31 | Returns/refunds self-service | PARTIAL | Returns/refund tables and customer pages exist, but operational E2E with provider/refund settlement is not fully proven. |
| 32 | Buyer-protection / delivery guarantee proposition | GAP / LATER | Temu prominently exposes delivery guarantee/return/refund promises. HUNT should only add guarantees after operations/legal/unit economics can support them. |
| 33 | Promotions / coupons / rewards customer UX | PARTIAL | Backend tables for campaigns/coupons/rewards exist, but no current checkout code evidence of a mature customer coupon/reward application flow. |
| 34 | Account, address save, order history, tracking timeline | PARTIAL | UI exists for profile, saved address, orders, carrier/tracking/ETA; real supplier E2E must still prove live data. |
| 35 | Internationalization / RTL / SEO/PWA foundation | PASS/PARTIAL | i18n includes EN/AR/HE/ES/FR and RTL for Arabic/Hebrew; Product JSON-LD/canonical, robots/sitemap/PWA assets exist. Full accessibility and translation completeness remain to be validated. |

## Critical F35 finding — supplier-name leakage

Customer-facing PDP intentionally displays `HUNT SOURCE`, but `profile.js` currently renders `row.provider` inside Saved/Liked product cards. Live `hunt_product_actions` currently contains rows whose provider value is `CJdropshipping`, so logged-in profile UI can expose a supplier name.

**Severity: HIGH customer-UX/privacy-of-sourcing defect.**

Required branch-only remediation before launch:
- replace raw provider label in customer profile cards with a neutral HUNT label;
- audit other customer-visible templates for raw provider/supplier names;
- add a regression test preventing known provider names from being rendered in customer UI.

## Leading-site benchmark observations

### ASOS
- model height + size worn;
- body-measurement size guide and international conversions;
- product fit/fabric details;
- fit/comfort/quality review context;
- personalized Fit Assistant on supported products.

### SHEIN
- product and body size charts in cm/in;
- fit type / stretch;
- model measurements;
- Check My Size / Fit Finder;
- aggregated buyer fit feedback such as small / true-to-size / large.

### H&M
- category facets for size, color, fit, product type, length, material, pattern and more.

### Zara
- favourites with shareable list;
- restock email notification for expected return;
- low-stock ('few units') messaging;
- cart availability warning;
- image search in app.

### NEXT
- size selection/guide;
- product sizing note;
- favourites;
- stock checker;
- detailed material/description information.

### Temu
- delivery guarantee messaging;
- returns/refunds support;
- price-adjustment proposition;
- order/support flows.

## Execution order

P0 — launch truth:
1. destination tax/customs/COO -> Final Profit truth;
2. PayPlus sandbox E2E;
3. supplier order/tracking E2E;
4. live freshness automation;
5. legal/security/pooler/branch-control closure.

P1 — customer trust and conversion before launch/early launch:
1. remove customer-visible supplier names;
2. size guide + measurement model;
3. deep filters;
4. fit-focused reviews;
5. back-in-stock + low-stock UX;
6. destination ETA messaging once reliable;
7. complete promotions/rewards customer UX only if economics support it.

P2 — differentiation after launch truth is stable:
1. personalized fit assistant;
2. shareable wishlist;
3. image search;
4. buyer-protection / price-adjustment propositions only if operations and economics can support the promises.

No safety gate was changed by this audit.
