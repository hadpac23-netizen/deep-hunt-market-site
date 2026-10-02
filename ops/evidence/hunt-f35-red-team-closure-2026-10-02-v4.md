# HUNT F35 Red Team Closure Checkpoint — 2026-10-02 v4

Scope: PR26 branch only. This checkpoint does not authorize merge, Production deploy, Payment Live, Supplier Live Order, Profit Release, PayPlus paid acceptance, or cron enablement.

## Verified code head before this evidence commit

- HEAD: `e2997947d99370c2e7f37980b75b8ef70257f6d9`
- HUNT checkout regression #340: PASS
- HUNT Catalog Integrity #352: PASS
- PR26 remained Draft / open / unmerged.

## Strong Red Team fixes completed branch-only

### Freshness race — CODE_PASS / RUNTIME_UNPROVEN

The runner no longer persists an observation and reconciles its exception as two independent transitions. It now uses a database transaction, per-route advisory lock, evidence timestamp/version ordering, stale-evidence rejection, and explicit idempotent replay handling. Persistence failure is reported as `PERSISTENCE_INCOMPLETE`.

Adversarial tests cover:
- older PASS after newer HOLD -> stale evidence rejected;
- older HOLD after newer PASS -> stale evidence rejected;
- identical replay -> idempotent;
- equal-time competing evidence -> fail closed;
- persistence failure -> incomplete, never PASS;
- dry-run remains non-mutating.

Runtime remains unproven because no freshness runtime deployment/schedule was authorized: live DB still had 0 active freshness cron jobs and 0 freshness observations.

### Home canonical taxonomy — CODE/CONTRACT_PASS

Home now consumes the same exported canonical taxonomy used by Category instead of maintaining a parallel `shelfMeta` / `shelfDepartments` universe and title-regex shelf classifier. Legacy slugs are compatibility aliases only and normalize into canonical shelves. There is no Kids Socks alias/new shelf 51.

Canonical URL hierarchy remains `department -> exact shelf`, and Home loads the canonical map before `hunt-deal.js`.

### Supplier privacy — VISIBLE_UI_PASS / STRICT_NETWORK_PARTIAL

Static and browser Red Team found and fixed an additional visible leak in `hunt-wow.js`, which rendered `item.provider` as customer-visible text. It now renders `HUNT SOURCE`, with a regression test and cache bump.

A fresh-cache Chrome Home render after the fix produced:
- 0 visible-text hits for CJdropshipping / EPROLO / Printful / Gooten / Matterhorn;
- `HUNT SOURCE` labels rendered throughout product surfaces;
- product navigation used opaque `src=s*` URLs rather than `provider=` URLs.

PDP source routing now fails closed when source is missing and uses opaque source codes for provider-specific UI behavior instead of a `Printful` default or name matching.

Strict supplier secrecy is still PARTIAL: source-provider maps remain browser-side, internal provider values are still needed by current cart/profile/API contracts, and supplier/CDN hostnames can be inferred from image/network requests. Full secrecy requires a server-side opaque source token and media/API proxying; that refactor was not performed because it changes transaction/data architecture and is not needed merely to prevent ordinary customer UI disclosure.

## Local regression evidence

Before push, the launch/checkout suite passed 143/143 tests and the catalog/privacy/taxonomy suite passed 43/43 tests. Subsequent targeted Freshness/Canonical/Privacy runs also passed after the WOW leak fix.

## Live safety / launch truth reverified

Runtime controls stayed OFF and unapproved:
- `hunt_payment_live=false`
- `hunt_supplier_order_live=false`
- `hunt_finance_profit_release=false`
- `hunt_payplus_callback_accept_paid=false`

Live commerce state remained:
- 26,375 shelf candidates
- 0 sellable rows
- 0 production-effect rows
- 0 paid sessions
- 0 PayPlus status observations
- 0 fulfillment rows with tracking
- 0 shipped/delivered rows
- 0 freshness observations

Open operations exceptions remained:
- 40 `DESTINATION_TAX_NOT_VERIFIED`
- 1 `FINAL_PROFIT_NOT_VERIFIED`

Legal remained `draft`, `owner_approved=false`, with no verified returns address.

Supabase Security Advisor still reported `auth_leaked_password_protection` disabled (WARN).

## Remaining blockers — NOT RED TEAM CLOSED

1. Destination tax / customs / COO / final-profit truth.
2. PayPlus sandbox E2E signed callback/status/idempotent paid-transition proof.
3. Supplier sandbox order -> tracking -> shipped proof, plus official EPROLO order/query/tracking contract.
4. Pooler-enabled runtime proof after an Owner-Gated deployment.
5. Legal Owner Approval and returns-path closure.
6. Supabase leaked-password-protection warning review/closure.
7. Git branch-protection / required-check verification with sufficient repository-admin permission.
8. Strict client/network supplier secrecy if the requirement is stronger than ordinary UI privacy.

## Browser verification limitation

Home was executed in a fresh-cache local Chrome headless run and inspected after dynamic rendering. A later Category/PDP headless sweep overloaded the local browser/remote-control session before its output could be fully accepted; those surfaces remain covered by current contract/CI tests but are not claimed as fully screenshot/browser-audited in this checkpoint.

## Final state

Freshness race: `CODE_PASS / RUNTIME_UNPROVEN`
Home canonical taxonomy: `PASS`
Ordinary customer supplier-name privacy: `PASS`
Strict network/source secrecy: `PARTIAL`
Real-money launch: `BLOCKED`

Payment Live OFF · Supplier Live Order OFF · Profit Release OFF · PayPlus Paid OFF · PR26 Draft · No Merge · No Production without Owner Gate.
