# HUNT Secure Checkout Handoff

## Goal
Keep the shopping experience branded as HUNT until the last safe step, while never misleading the buyer about who processes payment or submits the order.

## Supported lanes
1. HUNT onsite checkout — only where HUNT has explicit provider/payment approval.
2. Partner checkout handoff — HUNT shows product, seller, source price and disclosure, then sends the buyer through the approved HUNT outbound route to the partner.
3. Discovery-only — no checkout claim; outbound visit only.

## Partner handoff security
- Handoff page accepts only provider + product id.
- Destination URL is never trusted from user query parameters.
- The product detail API returns a server-generated partner_handoff_url.
- Browser accepts only the same Supabase origin and exact /functions/v1/hunt-go path.
- hunt-go resolves the approved merchant destination from the database and records attribution.
- Card details are never collected by the handoff page.
- Final price, shipping, tax, returns and payment remain the partner's responsibility.

## Current limitation
There are currently no merchant_products rows that are both approved + safety passed under an approved merchant store, so a real merchant end-to-end handoff cannot yet be exercised without fabricating data. The page must fail closed until the first real merchant is approved.

## Future direct-checkout lane
For merchant-authorized Shopify Storefront integrations, HUNT can create a merchant cart and hand off to the merchant-issued checkout URL. That requires explicit merchant authorization and should be treated separately from generic affiliate traffic.
