# HUNT F35 Red Team Rerun — 2026-10-02 v2

Scope: PR26 / `launch/hunt-candidate-2026-09-29-v1`.

This rerun supersedes older F35 status text where current live evidence differs. It is an audit/evidence update only. It does not authorize Merge, Production deployment, Payment Live, Supplier Live Order or Profit Release.

## Safety state reverified

Live runtime controls:
- Payment Live: OFF / owner_approved=false
- PayPlus paid callback acceptance: OFF / owner_approved=false
- Supplier Live Order: OFF / owner_approved=false
- Profit Release: OFF / owner_approved=false

Live catalog truth:
- `hunt_shelf_candidates`: 26,375
- sellable rows: 0
- production-effect rows: 0
- source rows claiming `final_profit_verified=true`: 0

Live commerce E2E truth:
- paid payment sessions: 0
- PayPlus status observations: 0
- fulfillment rows with tracking: 0
- fulfillment rows in shipped status: 0

Freshness scheduler truth:
- active `pg_cron` jobs containing freshness: 0

Security advisor truth:
- 1 current security WARN: Supabase leaked-password protection disabled.
- No new critical HUNT public-table security advisor finding was returned in this rerun.

Git governance truth:
- PR26 remains Draft / open / unmerged.
- repository rulesets endpoint currently returns 0 rulesets.
- classic branch-protection endpoint is not readable through the current integration (403), so classic branch protection is UNVERIFIED here; do not infer PASS or FAIL solely from this integration.

Legal identity truth:
- legal entity, registration number, registered country, business address, support email and privacy contact are present.
- latest identity row remains `draft`, `owner_approved=false`.
- returns address is not present.

## F35 rerun

Status legend:
- PASS = code/data path evidenced for the exact claim.
- PARTIAL = implemented or evidenced in part, but incomplete or not proven E2E.
- GAP = not evidenced / intentionally not fabricated.
- BLOCKER = must remain open before real-money launch.

| # | Capability / control | Current status | Red Team conclusion |
|---:|---|---|---|
| 1 | Final landed-cost truth: destination tax / customs / COO | BLOCKER | `Final Profit Verified = 0`. Do not infer COO, HS classification, customs duty or destination tax from taxonomy or reserves. |
| 2 | Payment sandbox E2E | BLOCKER | Payment Live is OFF; live DB has 0 paid sessions and 0 PayPlus status observations. Signed callback/status/idempotent paid-transition proof remains absent. |
| 3 | Supplier order -> tracking -> shipped E2E | BLOCKER | Live DB has 0 fulfillment rows with tracking and 0 shipped. CJ sandbox and EPROLO execution proof remain incomplete. |
| 4 | Supplier freshness automation | BLOCKER | Runner/watcher design exists and default is dry-run, but there is no active freshness cron. In addition, current persistence performs observation insert and exception reconciliation as two writes without evidence-order conditioning; a delayed PASS can theoretically resolve a newer HOLD/RETRY. Fix atomic/versioned reconciliation before enabling scheduled persistence. |
| 5 | Legal operating identity + customer policy closure | BLOCKER | Core identity/contact fields exist, but latest row is draft, not owner-approved, and returns address is absent. Prelaunch pages do not equal real-money legal closure. |
| 6 | Runtime DB/pooler reliability | PARTIAL | Historical load baselines exist. Current runtime/pooler closure is not proven for the launch state. Supabase current guidance favors transaction pooling for Edge/serverless and `prepare:false`; do not close this item without post-deploy load evidence. |
| 7 | Git required checks / branch protection | PARTIAL / UNVERIFIED | CI is present. Rulesets=0. Classic protection cannot be read by this integration. Required-check enforcement is therefore not claimed closed. |
| 8 | Security hardening | PARTIAL | Security posture is materially hardened, but leaked-password protection is still disabled. Performance advisor also reports HUNT RLS/index efficiency debt; treat that as scale debt, not a security exploit without further evidence. |
| 9 | Exact variant selection | PASS | PDP/checkout use exact variant identity and fail-closed readiness. |
| 10 | Product gallery + zoom | PASS | PDP gallery/thumbnail/zoom path is implemented. |
| 11 | Verified product video | PASS | Verified-relation video path exists; do not claim video for products without approved media. |
| 12 | Retail price truth + profit gate | PARTIAL | Fail-closed retail/profit gates exist. Global coverage remains incomplete and final landed-profit truth is still blocked by #1. |
| 13 | Stock + destination shipping truth | PARTIAL | Exact-variant checks exist, but freshness is not globally scheduled/proven and stale truth must remain fail-closed. |
| 14 | Product facts: material/composition/care/origin | PARTIAL | PDP facts framework exists. Data completeness, especially COO/customs-grade origin, remains insufficient. |
| 15 | Size guide with body/product measurements | GAP / DATA-GATED | Do not create generic/fake charts. Current candidate data is too sparse for a catalog-wide measurement guide. |
| 16 | Personalized size / Fit Assistant | GAP | No verified measurement/body-fit model sufficient for a truthful fit recommendation flow. |
| 17 | Model sizing context | GAP | No reliable catalog-wide model height/size-worn evidence. |
| 18 | Structured fit feedback in reviews | GAP | General reviews exist; true-to-size/small-large/comfort-quality dimensions are not yet evidenced. |
| 19 | Review stars/comments/photos/moderation | PASS | Review and moderation primitives exist. |
| 20 | Deep faceted filters | PARTIAL / DATA-GATED | Price filtering/sort exist. Size/color/material/fit/rating facets must appear only where normalized verified attributes exist. |
| 21 | Price sort/filter | PASS | Current category UX supports price bounds and price sorting. |
| 22 | Exact category/gender truth | PARTIAL / HIGH WATCH | Canonical category contracts are strong, but Home still carries legacy shelf slugs plus title-regex shelf fitting. This creates taxonomy-drift risk separate from canonical Category-page tests. Do not mark taxonomy globally closed until Home is bound to the same canonical contract or receives equivalent regression coverage. |
| 23 | Search quality: autocomplete/synonyms/typo tolerance | PARTIAL | Basic search exists; rich typo/synonym/autocomplete quality is not proven. Exact taxonomy must not be weakened by fuzzy matching. |
| 24 | Personalized related products / discovery | PASS | Related-product ranking and discovery signals exist. |
| 25 | Saved / liked products | PASS | Saved/Liked account UX exists. Customer-visible raw provider labels were removed from profile. |
| 26 | Shareable wishlist | GAP | Saved list exists; no verified customer share-link workflow. |
| 27 | Back-in-stock notifications | GAP | No exact-variant restock subscription/notification E2E is proven. |
| 28 | Low-stock customer messaging | GAP | Do not create urgency messaging until exact-variant fresh inventory supports it. |
| 29 | Search by image | GAP / LATER | Not launch-critical and not currently evidenced. |
| 30 | Delivery promise / ETA before purchase | PARTIAL | Tracking/ETA fields exist after order data, but trustworthy destination ETA before purchase is not globally proven. |
| 31 | Returns/refunds self-service | PARTIAL | Tables/pages/refund-preview paths exist; provider/payment settlement E2E and returns-address closure remain incomplete. |
| 32 | Buyer-protection / delivery guarantee proposition | GAP / LATER | Do not display guarantees until legal, operational and economics evidence can support them. |
| 33 | Promotions / coupons / rewards customer UX | PARTIAL | Backend primitives exist; mature checkout application and Profit-Gate interaction remain incomplete. |
| 34 | Account, address save, order history, tracking timeline | PARTIAL | Customer UI exists, but supplier tracking/shipped E2E has 0 live proof rows. |
| 35 | Internationalization / RTL / SEO / PWA foundation | PASS / PARTIAL | EN/AR/HE/ES/FR, RTL foundations, structured metadata and PWA exist. Recent cache/privacy hardening passes CI; full translation/accessibility completeness is not yet proven. |

## Cross-cutting findings

### A. Supplier privacy — customer UI PASS, secrecy PARTIAL

The customer-facing Home/Profile/PDP paths now use HUNT-neutral labels and opaque `src` product URLs. This closes the ordinary customer-visible provider-name leak.

However, provider identity is still present inside browser-side code/data paths because routing/cart/fulfillment logic currently uses it. `storefront-privacy.js` itself contains provider-to-alias mappings, and browser data structures can retain provider values. Therefore:
- claim: **customer UI supplier-name privacy = PASS**;
- do not claim: **supplier identity is cryptographically/server-side secret from a technical user**.

If full source secrecy becomes a requirement, provider resolution must move behind server-side opaque source IDs rather than shipping provider mappings to the browser.

### B. Home taxonomy drift

`category.html`/canonical taxonomy are governed by the 50-shelf contract, but Home shelf rendering still uses a legacy shelf map and regex-based filtering. This can pass canonical tests while still producing a Home-only categorization mistake.

Required closure options:
1. make Home consume the same canonical taxonomy contract; or
2. add a strict Home taxonomy contract + semantic regression suite proving each Home shelf maps only to approved canonical department/shelf semantics.

### C. Freshness ordering race

Before scheduled persistence is enabled, make freshness observation + exception state a recoverable atomic/versioned operation. At minimum, a state transition must carry one evidence timestamp/version and must never allow an older observation to overwrite or resolve a newer exception.

## Execution order after this rerun

P0:
1. Fix freshness ordering/atomicity in PR26, keep scheduler disabled.
2. Destination Tax / Customs / COO -> Final Profit truth.
3. PayPlus sandbox signed callback/status/idempotent transition.
4. Supplier sandbox/order -> tracking -> shipped E2E.
5. Pooler/runtime load proof.
6. Legal owner approval + returns-address/disclosure closure.
7. Security final review and leaked-password protection decision.
8. Git protection/required-check enforcement verification under an account with sufficient repository permissions.

P1:
- unify Home taxonomy with canonical contract;
- verified-only Size Guide / facets;
- structured fit reviews;
- restock / low-stock / ETA only from fresh exact-variant truth;
- search quality improvements without taxonomy mixing.

## Gate

Payment Live OFF · PayPlus Paid Acceptance OFF · Supplier Live Order OFF · Profit Release OFF · no Merge / Production without explicit Owner Gate.
