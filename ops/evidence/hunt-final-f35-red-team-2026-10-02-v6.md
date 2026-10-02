# HUNT Final F35 Red Team — 2026-10-02 v6

## Scope

Fresh adversarial rerun against PR26 plus live Supabase truth and current-run browser evidence.
Historical reports are supporting context only; newer direct verification wins.

## Safety contract

- Payment Live: OFF / owner approval false.
- Supplier Live Order: OFF / owner approval false.
- Profit Release: OFF / owner approval false.
- PayPlus Paid Acceptance: OFF / owner approval false.
- PR26 remains Draft / open / unmerged.
- No Production deploy, live payment, live supplier order, or live freshness cron was performed.

## Fresh commerce truth

- Catalog candidates: 26,375.
- Sellable rows: 0.
- Production-effect rows: 0.
- Final Profit Verified rows: 0.
- Payment sessions: 33 total; paid: 0.
- Fulfillment rows: 10; tracking: 0; shipped: 0.
- Open destination-tax exceptions: 40.
- Open final-profit exceptions: 1.

## Phase results

### TAX8 / COO / customs / Final Profit — EXTERNAL_BLOCKED

Eight EPROLO TAX8 items were re-queried at exact item/variant level.
All eight remain `final_profit_verified=false` and `launch_tax_truth_mode=RESERVE_ONLY`.
Verified COO: 0/8. Verified HS code: 0/8. Verified `customs_truth_v1`: 0/8.
No new EPROLO response containing exact COO/HS/Product-Detail order-variant evidence was found.
Do not infer origin, HS, duty, DDP, tax, or material from title/category/supplier geography.

### PayPlus Sandbox — CODE_PASS / SANDBOX_CONFIG_BLOCKED

Official staging contract remains aligned with branch code.
Live runtime has 0 sandbox sessions and 0 PayPlus status observations.
Sandbox evidence control remains OFF/unapproved because staging credentials are not configured.
Payment Live and paid callback acceptance remain OFF.

### Supplier E2E — BLOCKED

CJ sandbox control is enabled and owner-approved; live supplier order remains OFF.
Current fulfillment truth is 7 failed + 3 stale/incomplete rows, 0 supplier-order proof, 0 tracking, 0 shipped.
Most recent CJ failures are provider-side transient `1603000` busy responses; retry/reconciliation code remains fail-closed.
EPROLO official request preview is fail-closed on tax_cost, province-code and Product-Detail/order-compatible variant provenance.
No EPROLO supplier mutation/tracking proof was executed.

### Freshness Runtime — CODE_PASS / RUNTIME_BLOCKED

Freshness race fix remains branch-only: atomic transition, route lock, evidence ordering and idempotency tests pass.
Live project has 0 matching supplier-freshness cron jobs and no new freshness observation table from the branch design.
`hunt-freshness-shadow-runner` and `hunt-supplier-ops-watch-shadow` are not deployed live.
Refresh policies for CJ/EPROLO exist, but policy rows are not runtime rotation proof.

### Runtime / Pooler — STALE INDEPENDENT BLOCKER CLOSED

Branch storefront runtime contains no `HUNT_DB_POOLER_URL`, `SUPABASE_DB_POOLER_URL`, `npm:postgres`, or `eproloSqlClient` path.
Live storefront v142 imports source commit `60df8153...`; its runtime also has no raw-pooler reference.
Payment session, order preview, order orchestrator and EPROLO country-shadow paths contain no raw-pooler dependency in the current branch.
Only the undeployed freshness runner still uses the DB/pooler path; that dependency belongs to the Freshness Runtime Owner Gate.
Therefore Pooler is no longer a separate launch blocker.

### Legal / Git / security

Legal customer contacts, policy pages and the approved returns workflow remain prelaunch-complete.
Real-money business disclosure/Owner approval is still incomplete; the live business-identity record remains draft/unapproved.
GitHub rulesets observed: 0. Classic branch protection remains UNVERIFIED because the integration receives HTTP 403.
Supabase Leaked Password Protection remains disabled, but HUNT exposes Magic Link/OAuth/Google ID Token and no password customer flow; this remains non-blocking hardening unless password auth is introduced.

## Browser Red Team — current-run evidence

Initial current-run browser pass found a real taxonomy defect despite green CI:
Home canonical shelves trusted legacy source buckets without a shared semantic matcher.
Observed effects included non-apparel and cross-demographic products in Women's Dresses/Tops/Bottoms.

Branch fix `5607ef4...` introduced `canonical50-v4` shared item matching used by Home and Category.
Adversarial guards reject cross-category, cross-demographic, multi-piece false positives and unsafe marketplace/pickup wording.

Post-fix desktop Home sample:
- Women's Dresses: 15 rendered exact matches.
- Women's Tops: 6 rendered exact matches.
- Women's Bottoms: 6 rendered exact matches.
- Women's Underwear: 18 rendered.
- Men's Tailoring: 7 rendered.
- Wall Art & Canvases: 15 rendered after marketplace/pickup filtering.
- Customer-visible supplier-name hits: 0.

PDP Red Team also found source fingerprinting through internal Model/Type metadata and raw supplier description copy.
Branch fix removes internal Model facts, hides supplier/provider Type values, sanitizes provider names/entities from DOM and JSON-LD, and preserves canonical category context.
Current-run PDP proof: price loaded, live variants loaded, exact category back-link preserved, supplier-name hits 0.

Mobile 390 current-run proof:
- Home, Women→Dresses Category and PDP rendered with viewport width 390.
- Global horizontal overflow: false on all three.
- Category returned products; PDP returned price and variant selectors.
- Customer-visible supplier-name hits: 0.
- PDP exact-shelf back-link preserved.

Category count can change between cached shard and live-merge completion (for example 92→104 in separate runs).
The shared matcher applies after both paths, so this did not reintroduce taxonomy contamination.
Status: non-blocking UX consistency PARTIAL; consider stabilizing the count label/transition later.

## Final F35 matrix

1. Payment Live gate — PASS.
2. Supplier Live Order gate — PASS.
3. Profit Release gate — PASS.
4. PayPlus Paid Acceptance gate — PASS.
5. Owner Gate / Draft / no-merge discipline — PASS.
6. Exact-variant enforcement — PASS.
7. Stock truth — PARTIAL (verified snapshots; no freshness runtime rotation proof).
8. Shipping truth — PARTIAL (verified snapshots; no freshness runtime rotation proof).
9. Retail pricing truth — PARTIAL (launch pricing not closed for TAX8 markets).
10. Supplier-cost truth — PARTIAL (exact audited cohorts; not a globally sellable catalog).
11. Final Profit — BLOCKED.
12. Country of Origin — BLOCKED.
13. Destination tax — BLOCKED.
14. Customs / landed cost — BLOCKED.
15. Canonical taxonomy — PASS after shared matcher Red Team fix.
16. Home storefront — PASS on current desktop/mobile browser rerun.
17. Category — PARTIAL (exact filtering passes; live-merge count transition remains UX variance).
18. Exact shelf isolation — PASS on current guards/browser samples.
19. PDP — PASS on current browser proof.
20. Variant rendering/selection — PASS on current PDP proof.
21. Sizing — PARTIAL (variant sizes exist; catalog-wide verified Size Guide does not).
22. Filters — PARTIAL (price/sort exist; deep Size/Color/Fit/Material/Rating filtering incomplete).
23. Search — PARTIAL (basic search exists; advanced typo/synonym/image-search closure not proven here).
24. Recommendations/discovery — PARTIAL (implemented; not fully adversarially proven across signed-in states in this run).
25. Saved/Likes — PARTIAL (privacy/contracts pass; no authenticated current-run browser proof).
26. Auth — PASS for current passwordless Magic Link/OAuth/Google paths.
27. Profile — PARTIAL (privacy/contracts pass; no authenticated current-run browser proof).
28. Address flow — PASS at regression-contract level.
29. Checkout — PARTIAL (prelaunch flow/code pass; PayPlus sandbox E2E absent).
30. Orders — PARTIAL (lifecycle code pass; supplier E2E absent).
31. Tracking — BLOCKED (0 tracking / 0 shipped proof).
32. Returns — PARTIAL (policy/workflow ready; no real-money transaction E2E).
33. Freshness — BLOCKED at runtime.
34. Payment + fulfillment E2E — BLOCKED.
35. Legal / Git / runtime governance — BLOCKED / UNVERIFIED until owner/external evidence closes.

## Regression proof

- Full local suite after browser fixes: 234/234 PASS.
- Git diff check: clean.
- Code commit `5607ef4cd189be771b2c6673b727c0f7249bfca5`.
- GitHub Checkout Regression #356: PASS.
- GitHub Catalog Integrity #370: PASS.
- CodeRabbit commit status: SUCCESS.

## Remaining real-money blockers

1. TAX8 exact COO + destination landed-cost/tax/customs proof and verified market pricing.
2. PayPlus staging credentials/control plus signed callback + `ipn-full` + idempotent sandbox E2E.
3. CJ sandbox order → tracking → shipped proof and EPROLO non-live execution/tracking proof.
4. Freshness runner/watcher deployment, DB-path setup, two rotations and failure/recovery proof under Owner Gate.
5. Legal real-money disclosure + explicit owner approval.
6. Git branch-protection / required-check verification with sufficient repository administration visibility.
7. Final Owner Gate before merge/deploy/payment/supplier-live activation.

## Non-blocking hardening

- Stabilize Category cached→live count transition.
- Complete catalog-wide Size Guide / advanced filters / fit data.
- Improve supplier-description copy normalization.
- Strict supplier API/CDN anonymity for technical DevTools users.
- Supabase leaked-password protection if password authentication is ever introduced (or as project-wide hardening).

## Decision

HUNT is materially cleaner after this Red Team, but **NOT READY for real-money launch**.
The correct status is `PRELAUNCH_RED_TEAM_CODE_BROWSER_PASS_EXTERNAL_OWNER_BLOCKERS_REMAIN`.
All live commerce gates remain OFF.
