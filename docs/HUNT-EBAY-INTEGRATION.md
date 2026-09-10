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

This phase does not activate eBay checkout inside HUNT.
The adapter reports checkout_api=false.
Onsite eBay checkout requires the appropriate eBay Buy API production approval and a separate HUNT checkout verification pass.

## Activation test

The local secure setup script:
1. prompts locally for Production Client ID and Client Secret
2. stores them with Supabase secrets via a temporary chmod-600 env file
3. generates a private internal HUNT/eBay function token
4. deploys hunt-ebay-browse
5. calls status
6. performs a real Women fashion Browse search

Activation is successful only when the live OAuth/Browse request returns ok=true.
