# HUNT V16 — Master Build Prompt

You are rebuilding HUNT, a global multi-category ecommerce storefront.

## Mission
Create a premium, calm, editorial marketplace that feels immediately understandable and easy to shop. Rebuild the storefront UI from scratch while preserving the verified HUNT catalog and product-detail services. Do not inherit old visual CSS.

## Design target
Use the selected HUNT reference as the composition target:
- warm off-white page
- large HUNT wordmark
- centered rounded search
- thin primary and secondary navigation
- split editorial hero
- department shortcut strip
- 8-across Trending Now grid on wide desktop
- product pages with a large gallery left and purchase panel right

## Hard prohibitions
Do not add glow, pulse, animated gradients, glassmorphism, neon, parallax, floating particles, large technical status badges, supplier branding, debug labels, or hidden-on-scroll navigation.

## Shopper priority
At every step ask:
1. What am I looking at?
2. How much is it?
3. Is my option available?
4. When/how can I get it?
5. What action do I take next?

If the UI does not answer these clearly, simplify it.

## Homepage
Build:
- global header
- search
- Women / Men / Shoes / Beauty / Accessories / Home / Kids / Deals
- contextual second-row categories
- editorial hero
- department shortcut strip
- Trending Now
- clean category/search result grid

Use live HUNT Shadow catalog first and static fallback second. Filter unsafe/adult-only catalog entries. Never fabricate values.

## Product page
Build:
- breadcrumb
- large main image and 5–6 visible thumbnails
- title
- review summary only when real
- retail price only when verified
- color swatches/options
- size buttons
- stock/delivery state
- quantity
- one strong primary CTA
- details, specs, size & fit, shipping, reviews, similar items

On click from a product card:
- store the entire product object in sessionStorage using hunt_product_<provider>:<item_id>
- navigate with ?provider=<provider>&id=<item_id>
This cache must let the PDP render immediately even if the detail API is unavailable.

## States
Use compact skeleton loading.
Use quiet inline errors.
Never show an empty 600px image panel with a giant Loading message.
Never imply checkout is active when retail price or fulfillment readiness is not verified.

## Engineering
- Plain HTML/CSS/JS is acceptable and preferred for the current repository.
- Separate structure, CSS, and JS.
- No dependency on previous HUNT visual stylesheets.
- Reuse existing business/data services such as HuntCore and product.js where they are stable.
- Preserve current safety and production-off constraints.
- Keep product URLs deterministic and shareable.
- Use semantic HTML and accessible controls.
- Test syntax before committing.

## QA
Block handoff if:
- product clicks do not resolve provider + id
- cache fallback does not work
- navigation wraps into unreadable rows
- product price/status is fabricated
- old visual effects leak in
- JS syntax fails
- mobile grid or buybox overflows

Visual fidelity is not considered verified without a rendered-browser screenshot comparison against the selected reference.
