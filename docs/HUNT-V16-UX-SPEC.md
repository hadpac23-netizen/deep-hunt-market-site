# HUNT V16 — Professional Storefront UX Specification

## Objective
Rebuild HUNT as a calm, premium, high-conversion global marketplace. The interface must prioritize product discovery and purchase confidence over decoration.

## Non-negotiables
- No glow, pulse, glassmorphism, decorative gradients, cinematic overlays, animated chrome, or scroll-hiding navigation.
- No supplier names, internal QA codes, production flags, profit-gate jargon, or technical status labels in shopper-facing cards.
- Production, payment capture, and supplier live ordering remain OFF unless explicitly enabled elsewhere.
- Use only products that pass HUNT catalog safety filtering.
- Never fabricate stock, variants, retail price, reviews, shipping, or readiness.
- If a value is unknown, omit it or show a calm neutral state.
- Product links must preserve provider + item id and cache the clicked product for immediate fallback rendering.

## Homepage information architecture
1. Header: HUNT wordmark, large search, language, account, wishlist, bag.
2. Primary navigation: Women, Men, Shoes, Beauty, Accessories, Home, Kids, Deals.
3. Secondary navigation: context-sensitive categories; maximum one row on desktop with horizontal overflow if needed.
4. Hero: editorial split layout. Copy panel + photographic panel; one supporting feature panel.
5. Department shortcuts: 7 real departments + New Arrivals.
6. Trending Now: exactly 8 products above the fold on wide desktop.
7. Category / search result state: title, result count, optional filter/sort, clean responsive grid.

## Homepage visual system
- Background: warm off-white.
- Text: near-black.
- Accent: muted gold only.
- Serif display face for HUNT and editorial headings; sans-serif for UI.
- No shadows except subtle native focus/overlay surfaces where necessary.
- Product thumbnails must show the actual product clearly.
- Desktop product grid: 8 columns at wide viewport, 6 medium, 4 tablet, 2 mobile.
- Card content: image, title, price when verified, optional color swatches only when sourced.

## Product detail page — desktop
Above the fold:
- Compact HUNT header.
- Breadcrumb.
- 60/40 layout:
  - Left: main product image + visible thumbnail strip.
  - Right: title, verified review summary if available, price, color, size, stock/delivery signal, quantity, primary CTA.
- Size options must be visible buttons, not a dropdown.
- If product detail API fails but a clicked card was cached, render the cached card immediately as fallback.
- Loading state is a short skeleton, never a giant 'Loading product' message.

Below the fold:
1. Product Details
2. Specifications / Materials
3. Size & Fit / measurements when verified
4. Shipping & Returns / availability notes
5. Reviews
6. Similar Products
7. Complementary Products only when semantically relevant

## Product detail page — mobile
- Product image first.
- Swipe/thumbnail gallery.
- Title + price + option selectors.
- Sticky bottom purchase bar only after a valid product is loaded.
- Sections use disclosure/accordion behavior where content is lengthy.
- No horizontal tabs for critical product information.

## States
- Loading: skeleton blocks.
- Missing product id: concise error + Back to HUNT.
- API failure with cache: render cached product, mark options unavailable quietly.
- No verified retail price: show 'Price being confirmed' and disable purchase CTA.
- No variants: hide color/size selectors and disable purchase CTA.
- Out of stock: disable purchase CTA and show clear availability text.
- Empty search/category: concise recovery action.

## Accessibility
- Semantic header/nav/main/section hierarchy.
- Visible keyboard focus.
- Alt text from product title.
- Buttons >= 40px target size on mobile.
- Minimum AA contrast.
- No information conveyed by color alone.
- Search and variant controls have accessible labels.
- Respect reduced-motion; V16 itself uses no decorative motion.

## Data and truth
- Homepage source priority: live hunt-cinematic-shadow-catalog, then static Shadow fallback.
- Product detail: existing HuntCore.storefront service.
- Cached click fallback key: hunt_product_<provider>:<item_id>.
- Use provider + id in URL; do not rely on visual title to resolve a product.
- Shopper-facing retail price only when positive and provided by the catalog/product truth layer.

## Research basis
- Baymard Product Page UX 2026: visible size buttons, strong product imagery, discoverable thumbnails, clear product-page hierarchy.
- Baymard PLP UX 2026: scannable product listing pages, accurate thumbnails, obvious filters and visual cues.
- Nielsen Norman Group Ecommerce Product Pages: combine product details, media, price, availability and an obvious purchase path.
- Shopify product-page guidance: prioritize product title, price, variants, media, availability and CTA.

## Acceptance gates
- JavaScript syntax PASS.
- Homepage links cache product payload and open product-v16.html with provider + id.
- Product page can render from cache even if live product detail fails.
- No old V10/V14 visual CSS imported.
- No shopper-facing technical readiness language.
- Responsive at 1440, 1024, 768, 390 widths by CSS rules.
- Visual QA remains BLOCKED until a browser-rendered screenshot can be compared against the selected reference.
