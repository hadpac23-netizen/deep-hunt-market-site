# HUNT Marketplace Brain — Seller & Affiliate Operations

## Mission
Operate HUNT as a controlled multi-merchant marketplace and discovery layer. Make it easy for stores, brands and retail chains to connect products while keeping publishing, attribution and customer trust under HUNT control.

## Marketplace lifecycle
1. Merchant application
2. Business/store review
3. Store approval
4. Integration path selected: manual, Seller API, feed, platform connector
5. Product submission
6. Schema + safety validation
7. Product review
8. Approved product becomes eligible for storefront shelves
9. Shopper discovery
10. Onsite checkout only when technically and contractually approved; otherwise tracked external visit
11. Conversion attribution when a partner/network returns a valid matching reference
12. Seller quality monitoring

Submission is never the same as publication.

## Seller quality score
Evaluate:
- store verification status
- valid HTTPS domain
- catalog data quality
- image quality
- category accuracy
- price clarity
- inventory freshness
- return/shipping clarity
- broken-link rate
- review quality
- cancellation/refund performance when real
- conversion quality when real

Do not reward volume alone.

## Product ingestion rules
Every manual/API/feed product must include:
- stable external_id
- title
- safe HUNT category
- approved store
- merchant product URL when checkout is external
- currency
- retail price when shown as a price
- image URLs if supplied
- inventory only when known

Reject:
- unsupported category
- unsafe/restricted product
- non-HTTPS merchant destination
- destination outside approved store domain
- invalid price/reference price
- malformed images
- attempts to mark a product public without review

## API key rules
- Generate server-side only.
- Show raw key once.
- Store only a cryptographic hash.
- Never embed seller secret keys in browser code.
- Allow revocation.
- Track last use.
- Rate-limit before broad external rollout.

## Publishing
Use explicit states:
pending -> approved/rejected/suspended for stores
draft -> pending_review -> approved/rejected/archived for products

An approved product may be shown only when its store is approved and safety_status passed.

## External attribution
HUNT owns the redirect layer.
- Destination must come from the approved store/product record.
- Generate a unique click_id.
- Record store, product, source page, campaign and privacy-safe session reference.
- Do not create an arbitrary redirect parameter.
- When an affiliate program supports a SubID / ClickRef / member reference, pass HUNT click_id through the configured template.
- Match network conversion reports/webhooks back to click_id when contracts and APIs support it.
- Never claim a conversion/commission before network confirmation.

## Sponsored placements
Merchant may request placement, but HUNT admin approves before activation.
Requirements:
- approved store
- eligible destination
- clear sponsored labeling
- real campaign dates
- no fake discount/urgency
- performance measured separately from organic ranking
- sponsored status must never silently contaminate organic recommendation quality

## Platform connectors
Preferred architecture:
- HUNT native Seller API for custom stores
- platform OAuth/connectors for Shopify/WooCommerce/etc. when available
- Amazon/eBay seller APIs only with authorized seller accounts
- affiliate network tracking only through approved publisher relationships

## BOOM responsibilities
BOOM remains behind the scenes and can:
- flag poor catalog quality
- propose category mapping
- detect duplicates
- identify stale inventory
- rank merchant opportunities
- recommend which stores to invite
- detect broken product URLs
- compare conversion quality by store
- propose sponsored placements
- recommend affiliate/network configuration

BOOM cannot:
- auto-approve a merchant
- auto-approve risky products
- create fake reviews or popularity
- activate paid campaigns or merchant payouts without owner approval
