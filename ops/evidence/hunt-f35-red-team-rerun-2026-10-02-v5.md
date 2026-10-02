# HUNT F35 Red Team Rerun — 2026-10-02 v5

## Scope

Fresh F35 rerun against PR26 branch `launch/hunt-candidate-2026-09-29-v1`, including GitHub CI, live Supabase safety truth, browser rendering, exact-shelf taxonomy routing, PDP context, supplier privacy, and launch blockers.

This evidence does **not** authorize merge, Production deploy, payments, supplier live orders, Profit Release, paid callback acceptance, or a live freshness schedule.

## Tested code head

- Code HEAD: `f8fddc88a37cfb0f259c82e98c84ae6b6577b7f7`
- PR26: Draft / Open / Unmerged
- HUNT checkout regression #342: **PASS**
- HUNT Catalog Integrity #355: **PASS**
- CodeRabbit commit status: **SUCCESS**
- Review-thread recheck: no new unresolved finding was observed for this F35 change set.

## New F35 finding: Canonical Category → runtime source bridge

Browser rerun first exposed a real P0 storefront-path defect:

- `Women → Women's Dresses` rendered `0 products` / `Failed to fetch` / `No live product feed`.
- Direct storefront API was healthy and returned legacy runtime shelves such as `dresses=33`, `tops=64`, while canonical keys such as `women-dresses` and `women-tops` returned 0.
- Root cause: the customer taxonomy had moved to Canonical 50, while part of the runtime catalog still used legacy shelf keys.

### Remediation

Branch-only fix on PR26:

- `canonical-taxonomy.js` now owns a conservative canonical→runtime source alias map.
- Home consumes the shared legacy compatibility aliases instead of maintaining a second map.
- Category resolves an exact canonical shelf through the shared source alias.
- Exact canonical shelves **fail closed** when no exact/approved source exists; there is no broad parent-category fallback.
- No new canonical shelf was created and the approved 50-shelf contract remains intact.
- `kids-schoolwear`, `women-occasionwear`, and other shelves without a safe exact alias remain unmapped rather than being silently filled from a broad source.

## Browser proof after fix

### Women's Dresses

Fresh browser rerun after the final semantic guard:

- `Women → Women's Dresses`: **92 matching catalog products**.
- 48 visible cards in the captured viewport/sample.
- Visible sample scan: **0 non-dress titles** and **0 swimwear false positives**.
- Explicit `swimsuit | swimwear | bikini | rash guard` exclusions were added for `women-dresses`.
- Exact canonical side navigation marks `Women's Dresses` active.
- Customer-visible supplier-name scan: **0 hits**.

Earlier visual Red Team caught skirt-only and swimwear leakage from the legacy `dresses` source. Both were tightened before push.

### Cross-checks

Additional exact-shelf browser checks:

- `Men's Underwear`: **5 matching products / 5 shown**, exact shelf active, 0 visible supplier-name hits.
- `Wall Art & Canvases`: **61 matching products**, exact shelf active, 0 visible supplier-name hits.

These checks confirm the bridge is not limited to the Dresses route.

## PDP proof

Direct product API probe for the selected Dresses item:

- HTTP 200
- 32 variants returned by backend
- verified HUNT retail: `$9.99`
- profit gate: `PASS`

Fresh browser render after loading canonical taxonomy on PDP:

- Product title rendered correctly.
- Price: `$9.99`.
- Provider/customer label: `HUNT SOURCE`.
- Stock state: `QUOTE AT CHECKOUT`.
- 12 variant-option buttons visible in the captured viewport; backend returned 32 variants.
- Breadcrumb/category return route: `category.html?c=women&sub=women-dresses`.
- Customer-visible supplier-name scan: **0 hits**.
- Product URL continues to use opaque `src=s*`; no raw `provider=` parameter.

A prior PDP rerun incorrectly fell back to `Jewelry` because `product.html` did not load the canonical taxonomy. `product.html` now loads `canonical-taxonomy.js` before `product.js`, preserving the exact shelf context.

## Local preview CORS clarification

The product API itself returned HTTP 200. The Edge response currently allows the public GitHub Pages origin and does not allow localhost.

Therefore the isolated localhost `Failed to fetch` on PDP was a CORS preview limitation, not a product-detail runtime failure. Browser rendering was additionally verified locally with web security disabled **for QA only**. No Production CORS relaxation was made.

## Regression proof

Final local full suites after all browser-found fixes:

- Checkout / launch suite: **144/144 PASS**
- Catalog / taxonomy / privacy suite: **46/46 PASS**
- `git diff --check`: clean before commit

GitHub then independently passed:

- Checkout Regression #342: **PASS**
- Catalog Integrity #355: **PASS**

## Live safety truth rechecked

Launch controls remain fail-closed:

- `hunt_payment_live = false`
- `hunt_supplier_order_live = false`
- `hunt_finance_profit_release = false`
- `hunt_payplus_callback_accept_paid = false`

Fresh live-state checks during this F35 rerun showed:

- 0 sellable rows
- 0 production-effect rows
- 0 paid sessions
- 0 tracking/shipped proof
- 0 freshness observations

No live payment, supplier-order, or Production activation was performed.

## Additional F35 observations

### Supabase advisor

Performance Advisor reports RLS execution warnings / multiple permissive policies on some HUNT tables. This is recorded as security/performance debt, not as a proven public data-exposure finding. Permission semantics still require explicit review before launch closure.

### Operational noise

Repeated 404 webhook traffic to `hunt-ebay-deletion` was observed. This is operational noise to clean up; it is not part of the CJ/EPROLO/PayPlus launch path.

## Still open — do not call READY

The browser/category/PDP defects found in this rerun are closed at branch/code/CI level, but HUNT remains **NOT READY / Red Team not closed** because these launch blockers remain open:

1. Destination tax / COO / customs classification / final-profit truth.
2. PayPlus sandbox E2E including signed callback, status verification, idempotent paid transition proof.
3. Supplier fulfillment E2E through tracking → shipped; official EPROLO Create Order / Query / Tracking execution contract remains required.
4. Pooler/runtime deployment proof and post-deploy load validation under Owner Gate.
5. Legal/business identity and returns-policy closure.
6. Supabase leaked-password protection warning.
7. Git branch-protection / required-check governance verification with sufficient repository permissions.
8. Strict network-level supplier secrecy remains partial; technical users can still infer origin through supplier/CDN/network paths until server-side API/media proxying exists.
9. Freshness race is still `CODE_PASS / RUNTIME_UNPROVEN` until the authorized runtime deployment + schedule actually produces live observations.

## Launch rule

**Payment Live OFF · Supplier Live Order OFF · Profit Release OFF · PayPlus Paid OFF · PR26 Draft · No Merge · No Production without explicit Owner Gate.**
