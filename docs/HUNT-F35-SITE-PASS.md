# HUNT F35 Site Pass — 2026-09-10

## Mission

HUNT must feel like a strong commerce product before it feels like an AI demonstration.

The storefront has two simple shopper paths:
1. Shop normally.
2. Give HUNT a mission.

BOOM remains the intelligence layer behind both paths.

## F35 storefront doctrine

### 1. Home is a command center, not the entire warehouse
The homepage shows a curated cross-section of live inventory.
Full catalog depth remains available through Search and Categories.
Home must not render every possible category at once.

### 2. Findability first
Search, departments, Women, Men and major commercial categories remain immediately reachable.
Category pages carry the deeper product density and filters.

### 3. Product truth before conversion pressure
A product page must distinguish:
- supplier/source price
- merchant retail price
- verified HUNT retail price

Supplier/source price is never presented as the final customer retail price.

Shipping is shown only when a destination quote is verified.
Returns are shown only when provider policy data is verified.
Missing information is shown as pending rather than invented.

### 4. Checkout is the final truth gate
Checkout may show a customer subtotal only when retail pricing is verified and Profit Gate has passed.
Otherwise it shows PRICING PENDING.
Payment remains disabled while fulfillment/payment/tax controls are incomplete.

### 5. Mobile is a first-class buying path
No horizontal overflow.
Search and cart remain accessible.
Product grids collapse cleanly.
Mission creation remains usable without desktop-only controls.

### 6. BOOM does not create visual noise
BOOM appears where it improves a decision:
- Mission
- verified promotion
- Deal Passport
- Deal Chess
- product confidence
- risk / truth notices

It does not fill the page with generic AI panels.

## QA evidence

Local preview proxy:
- same-origin local proxy for public Supabase Edge Function calls
- no secret credentials in browser or proxy
- production CORS remains unchanged

Verified live product:
- Printful item 329
- product detail loaded from live HUNT storefront API
- 21 visible product images
- 0 broken product images
- 0 horizontal overflow

Home after F35 density reduction:
- desktop page height reduced from about 18,206 px to about 11,085 px
- visible images reduced from 140 to 80
- no horizontal overflow
- full inventory remains available through Categories and Search

Flow tests:
- live product → checkout-light-v2.html: PASS
- checkout subtotal without verified retail pricing: PRICING PENDING
- HUNT Mission persistence: PASS

## BOOM Display Art Doctrine

The first-view merchandising order is intentionally stable:
1. Women · Clothing
2. Women · Shoes & Accessories
3. Men

BOOM may personalize the departments that follow, but it must not displace those first three launch priorities.

Visual merchandising rules:
- Prefer products with valid HTTPS imagery, verified availability, usable product titles and real price data.
- Preserve supplier diversity instead of letting one source dominate a shelf.
- Use category imagery to identify the category, not merely decorate it.
- Keep curated homepage shelves smaller than the full catalog; depth belongs in Category and Search.
- Never label a product popular, trending, scarce or best-selling without verified evidence.
- Never fabricate a discount, crossed-out price, review count or urgency cue.
