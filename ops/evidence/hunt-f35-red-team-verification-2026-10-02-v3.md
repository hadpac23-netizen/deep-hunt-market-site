# HUNT F35 Red Team Verification — 2026-10-02 v3

Scope: PR26 / `launch/hunt-candidate-2026-09-29-v1` only. No merge, Production deploy, Payment Live, Supplier Live Order, PayPlus paid acceptance or Profit Release is authorized by this verification.

## Executive result

**NOT ALL FIXED.** Customer-visible supplier-name rendering/cache issues are materially improved and covered by CI, but several controls remain open and must not be marked launch-ready.

## Current safety truth

Live DB recheck at 2026-10-02:
- `hunt_payment_live=false`, owner_approved=false
- `hunt_supplier_order_live=false`, owner_approved=false
- `hunt_finance_profit_release=false`, owner_approved=false
- `hunt_payplus_callback_accept_paid=false`, owner_approved=false
- 26,375 shelf candidates
- 0 sellable rows
- 0 production-effect rows
- 0 rows claiming final profit verified
- 0 paid payment sessions
- 0 PayPlus status observations
- 0 fulfillment rows with tracking
- 0 shipped fulfillment rows
- 0 active freshness cron jobs
- 0 freshness observations in the latest 90 minutes; no freshness observation exists yet

Open ops exceptions currently consist of:
- 40 `DESTINATION_TAX_NOT_VERIFIED`
- 1 `FINAL_PROFIT_NOT_VERIFIED`

## What is actually fixed

### 1. Customer-visible supplier rendering — PASS for ordinary UI

Current PR26 source now uses neutral HUNT labels in customer-visible surfaces:
- Saved/Liked -> `HUNT SAVED`
- Orders -> `HUNT ORDER`
- deal/catalog cards -> `HUNT NETWORK` / `HUNT VERIFIED SOURCE`
- shelf cards -> `HUNT SOURCE`
- product URLs use opaque `src` codes rather than customer-visible `provider=` query parameters.

`tests/storefront-provider-privacy.test.js` covers profile, product, Home/deal, category navigation and cache-busting contracts.

### 2. Customer script cache-busting — PASS at contract level

Current branch includes:
- `profile.js?v=profile2`
- `hunt-deal.js?v=stable2`
- PWA/service-worker generation `pwa7`
- customer-sensitive scripts on the current network-first policy.

Catalog Integrity parses and tests the privacy/cache contract.

### 3. CI on previous verification head — PASS

Before this evidence-only commit:
- HUNT Catalog Integrity #343 — PASS
- HUNT checkout regression #334 — PASS

## Findings still open

### F35-RT-01 — Freshness persistence ordering race — OPEN / BLOCKER BEFORE ENABLEMENT

Current `hunt-freshness-shadow-runner` still performs:
1. `persistObservation(...)`
2. `syncException(...)`

as two separate writes. Exception resolution uses current database time and does not bind the state transition to the exact observation version / `observed_at` that produced the result.

Failure modes:
- observation succeeds, exception reconciliation fails -> ledger disagreement;
- overlapping runs allow an older delayed PASS to resolve a newer HOLD/RETRY;
- `last_checked_at=now()` records reconciliation time, not evidence ordering.

Existing per-item try/catch prevents batch abort, but does **not** make the transition atomic or version ordered.

Containment is currently strong because:
- persistence is opt-in;
- 0 active freshness cron jobs exist;
- no freshness observations exist yet;
- runner cannot change payment, supplier order, sellable, catalog visibility or Production state.

**Closure requirement:** observation + exception reconciliation must become one recoverable/version-ordered transition, or exception updates must reject stale evidence by trustworthy observation ordering. Add an adversarial overlapping-run regression test before any schedule is enabled.

### F35-RT-02 — Home taxonomy drift from Canonical 50 — OPEN / HIGH WATCH

`canonical-taxonomy.js` defines the 50 canonical exact shelves, including `women-dresses`, `men-loungewear`, `kids-schoolwear`, `curtains-blinds`, etc.

Home `hunt-deal.js` still maintains a separate legacy `shelfMeta` / `shelfDepartments` universe (`dresses`, `tops`, `bottoms`, `sleepwear`, `womenunderwear`, `menunderwear`, `socks`, `swimwear`, etc.) and applies title-regex `isShelfFit()` heuristics.

This means Category can be correct under the canonical contract while Home independently remaps or filters products using older aliases/heuristics.

**Closure requirement:** Home should consume canonical shelf definitions / canonical department relationships as its source of truth, with explicit aliases only at the ingestion compatibility layer. Add a regression contract proving Home cannot place products outside their canonical shelf/department.

### F35-RT-03 — Supplier privacy is UI privacy, not full source secrecy — OPEN / SCOPE DECISION

The ordinary customer UI is fixed, but provider identity still exists in browser-side routing/data:
- `storefront-privacy.js` contains provider <-> source-code maps;
- `profile.js` still needs `row.provider` to derive `src`;
- current `hunt_product_actions` includes 4 rows with named supplier/provider values.

A technically capable user inspecting browser JS/runtime/network can therefore potentially infer provider identity.

This is **not** the previous visible-UI leak. It is a stricter secrecy requirement.

**Closure choices:**
- If requirement is “do not display suppliers to normal customers,” current UI contract passes.
- If requirement is “supplier identity must not be discoverable client-side,” move provider resolution behind a server-side opaque product/source token and stop returning raw provider values to customer clients.

### F35-RT-04 — Destination tax / customs / COO truth — OPEN / BLOCKER

Live exceptions still include 40 `DESTINATION_TAX_NOT_VERIFIED` plus 1 `FINAL_PROFIT_NOT_VERIFIED` and no candidate claims final-profit verification.

Do not infer COO, HS/tariff class, DDP semantics or destination duty from taxonomy or supplier address.

### F35-RT-05 — PayPlus sandbox E2E — OPEN / BLOCKER

Current live truth remains:
- 0 paid sessions
- 0 PayPlus status observations
- paid callback acceptance OFF

Signed callback/status/idempotent paid-transition proof remains required before activation.

### F35-RT-06 — Supplier fulfillment E2E — OPEN / BLOCKER

Current live truth remains:
- 0 tracking rows
- 0 shipped rows

CJ sandbox order -> tracking -> shipped and the approved EPROLO non-live fulfillment contract path remain unproven E2E.

### F35-RT-07 — Legal closure — OPEN / BLOCKER

Latest `hunt_business_identity` row:
- status = `draft`
- owner_approved = false
- legal entity / registration / country / business address / support / privacy contact are present
- returns address is absent

Do not call Legal closed until the required real-money disclosure/returns path is approved.

### F35-RT-08 — Security account setting — OPEN

Supabase Security Advisor currently reports one external warning:
- `auth_leaked_password_protection` — disabled

Customer UI currently relies on passwordless/OAuth-style flows in existing launch evidence, so this is not evidence of an active password compromise, but the project-level security warning remains unresolved.

### F35-RT-09 — Git governance — PARTIAL / UNVERIFIED THROUGH CURRENT INTEGRATION

PR26 is Draft/open/unmerged. Repository rulesets endpoint currently returns 0 rulesets. Classic branch-protection read is unavailable to the connected GitHub integration (403), therefore branch protection must remain `UNVERIFIED` here rather than assumed enabled or disabled.

### F35-RT-10 — PR body current-truth section is stale — OPEN DOCUMENTATION DRIFT

PR26 metadata currently has head `c5710d77...`, but its embedded `CI / Red Team — current truth` section still references historical head `c37ffd...` and old run numbers. The newer v2/v3 checkpoint evidence supersedes those identifiers, but the body itself is not current.

## CI coverage gap observed

The current Checkout Regression workflow includes `tests/freshness-shadow-runner.test.js`, but those tests verify provider scope, exact-variant checks, fail-closed economics, dry-run safety and per-item persistence error containment. They do **not** simulate overlapping runs or assert stale-evidence rejection / atomic observation-exception reconciliation.

Therefore a green Checkout Regression does not prove F35-RT-01 is closed.

## Red Team conclusion

Closed / strongly contained:
- visible supplier-name leak in normal customer UI
- customer script cache-busting contract
- previous exact-variant / shipping / callback static findings covered by resolved review threads and current CI

Not closed:
- freshness ordering/atomicity
- Home canonical-taxonomy unification
- strict client-side supplier secrecy (if required)
- destination tax/customs/COO/final-profit truth
- PayPlus sandbox E2E
- supplier tracking/shipped E2E
- legal Owner Gate / returns-address closure
- leaked-password-protection warning
- branch-protection verification
- PR body current-truth drift

## Non-negotiable safety state

Payment Live OFF · Supplier Live Order OFF · Profit Release OFF · PayPlus paid acceptance OFF · no Merge / Production without Owner Gate.
