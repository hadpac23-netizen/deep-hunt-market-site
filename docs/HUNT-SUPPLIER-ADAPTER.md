# HUNT Supplier Adapter

## Current status
Brandsdistribution / BDroppy is now the first paid supplier lane for HUNT fashion.
Its official sandbox is reachable and returns the expected 401 on API calls without credentials.
The adapter is configured to use the sandbox host first. It is implemented locally and is NOT deployed.
BrandsGateway stays second because its custom REST API/CSV plan is materially more expensive.
ORPE / BRASTY stays conditional because current registration requires a valid EU VAT number.
No supplier credential, password or private feed URL is stored in Git.

## Flow
Brandsdistribution CSV/API or ORPE CSV/JSON feed
→ hunt-supplier-adapter
→ normalize + safety filter + market eligibility gate
→ hunt_catalog_products
→ catalogWarehouseShelves()
→ hunt-storefront
→ HUNT Light v2

Brandsdistribution catalog imports PRODUCT and MODEL rows together so HUNT can preserve supplier SKU, barcode/EAN, price and real stock totals. Country selling restrictions remain a separate market-eligibility check before regional publishing.

## Default safety
- Feed URL comes only from Supabase secrets.
- HTTPS is required.
- Feed payload is capped at 15 MB.
- Dry-run is the default.
- Unknown/unrelated categories are dropped.
- Missing stock is not presented as verified availability.
- Authenticity stays unverified until supported by supplier/account evidence.
## Required secrets
- HUNT_SUPPLIER_INTERNAL_TOKEN
- ORPE_FEED_URL
- ORPE_FEED_FORMAT=csv
- ORPE_CSV_DELIMITER
- ORPE_FEED_AUTHORIZATION when required
- ORPE_FEED_FIELD_MAP when supplier column names differ

## Activation sequence
1. Obtain the approved ORPE/BRASTY feed URL or API credentials.
2. Set secrets in Supabase; never place them in frontend code.
3. Run supplier adapter in dry-run mode.
4. Verify sample title, brand, EAN, price, stock, image, volume and category mapping.
5. Apply the catalog-field migration.
6. Run security/performance advisors.
7. Deploy the adapter and warehouse-reader storefront patch.
8. Run production dry-run.
9. Import only after the evidence gate passes.
10. Confirm products appear in Perfume/Beauty without unrelated filler.

## Upgrade path
Start with the feed lane. Move to ORPE API automation later for real-time stock, prices, orders and tracking when the chosen plan and credentials support it.
