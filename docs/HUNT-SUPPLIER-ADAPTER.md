# HUNT Supplier Adapter

## Current status
ORPE / BRASTY is the first supplier lane.
The adapter is implemented locally and is NOT deployed.
No ORPE credential or feed URL is stored in Git.

## Flow
ORPE CSV/JSON feed
→ hunt-supplier-adapter
→ normalize and safety-filter
→ hunt_catalog_products
→ catalogWarehouseShelves()
→ hunt-storefront
→ HUNT Light v2

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
