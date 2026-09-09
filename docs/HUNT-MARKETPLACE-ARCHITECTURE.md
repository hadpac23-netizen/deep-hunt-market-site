# HUNT Multi-Merchant Marketplace Architecture

## Current v1
### Merchant layer
- merchant_accounts
- merchant_stores
- merchant_products
- merchant_api_keys
- merchant_ad_requests

### Attribution layer
- merchant_outbound_clicks
- merchant_conversion_events

### Edge functions
- hunt-seller-api
  - merchant application
  - seller dashboard
  - API key issuance
  - manual product submission
  - Seller API single/batch product sync
  - admin store/product/ad moderation
  - admin affiliate tracking configuration
- hunt-go
  - validates approved merchant/product
  - generates first-party click_id
  - stores attribution event
  - redirects only to an approved destination
  - optionally injects click_id into HUNT-admin-configured affiliate tracking template
- hunt-storefront
  - merges approved HUNT Merchant products with approved supplier/catalog sources
  - merchant product details use external partner checkout until onsite commerce is separately approved

## Public UI
- sell.html — merchant application/dashboard
- seller-api.html — Seller API documentation
- merchant-admin.html — owner/admin review surface
- partners.html — broader partnership entry

## Security principles
- Seller API raw keys are shown once; database stores only hash.
- Sellers cannot modify affiliate redirect templates directly.
- New/changed merchant products are pending_review.
- Store and product approval are separate.
- External destination comes from approved DB state, not shopper-controlled query input.
- No buyer payment or payout functionality is enabled by this marketplace layer.

## Next phases
1. API rate limiting and per-key quotas.
2. Merchant webhook registration.
3. CSV/XML/JSON feed importer.
4. Shopify OAuth connector.
5. WooCommerce connector.
6. Seller analytics dashboard.
7. Conversion webhook adapters for specific affiliate networks.
8. Shipping/return policy schema.
9. Merchant service-quality score.
10. Optional onsite order/payout architecture only after legal/payment/fulfillment readiness.
