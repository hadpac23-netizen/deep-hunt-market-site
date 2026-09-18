# HyperSKU ↔ HUNT Integration Contract

Status: Tier 0 supplier integration foundation
Mode: architecture/pilot; live fulfillment OFF

## Verified public capability

HyperSKU publicly documents:
- Open API for custom stores,
- automatic order processing,
- product sourcing,
- stock/inventory workflows,
- order synchronization,
- tracking synchronization,
- shipping options by destination.

HUNT must use the official integration/API path only.

## HUNT canonical mapping

Every HyperSKU product must map into the same supplier-neutral HUNT object:
- provider = hypersku
- item_id
- supplier_product_id
- sku
- variant_id
- title
- category
- images
- attributes
- supplier_cost
- currency
- stock
- stock_checked_at
- warehouse
- destination_country
- shipping_method
- shipping_cost
- ETA
- landed_cost
- truth_status
## Required adapter operations

The HyperSKU adapter must expose contracts for:
1. authentication/config readiness,
2. product lookup/import,
3. SKU/variant detail,
4. inventory freshness,
5. shipping quote by destination,
6. order handoff preparation,
7. order status,
8. tracking status,
9. error normalization.

Do not invent API endpoints before authenticated HyperSKU documentation is available.

## Country Brain contract

HyperSKU never bypasses Country Brain.

For each candidate:
- verify destination eligibility,
- verify exact SKU/variant,
- verify stock,
- verify shipping method/cost,
- verify ETA where available,
- compute landed economics,
- pass Product Truth,
- then allow Decision Brain ranking.

Marketing claims about global warehouses do not prove a specific SKU is locally stocked.

## Israel rule

Do not hard-code Israel availability.
Use a live quote/integration response when connected.
If no current eligible shipping method is returned, the product is not eligible for Israel.

## Fulfillment gate

Live order submission remains OFF until:
- authenticated connection passes,
- product/SKU mapping passes,
- shipping quote passes,
- order/tracking mapping passes,
- economics pass,
- error/retry behavior passes,
- owner approval is explicit.

Catalog/read-only integration may proceed before fulfillment.
## Supplier Brain role

HyperSKU is Tier 0 but not exclusive.

BOOM compares eligible suppliers using:
- product quality,
- exact stock,
- landed cost,
- delivery,
- reliability,
- return feasibility,
- margin.

CJdropshipping and EPROLO remain valid lanes.

## Error behavior

Normalize provider errors into:
- AUTH_REQUIRED
- PRODUCT_NOT_FOUND
- VARIANT_NOT_FOUND
- OUT_OF_STOCK
- COUNTRY_UNAVAILABLE
- SHIPPING_UNAVAILABLE
- QUOTE_STALE
- RATE_LIMITED
- PROVIDER_TEMPORARY_ERROR
- UNKNOWN_PROVIDER_ERROR

Never convert an integration error into fake availability.

## Alpha exit condition

HyperSKU is considered Alpha-ready when:
- provider normalization passes tests,
- canonical mapping is implemented,
- read-only product/stock/quote flow is verified against real provider responses,
- unsupported destinations are blocked,
- Decision Brain consumes normalized candidates,
- fallback to other suppliers works.

Fulfillment readiness is a separate milestone.

## Read-only Edge Function source

Local source now exists at:
`supabase/functions/hunt-hypersku-readonly/index.ts`

Current runtime state:
- source implemented,
- deployment OFF,
- provider token not assumed,
- provider endpoint paths not guessed,
- fulfillment OFF.

Supported control actions:
- readiness,
- product,
- stock,
- shipping_quote.

Until authenticated HyperSKU Open API documentation is supplied, non-readiness provider transport returns `PROVIDER_DOCS_REQUIRED` / `CONFIGURED_NOT_EXECUTED`.
