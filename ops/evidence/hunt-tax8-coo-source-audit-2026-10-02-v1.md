# HUNT TAX8 COO Source Audit — 2026-10-02 v1

## Scope

Shadow-only source audit for country-of-origin / customs inputs required to close the eight EPROLO `DESTINATION_TAX_NOT_VERIFIED` products.

No tax exception is resolved by this evidence. No COO or HS code is inferred from product title, supplier location, warehouse, material, category, or shipping route.

## Current blocker

The eight TAX8 canonical shelf-candidate rows currently have no verified:

- `country_of_origin`
- `origin_country`
- `hs_code`
- `customs_code`
- country-level manufacture evidence

The current persisted payload also does not contain material/composition/description for these eight rows.

Therefore Zonos/landed-cost work cannot yet be treated as final destination-tax truth.

## Official EPROLO API source

EPROLO Account Support Rep Rick supplied HUNT with the official ShowDoc API documentation link by email on 2026-09-21. Credentials are intentionally not recorded in this evidence or in Git.

The source-controlled contract extracted from that documentation records:

- base URL: `https://openapi.eprolo.com/`
- read-only catalog endpoint: `eprolo_product_list.html`
- exact-variant shipping/cost/stock endpoint: `get_product_shiping_fees.html`

Both endpoints are already verified in HUNT runtime for their current purposes.

The existing extracted contract does **not** document a Product Detail endpoint that HUNT has verified for COO/HS/customs truth, and it does not record a supported COO/HS field from the two read-only endpoints above.

EPROLO's public API page also says the API document is supplied through the Account Support Representative rather than publishing the full API schema publicly.

## Exact public EPROLO product-page audit

Exact supplier public pages were found for six of the eight TAX8 products.

### `12515068` — Flying woven air cushion men's shoes

Exact EPROLO product page found.

Observed public-page evidence:
- exact product title and variants
- sizing / merchandising description

Not observed in the retrieved page:
- country of origin
- place of origin
- HS / tariff / customs code

Result: `COO_UNVERIFIED`.

### `31411072` — Breathable air-cushion dad sneakers

Exact EPROLO product page found.

Observed material evidence:
- Upper Material: Microfiber
- Sole Material: Rubber
- Inner Lining Material: Mesh

Not observed in the retrieved page:
- country of origin
- place of origin
- HS / tariff / customs code

Result: `MATERIAL_VERIFIED_COO_UNVERIFIED`.

### `32590502` — Men's Premium Casual Minimalist Lapel Jacket

Exact EPROLO product page found.

Observed material evidence:
- Lining Material: Polyester

Not observed:
- country of origin
- HS / tariff / customs code

Result: `MATERIAL_PARTIAL_COO_UNVERIFIED`.

### `32590510` — Men's Vintage Maillard Leather Lapel Loose Jacket

Exact EPROLO product page found.

Observed:
- exact product / colors / sizes / apparel description

Not observed:
- country of origin
- place of origin
- HS / tariff / customs code
- sufficiently specific composition for customs classification

Result: `COO_UNVERIFIED`.

### `32677402` — Men's Vintage Oil-Waxed Leather Biker Jacket

Exact EPROLO product page found.

Observed supplier material truth:
- Main Fabric Composition: Polyester Fiber
- Ingredients: Polyester fiber

This directly demonstrates why title inference is unsafe: the title contains “Leather”, while the supplier description identifies the main composition as polyester fiber.

Not observed:
- country of origin
- HS / tariff / customs code

Result: `MATERIAL_VERIFIED_COO_UNVERIFIED`.

### `32679860` — Vintage Star Velvet PU Leather Baseball Jacket

Exact EPROLO product page found.

Observed supplier material truth:
- Fabric Name: PU

Not observed:
- country of origin
- HS / tariff / customs code

Result: `MATERIAL_VERIFIED_COO_UNVERIFIED`.

### `29949926` — Vintage stand-up-collar denim jacket

The web audit found several EPROLO stand-collar denim products, but did not establish an exact public-page identity match to this HUNT item strongly enough for origin evidence.

Result: `EXACT_PUBLIC_PAGE_NOT_PROVEN_COO_UNVERIFIED`.

### `31998888` — EVA slip-on sandals for couples

The web audit found comparable EVA products, but did not establish an exact EPROLO public-page identity match to this HUNT item strongly enough for origin evidence.

Result: `EXACT_PUBLIC_PAGE_NOT_PROVEN_COO_UNVERIFIED`.

## Live orphan helper audit

Two active Supabase Edge Functions were found in the live project:

- `hunt-eprolo-variant-metadata-shadow`
- `hunt-eprolo-physical-evidence`

Neither exists in the current Git source-of-truth under `supabase/functions/`.

They are therefore treated as legacy/orphan live helpers, not authoritative launch source.

Both call `get_product_shiping_fees.html` and contain a single-record fallback that can accept the only returned variant even when the requested exact variant ID was not matched.

Consequences:
- they are not accepted as exact-variant COO/customs evidence;
- they must not resolve TAX8 exceptions;
- they must not be used to infer origin from a nonmatching record;
- no deploy/delete/live change is performed in this audit.

The physical-evidence helper only persists weight, inventory, cost, options, SKU and image metadata; it does not establish COO/HS.

## Accepted COO evidence policy for TAX8

A TAX8 item may advance from `COO_UNVERIFIED` only with one of the following exact-item sources:

1. Official EPROLO API response bound to the exact product/variant and containing an explicit country-level manufacture/origin field.
2. Exact EPROLO supplier product page explicitly stating a country-level `Place of Origin` / `Country of Origin` for that product.
3. Written EPROLO Account Support / technical-team attestation tied to the exact item IDs and, where origin can vary by variant, exact variant IDs.
4. Supplier commercial/customs document that explicitly binds the item/variant to country of origin.

Province/city, warehouse country, shipping origin, supplier company address, or generic “Made in China” evidence from a comparable product is not accepted for a different TAX8 item.

## HS / customs policy

Do not guess HS from category/title.

Once exact COO is verified:

- use verified supplier material/composition where available;
- pass item description/category/material + verified COO to Zonos Classify/Landed Cost Shadow;
- record the returned classification/tax/duty evidence separately from the reserve table;
- keep `final_profit_verified=false` until destination pricing, duties/taxes, fees and reserves all pass together.

## Current TAX8 status

All eight remain:

- `DESTINATION_TAX_NOT_VERIFIED`
- `final_profit_verified=false`
- no sellable/public/Production effect from this audit

Priority remains:
1. `12515068` — strongest market-price candidate, but COO still missing.
2. `31411072` — useful material evidence, COO still missing.
3. `31998888` — market holds already identified for AE/IL; COO still missing.
4. Jacket group — useful material evidence on several products, but COO remains missing; IL pricing remains HOLD.

## Next exact action

Request from EPROLO Account Support/technical team, for the eight listed item IDs and exact variant IDs:

- country of origin / manufacture country;
- any official HS/tariff/customs field available in their API or product data;
- whether COO is product-level or variant-level;
- the documented API endpoint/field name if available.

Do not send a supplier message automatically without explicit send approval.

## Safety state

Payment Live OFF · Supplier Live Order OFF · Profit Release OFF · PayPlus Paid OFF · PR26 Draft · No Merge · No Production without Owner Gate.
