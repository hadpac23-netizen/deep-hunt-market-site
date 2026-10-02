# Freshness / Runtime Red Team — 2026-10-02

Status: BLOCKED — branch race fixes tested; shadow runtime proof requires the explicit scoped Owner Gate in the supplied Phase 4 contract.

FOUND: runner/watcher are not deployed and no matching HUNT freshness cron exists. Latest CJ observation is 2026-09-29T09:31:58Z; EPROLO 2026-10-01T22:49:50Z. Neither has a record within the last 30 minutes. Total project cron jobs=22, active=2; those unrelated existing jobs were not changed.
IMPACT: policy/configuration cannot prove two rotations, injected failure or recovery.
FIX/TEST: existing transactional/advisory-lock/version-order/idempotency/partial-write guards pass local tests. No runtime rotation or controlled provider failure was performed.
STATUS: PARTIAL code behavior; FRESHNESS_RUNTIME_PASS is not established.

Concrete prepared continuation: existing ops/hunt-freshness-shadow-schedule-plan.sql, runner/watcher source and runtime controls define shadow-only work. After scoped Owner approval, deploy both shadow functions, configure their secret privately and apply only a shadow schedule; prove rotation 1 and 2, controlled timeout, HOLD/RETRY, recovery, old PASS after new HOLD, old HOLD after new PASS, replay and incomplete persistence. Record exact route timestamps and observation versions. Payment/Supplier Live/Profit/Paid Acceptance stay OFF.

## Current architecture map

| Flow | Branch DB/transport | Current proof limit |
|---|---|---|
| Storefront shelves | Supabase RPC/HTTP; supplier HTTP | Live v142 wrapper was retrieved; imported runtime module contents were not returned by that tool |
| PDP | Supplier HTTP + persisted Supabase paths | One public Printful PDP and variants loaded; no TAX8 current quote proof |
| Checkout/payment session | Supabase HTTP/RPC | v27; no money transition exercised |
| Order preview | Supabase HTTP/RPC | v16; no raw Pooler reference in branch |
| Supplier quote/orchestrator | Supabase HTTP/RPC + provider HTTP | Orchestrator v26; source/runtime drift; real E2E absent |
| Freshness runner | Raw Postgres transaction/Pooler URL | Undeployed; own concurrency/recovery proof required |
| Internal TAX8 shadow audits | Raw Postgres/Pooler | Administrative shadow tooling; new guard not deployed |

Pooler is not inferred to be a separate storefront/payment blocker. Critical runtime validation remains BLOCKED; only the undeployed freshness runner has a Pooler dependency on the requested commerce/freshness paths.

Public prelaunch baseline: 30 GET requests, concurrency 3, all 30 returned API failures (404/non-JSON), 0 timeouts, p50=6645.44 ms, nearest-rank p95=13766.23 ms. This measures the public Netlify API routes only and is a FAIL, not a Pooler/Supabase load PASS. Separate direct Edge-backed PDP behavior succeeded. Raw samples are in hunt-public-runtime-baseline-2026-10-02-v1.json.
