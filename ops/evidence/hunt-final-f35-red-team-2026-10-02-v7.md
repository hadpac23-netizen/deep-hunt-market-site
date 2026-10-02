# HUNT fresh F35 Red Team - 2026-10-02 v7

Outcome: BLOCKED. HUNT is not RED TEAM CLOSED or READY FOR OWNER GATE. Current public prelaunch has unresolved P0 cost/margin exposure, exact-shelf/search failures and source/runtime drift. Branch remediation is tested and preserved; it has not been deployed.

Code under review: 0e688573b9ee5da3ca7808a491b9d35e28d9b7bb. Git tree equals the tested local tree 503b6bde7135f5e3e9cb74e215bf077f9c6d9ad0. This report is a later evidence-only revision; final PR HEAD/checks must be re-read after its commit. Initial truth was rebased from actual PR HEAD 12b8b16f870c36269d1620f5cc743de371a4f4c6, never from the stale PR-body SHA.

## Verified safety and commerce

Closing SQL at 2026-10-02T19:28:08.088954+00:00: all four live gates false and unapproved; 26,375 candidates, sellable=0, production_effect=0, final_profit_verified=true=0; 2,960 shadow prices, sellable=0; 33 sessions, sandbox=0, paid=0; PayPlus signed/ipn-full/accepted observations=0; 10 test orders/fulfillment rows, supplier IDs/tracking/shipped=0. Business identity presence is verified but approval remains draft/false. No private business identity/address or customer PII appears in this evidence.

No merge, production deploy, live supplier/payment transaction, live cron, credentials change or gate update occurred. CLI push lacked authentication; the connected GitHub Git-data API wrote the exact tested tree and updated only the candidate branch with force=false. All 15 review threads resolved; no unresolved review thread on the code commit.

## Findings and tested fixes

1. False tax/final-profit readiness: stale/wrong/missing customs evidence, null tax coerced to zero, self-proposed retail and partial variant coverage. Shared exact/fresh guard fixes this; 43 adversarial tests include three actual product-handler executions with synthetic DB/provider fixtures. No fixture is real supplier/customs evidence.
2. Public supplier cost/margin P0: public women shard exposes 5.17 cost, 4.83 projected profit and .5296 margin; Home and recommendations display supplier prices. Branch strips financial evidence at both storefront/search boundaries, sanitizes all 53 public catalog artifacts, rejects stale-price promotions/recommendations and rotates cache. Seven executable privacy tests include the actual search handler. Runtime remains FAIL.
3. Expired PayPlus evidence: branch now rejects expired/unverifiable/inactive sessions before ipn-full. Live callback v16 still differs from POST-only/signed-body branch. Real sandbox callbacks and exactly-once paid transition are not proved; current acceptance always remains false.
4. Honest runtime truth: old PASS browser reports were superseded. No current mobile-390 or authenticated E2E PASS is claimed. Supabase v142 retrieval returned an import wrapper, not the imported full runtime; source identity is not proven by that alone.

All local tests: 371 PASS. Exact workflow suites: Checkout 195 PASS; Catalog 98 PASS. Remote code-commit CI: Checkout #358 success (37054129609), Catalog #373 success (37054129653), CodeRabbit success. No Deno deployment or full Deno typecheck was performed; five changed Edge entrypoints pass TypeScript stripping/syntax validation. Final documentation commit needs fresh HEAD/check verification, recorded in the delivered report.

## Browser evidence from this run

Public target: https://hunt-pr26-prelaunch--deep-hunt-market.netlify.app
Desktop viewport was observed at 1363x936; saved screenshots render at 1348x928. No 390px resize capability was available. Local branch server could not be loaded in the cloud browser (ERR_BLOCKED_BY_CLIENT); this is a browser/network restriction, not site bot detection. Public preview scripts were older (stable1/redteam1/pwa6) than branch (stable4/redteam3/pwa7 plus this cost-privacy revision).

- Home: catalog/fallback/products render, but supplier-price promotions and taxonomy contamination remain visible in the old preview. Header layout overlap observed.
- Category: Women -> exact Women's Dresses showed 0 / Failed to fetch. Legacy Dresses & Skirts fallback loaded; min/max filter action returned products.
- PDP: Home -> All-Over Print Women's Athletic T-Shirt (src=s3&id=329) loaded images, description and 7 sizes. Selected M; quantity action exercised. Price pending/Checkout setup pending stayed disabled. This direct Edge-backed result succeeded despite failing public Netlify API routes.
- Checkout: empty cart -> Verify price & shipping returned Your cart is empty; payment button disabled. No address/PII/payment submitted.
- Auth/Profile: sign-in shell visible, 0 password inputs; guest profile redirects to auth. Authenticated Saved/Likes/Orders remain unverified.
- Search: denim jacket -> public parser error from HTML returned instead of JSON. Branch replaces raw parser detail with temporary-unavailable customer text; deployment and actual search response remain unproved.
- Console: multiple GoTrueClient warnings recorded. Chrome-extension metadata errors were excluded from app findings.

New screenshots are delivered with the PDF: exact-shelf failure, PDP/variants and blocked Checkout. Historical screenshots are not reused as current branch evidence.

30-request public Netlify API baseline, concurrency 3: 30 errors, 0 timeouts, p50 6645.44 ms, nearest-rank p95 13766.23 ms. This is a FAIL of those prelaunch proxy routes; it is not a Pooler test or evidence that every direct Edge/PDP request fails.

## F35 matrix

| # | Area | Status | Current evidence / limitation |
|---:|---|---|---|
| 1 | Payment | PASS | Fresh SQL: hunt_payment_live=false; owner_approved=false. |
| 2 | Supplier Live | PASS | Fresh SQL: hunt_supplier_order_live=false; owner_approved=false. |
| 3 | Profit Release | PASS | Fresh SQL: hunt_finance_profit_release=false; owner_approved=false. |
| 4 | Paid callback | PASS | Fresh SQL: hunt_payplus_callback_accept_paid=false; accepted_paid=0. |
| 5 | Owner Gate | PASS | PR26 Draft/open/unmerged; no live activation, merge, production deploy or cron change. |
| 6 | Exact variants | PARTIAL | TAX8 exact item/variant matrix re-queried; adversarial mismatches fail in branch. Current supplier freshness/order namespace proof incomplete. |
| 7 | Stock | BLOCKED | TAX8 quote snapshots from Sep 28; no current 30-minute provider observations or completed runtime rotations. |
| 8 | Shipping | BLOCKED | Exact destination/service guard fixed; current shipping recheck and landed-cost proof absent. |
| 9 | Retail price | BLOCKED | Historical price/floor does not prove market-valid approved retail; no price was inflated or activated. |
| 10 | Supplier cost | FAIL | Current public shard exposes supplier cost and margin. Branch public boundary and 53 artifacts sanitized; not deployed. |
| 11 | Profit | BLOCKED | Final-profit true count=0. New guard and actual handler attacks pass; real TAX8 final profit remains unproved. |
| 12 | COO | BLOCKED | 0/8 verified exact origin proof in current TAX8 payload; no origin inferred. |
| 13 | Tax | BLOCKED | 40 open destination-tax exceptions. Supplier taxesFee and null-to-zero cannot establish tax truth. |
| 14 | Customs | BLOCKED | No verified exact classification/landed quote for TAX8. Wrong/stale/destination/amount/service evidence is rejected by branch. |
| 15 | Taxonomy | PARTIAL | Shared canonical branch matcher exists; old public preview has contamination and a failing exact shelf. Branch visual retest unavailable. |
| 16 | Home | FAIL | Public Home includes supplier-price promotions and old script versions; branch cost guards tested. |
| 17 | Category | PARTIAL | Women category and legacy dresses fallback render; filter action works. Live fetch and exact canonical route fail. |
| 18 | Exact shelf | FAIL | women -> women-dresses remained 0 products / Failed to fetch; screenshot captured. Legacy dresses returned fallback products. |
| 19 | PDP | PARTIAL | Printful 329 loaded images and 7 variants, Price pending and disabled checkout. This is no TAX8 pricing/stock proof. |
| 20 | Variants | PARTIAL | Size M selected and quantity control exercised. Durable quantity/session/stock consistency not proven; live purchase stays disabled. |
| 21 | Sizing | UNVERIFIED | Size labels observed; measurement chart, regional sizing and fit correctness not exercised. |
| 22 | Filters | PARTIAL | Min=10/Max=25 applied on legacy dresses; no proof of verified retail range or complete canonical/live results. |
| 23 | Search | FAIL | denim jacket showed Unexpected token HTML/JSON parser error on public preview. Branch user-facing error copy improved; routing still needs runtime proof. |
| 24 | Recommendations | FAIL | Public PDP recommendations render supplier base amounts. Branch rejects old cached supplier prices. |
| 25 | Saved/Likes | UNVERIFIED | Authenticated persistence and cross-account privacy were not exercised. |
| 26 | Auth | PARTIAL | Passwordless sign-in shell observed, no password input. Magic Link/OAuth account completion was not exercised. |
| 27 | Profile | PARTIAL | Guest profile redirects to auth; authenticated account/profile behavior unverified. |
| 28 | Address | UNVERIFIED | Form visible; no customer PII submitted and no address-to-session/provider E2E. |
| 29 | Checkout | PARTIAL | Empty cart verification fails safely and Payment activation pending remains disabled. No complete payment session E2E. |
| 30 | Orders | BLOCKED | 10 test orders, 0 non-test orders; no successful supplier-order proof and no authenticated Orders journey. |
| 31 | Tracking | BLOCKED | 0 supplier order IDs, 0 tracking, 0 shipped in fresh fulfillment truth. |
| 32 | Returns | PARTIAL | Approved prelaunch workflow and public route HTTP 200 retained; transactional refund/return E2E absent. |
| 33 | Freshness | BLOCKED | Runner/watcher undeployed; 0 matching freshness cron; no two rotations/failure/recovery proof. |
| 34 | Payment/fulfillment E2E | BLOCKED | 0 sandbox payment sessions/status observations; CJ provider-order proof absent; EPROLO execution contract remains blocked. |
| 35 | Legal/security/git/runtime | BLOCKED | Business identity draft/unapproved; real-money disclosures pending; classic branch protection 403; public cost P0 and runtime drift remain. |

Counts: PASS=5, PARTIAL=10, BLOCKED=12, UNVERIFIED=3, FAIL=5.

## Exact closure sequence and next actions

1. TAX8: obtain official exact origin/material/order-variant provenance, then fresh cost/stock/shipping and verified landed-cost/classification/market-retail evidence. See tax-final-profit-closure v2 (40 existing item-market rows). Hold uncompetitive markets; no price inflation and no cohort expansion.
2. PayPlus: secure staging config and scoped sandbox approval; authentic generateLink/transaction/signed callback/ipn-full/replay/forgery/expiry/withdrawal plus an actually implemented sandbox-only exactly-once transition proof. Live stays OFF.
3. Supplier: owner-authenticated CJ Sandbox chain with reconciliation before retry; EPROLO official Product Detail/order namespace and confirmed nonbillable execution contract before any supplier mutation.
4. Freshness: the supplied Phase 4 explicitly requires scoped Owner approval before shadow deployment, secrets and shadow cron. Existing prepared schedule/source is reviewable; prove two rotations plus controlled failure/recovery and races.
5. Runtime: publish approved nonproduction preview/Edge revisions and prove cache/CORS/search/price-privacy/load behavior. Branch storefront/payment are RPC/HTTP; do not reopen a historical independent Pooler blocker. Freshness retains its own Postgres/Pooler runtime dependency.
6. Legal: use the actual selected market subset and owner-approved public trading-address/transaction disclosures. Existing support/privacy/returns/policy completion is retained; private address not auto-published.
7. Git governance: repository administrator supplies required checks/reviews/merge/no-force-push/no-delete settings evidence. Current rulesets=0; classic protection returned 403, so neither protected nor unprotected is asserted.
8. Rerun F35 after approved runtime/sandbox/evidence changes. A ready-for-activation Owner Gate is not appropriate while these P0s remain.

## Supporting new evidence

- hunt-final-red-team-truth-2026-10-02-v2.json
- hunt-tax-final-profit-closure-2026-10-02-v2.md and hunt-tax8-live-matrix-input-2026-10-02-v2.json
- hunt-payplus-sandbox-e2e-2026-10-02-v1.md
- hunt-cj-sandbox-e2e-2026-10-02-v1.md
- hunt-eprolo-fulfillment-e2e-2026-10-02-v1.md
- hunt-freshness-runtime-proof-2026-10-02-v1.md
- hunt-public-cost-privacy-red-team-2026-10-02-v1.md
- hunt-public-runtime-baseline-2026-10-02-v1.json
- hunt-legal-git-current-verification-2026-10-02-v1.md

Leaked Password Protection warning remains nonblocking passwordless-auth hardening. Public supplier cost/margin exposure remains P0. Public hunt_* RLS-off count=0 is a narrow metadata check, not a full cross-account authorization proof.
