# HUNT DEAL Inventory / Profit / Order Ops Audit — 2026-09-28

Mode: Shadow / Preview only
Production Effect: OFF
Sellable: OFF
Payment Live: OFF
Supplier Live Order: OFF
CJ Sandbox: ON (owner-approved test only)

## Verified supplier capability map

### CJdropshipping
Official API paths in use:
- product/stock/queryByVid — exact variant stock by origin
- logistic/freightCalculate — destination shipping and taxes/fees when returned
- product/productDetail/query — exact variant supplier cost
- shopping/order/createOrderV2 — sandbox path only in current orchestrator

Status:
- Exact variant stock: VERIFIED CAPABILITY
- Destination shipping: VERIFIED CAPABILITY
- Exact variant supplier cost: VERIFIED CAPABILITY
- Live supplier order: OFF and live path not implemented
- Sandbox order: implemented with idempotency/reconciliation/tracking simulation

### EPROLO
Official API path in use:
- get_product_shiping_fees.html

Verified via hunt-eprolo-product-country-variants-audit-shadow-v1:
- all variants enumerated per product/country
- exact variant inventory_quantity
- exact variant supplier cost
- destination shipping methods/cost
- destination tax only when upstream returns it
- contribution/margin computed against active owner-approved profit profile

Status:
- Exact variant stock: VERIFIED when product-country variant audit succeeds
- Destination shipping: VERIFIED when audit succeeds
- Destination tax: NOT VERIFIED for tested Men Shoes Market5
- Final profit: HOLD/PROFIT_REVIEW until tax is verified or an approved tax rule/source is added
- Supplier order integration: not live

### Printful
hunt-catalog-build uses public /products catalog.
availability_verified=false.
No private store token / exact variant destination shipping proof in the active build.
Status: TECHNICAL/PUBLIC CATALOG ONLY — NOT SALE READY.

### Gooten
hunt-catalog-build uses public technical catalog and excludes rows flagged out_of_stock.
That is not exact variant + destination fulfillment truth.
No private RecipeID/account shipping proof in the active build.
Status: TECHNICAL/PUBLIC CATALOG ONLY — NOT SALE READY.

## Practical shelf audit: Men -> Shoes

Fresh DB verification:
- 3 curated route-locked EPROLO products
- production_effect=false
- sellable=false
Items:
- 12515068
- 31998888
- 31411072

Fresh audit:
- Markets: US / DE / GB / IL / AE
- Total exact variants: 83
  - 12515068: 33 variants
  - 31998888: 14 variants
  - 31411072: 36 variants

Across every tested market:
- stock_available: 83 / 83
- out_of_stock: 0
- HOLD: 0
- shipping_verified: 83 / 83
- taxes_verified: 0 / 83
- final_profit_verified: 0 / 83
- status: PROFIT_REVIEW for all variants because DESTINATION_TAX_NOT_VERIFIED

Fresh check timestamp: around 2026-09-28 10:35 UTC.

The audit automatically opened:
- 15 x DESTINATION_TAX_NOT_VERIFIED
- severity: warning
- owner_role: operations_finance
- status: open
(3 products x 5 countries)

## Current economics evidence

12515068:
- supplier cost: $7.54
- US shipping: $10.20-$10.56, retail floor $24.99-$25.99, projected contribution $5.00-$5.55
- DE shipping: $8.76, retail floor $22.99, projected contribution $4.62
- GB shipping: $7.05, retail floor $20.99, projected contribution $4.51
- IL shipping: $20.83, retail floor $39.99, projected contribution $8.02
- AE shipping: $12.17, retail floor $27.99, projected contribution $5.76

31998888:
- supplier cost: $2.76
- US shipping: $7.29, retail floor $15.99, projected contribution $4.50
- DE shipping: $5.72, retail floor $13.99, projected contribution $4.25
- GB shipping: $4.75, retail floor $12.99, projected contribution $4.31
- IL shipping: $11.69, retail floor $20.99, projected contribution $4.65
- AE shipping: $8.40, retail floor $16.99, projected contribution $4.30

31411072:
- supplier cost: $6.36
- US shipping: $9.47-$12.05, retail floor $22.99-$25.99, projected contribution $5.09-$5.25
- DE shipping: $10.04, retail floor $23.99, projected contribution $5.43
- GB shipping: $8.70, retail floor $21.99, projected contribution $4.95
- IL shipping: $25.78, retail floor $45.99, projected contribution $9.71
- AE shipping: $13.56, retail floor $28.99, projected contribution $6.46

Important: these are projected economics with destination tax unverified. They are NOT final verified profit.

## Checkout / order flow audit

### Before payment — current
hunt-payment-session-prelaunch:
- requires provider + item + exact variant
- rechecks product/variant
- requires retail_price_verified
- requires profit_gate_status=PASS
- calls hunt-cj-quote for exact stock and destination shipping
- rejects OUT_OF_STOCK
- rejects SHIPPING_UNAVAILABLE
- persists quote_checked_at, origin, shipping method and price

This is a strong pre-payment gate for CJ.

### Before supplier submit — gap found
The order orchestrator checked commerce snapshot freshness (<=1 hour) and line profit PASS, but did not perform a second live supplier stock/cost/shipping recheck immediately before supplier submit.

Safe preview-only fix committed:
- commit a1961bb4bb6c58e3b05e1a4cfec9e4853b34767c
- exact variant product detail cost recheck
- exact variant stock recheck at persisted origin
- persisted shipping method recheck
- shipping price recheck
- any cost increase > $0.01 -> HOLD
- any shipping increase > $0.01 -> HOLD
- out of stock -> HOLD
- shipping method changed -> HOLD
- writes supplier_precheck pipeline evidence
- lower supplier cost/shipping does not block
- no deploy performed
- no live supplier order enabled

## Exception model

Existing private.hunt_ops_exceptions supports product/variant exceptions.
Current audit proved automatic exception creation works.

Required minimum exception fields:
- entity/order/product/variant identifier
- provider
- destination country
- reason_code
- severity
- opened/updated/last_checked time
- owner_role
- status
- evidence
- resolution + resolved_at before closure

Rules:
- Never resolve without documented result.
- Supplier/API unknown => fail closed.
- Stale stock/price/shipping => variant not sellable until rechecked.
- Out of stock => auto-hide exact variant, not sibling variants.
- Price increase => stop checkout/supplier submit and recalculate.
- Profit falls below gate => stop sale and open operations_finance exception.

## Responsibility matrix

AUTO SYSTEM:
- API retry with bounded backoff
- exact variant refresh
- stale detection
- hide/block exact variant
- open/update exception
- idempotency and duplicate supplier-order reconciliation
- customer-safe fail-closed behavior

AI:
- summarize repeated exceptions
- cluster root causes
- recommend supplier/category priority
- draft incident summaries and proposed fixes
- never mark truth PASS without evidence

OPERATIONS:
- supplier API/account issue
- persistent out-of-stock
- shipping method disappearance
- stuck fulfillment
- product hidden by repeated supplier failure

DEVELOPER:
- repeated timeouts / DB pressure
- Edge Function failures
- schema/cache problems
- supplier API contract changes
- checkout/orchestrator defects
- exception pipeline defects

OPERATIONS_FINANCE:
- tax not verified
- margin/contribution below gate
- payment/refund reserve mismatch
- supplier price changes affecting paid orders

ADI / OWNER GATE:
- enabling live payment
- enabling live supplier orders
- accepting new supplier risk
- changing minimum contribution/margin policy
- overriding a blocked launch gate
- Production-impacting policy changes

## Recommended refresh policy

Customer-critical:
- At checkout: live exact variant stock + cost + shipping
- Immediately before supplier submit: repeat live exact variant stock + cost + shipping
- If either check cannot verify: stop

Background:
- exposed/high-traffic variants: 15 minutes
- ordinary visible shelf variants: 60 minutes
- low-traffic shadow catalog: 6 hours
- public technical catalogs (Printful/Gooten until private integration): daily metadata only, never sale eligibility

Stale thresholds:
- checkout quote: 5 minutes
- supplier-submit evidence: must be created in the current submit attempt
- visible shelf stock: 60 minutes
- supplier API error: immediately UNKNOWN/HOLD; never reuse stale PASS for checkout

## Daily operational audit required

No dedicated freshness/exception/order/ops cron job was found by name in cron.job.

Daily audit should report:
- open exceptions by severity / owner
- exact variants hidden for stock/API failures
- variants whose profit gate dropped
- supplier API failure rate
- orders/payment sessions stuck by lifecycle stage
- supplier submissions without confirmation
- tracking missing beyond SLA
- stale visible variants
- final profit below planned contribution

Immediate alerts:
- checkout stock/price recheck failure
- supplier-submit recheck failure
- paid order not submitted
- duplicate/ambiguous supplier order
- customer-facing API outage
- payment callback integrity failure

## Metrics

Daily + weekly:
1. % visible exact variants with stock evidence <= 60m
2. % checkout lines with fresh exact stock/cost/shipping
3. supplier API failure rate by provider
4. out-of-stock exact variants / total visible variants
5. payment sessions blocked by recheck
6. supplier orders unconfirmed after submit attempt
7. median / P95 exception time-to-resolution
8. open exceptions by severity and owner
9. % orders where final realized contribution < checkout planned contribution
10. % variants with final profit verified by market

Staffing trigger:
- Add a dedicated operations person when open operational exceptions repeatedly exceed 20/day, P95 resolution exceeds 4 hours, or >2% of customer checkout/supplier flows require manual intervention for 2 consecutive weeks.
- Increase developer availability when supplier/API/DB defects create >1% technical failure rate in customer-critical flows, recur 3+ times/week, or any paid order can remain stuck without automatic reconciliation.

## Cron recovery performed

All HUNT workers were restored using reduced/staggered schedules instead of the previous overlapping high-frequency pattern.
BOOM pulse reduced from every 5 minutes to every 30 minutes.
Dragon maintenance staggered to every 10 minutes.
Heavy enrichment/scoring batches were reduced.

Post-recovery verification:
- 4/4 SQL canaries PASS after all workers restored.
- No timeout / connection reset / statement timeout found in the checked post-restore log window.

## Top 3 blockers

1. Destination tax is not verified for EPROLO Market5 variants -> final profit cannot be truthfully marked PASS.
2. Pre-supplier live recheck fix exists only on Preview branch and is not deployed; live supplier ordering remains intentionally OFF.
3. Database capacity/cron pressure remains a reliability risk; current staggered schedules are stable in the verified window but need longitudinal monitoring.

## Immediate action
Resolve DESTINATION_TAX_NOT_VERIFIED with an approved tax source/rule per destination market, then rerun the same 83-variant Men Shoes audit. This is the shortest path from current PROFIT_REVIEW to genuine final-profit truth without enabling Payment or Supplier Live Order.
