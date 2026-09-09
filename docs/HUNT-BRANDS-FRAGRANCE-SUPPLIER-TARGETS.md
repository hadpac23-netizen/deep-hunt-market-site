# HUNT Brands & Fragrance Supplier Targets

## Truth status
This file separates verified supplier capability from actual HUNT connection state.
Do not show branded inventory as live unless HUNT has a licensed/approved feed, current product data, price/stock evidence and an allowed resale path.

## Priority 1 — ORPE / BRASTY
Status: TARGET — NOT CONNECTED YET.

Verified public capability:
- Europe-focused perfume and cosmetics dropshipping
- 15,000+ products
- 500+ brands
- API, plugin or XML/CSV feed
- inventory, price and order synchronization
- white-label fulfillment
- official site visibly lists examples including Hugo Boss and Versace

HUNT action:
1. complete B2B onboarding
2. obtain API/feed credentials and terms
3. ingest catalog into a staging namespace
4. verify EAN, brand, images, stock, cost and shipping
5. run duplicate/counterfeit/source checks
6. publish only products that pass the gate

## Priority 2 — BrandsGateway
Status: TARGET — NOT CONNECTED YET.

Verified public capability:
- 50,000+ designer products
- 500+ brands advertised on the dropshipping page
- custom-built stores can use REST API
- real-time stock/catalog synchronization through supported integrations
- customer pays through the retailer's store
- white-label fulfillment
- reseller documentation is available to signed-up dropshippers

HUNT action:
1. create supplier account and inspect live catalog
2. confirm plan/API terms for HUNT's custom storefront
3. import only authorized categories/brands
4. store authenticity/reseller evidence per supplier
5. keep brand logos out of marketing unless separately authorized
6. verify economics before activation

## BOOM brand-search rule
A brand name typed in Hebrew, Arabic, English, Spanish or French should normalize to the supplier-search term where a safe alias exists.
Search may discover candidates, but the storefront may display a branded product only after the supplier evidence gate passes.
