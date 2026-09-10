# HUNT eBay Browse Integration

## Scope

Phase 1 is read-only marketplace discovery for HUNT, focused on safe fashion categories.

Supported HUNT departments:
- Women
- Women accessories
- Dresses
- Tops
- Bottoms
- Jackets
- Knitwear
- Activewear
- Shoes
- Bags
- Jewelry
- Accessories
- Hats
- Men
- Suits
- Underwear / essentials
- Socks

## Authentication

The adapter uses eBay OAuth Client Credentials with a Production Application keyset.
Credentials live only in Supabase Edge Function secrets:
- EBAY_CLIENT_ID
- EBAY_CLIENT_SECRET
- EBAY_MARKETPLACE_ID
- HUNT_EBAY_INTERNAL_TOKEN
- HUNT_EBAY_ORDER_INTERNAL_TOKEN
- EBAY_ORDER_API_APPROVED
- EBAY_EPN_CAMPAIGN_ID (when approved / configured)
- EBAY_EPN_REFERENCE_ID (optional attribution reference)

No eBay client secret is stored in Git, browser JavaScript, catalog JSON, or chat.

## Truth policy

Search results are discovery records:
- condition must be NEW
- item must expose FIXED_PRICE as a buying option
- adultOnly items are rejected
- HUNT catalog safety terms are applied
- additional fashion safety / quality terms are applied
- eBay default relevance order is preserved

A search result is not marked availability_verified merely because it appeared in search.
HUNT calls eBay item detail and checks estimated availability plus item end date before marking availability verified.

## Price policy

eBay listing price is MARKETPLACE_RETAIL, not HUNT-owned inventory cost.
HUNT does not invent crossed-out prices, discounts, shipping or profit.
Affiliate attribution can be added later only through an approved eBay Partner Network configuration.

## Checkout policy

HUNT uses ONSITE_FIRST for eBay.

- eBay products do not use a silent outbound / affiliate checkout fallback.
- Product records carry onsite_checkout_required=true.
- Until eBay grants Order API production access, the HUNT buy button stays disabled and reports ORDER_API_APPROVAL_REQUIRED.
- After approval, HUNT uses eBay Order API v2 Guest Checkout and the official Checkout with eBay widget inside the HUNT site.
- Browse price is not treated as final landed checkout total; the Order API checkout session becomes the source of shipping/tax/import-charge truth.
- HUNT does not store guest contact or shipping details in its database as part of the adapter; those values are forwarded only to the authorized eBay checkout session.

## Activation test

The local secure setup script:
1. prompts locally for Production Client ID and Client Secret
2. stores them with Supabase secrets via a temporary chmod-600 env file
3. generates a private internal HUNT/eBay function token
4. deploys hunt-ebay-browse and hunt-ebay-order
5. calls Browse status
6. performs a real Women fashion Browse search
7. calls Order status; onsite checkout remains locked unless eBay Order API approval is explicitly enabled

Activation is successful only when the live OAuth/Browse request returns ok=true.
