# HUNT X04 — Variant / Size / Compatibility Truth — 2026-09-19

## Status
PARTIAL by design.

The variant-stock decision gap is closed. X04 remains PARTIAL because HUNT does not yet receive:
- a verified product measurement / size chart source;
- a structured device compatibility matrix source.

No synthetic chart or compatibility promise is generated.

## Source finding
Live CJ product detail and live CJ stock quote disagree on inventory semantics.

Example:
- Product: Applicable To IPhone15 Multi-functional Phone Case Three-in-one
- Item ID: 1763106168701988864
- Variant ID: 1763106168769097728
- Selected option: Black / IPhone15
- hunt-storefront product detail inventory: 0
- hunt-cj-quote queryByVid: stock_verified=true, stock_available=true

Therefore HUNT must not treat the inventories array embedded in product detail as authoritative cart stock for CJ.

## Implemented architecture
1. Product detail loads variants and source option labels.
2. CJ variants remain selectable before stock verification.
3. PDP displays STOCK RECHECK.
4. Add intent calls the existing official HUNT CJ quote route for exact variant_id + quantity.
5. Quote calls CJ queryByVid.
6. Only stock_verified=true + stock_available=true enables cart insertion.
7. Verified unavailable stays on PDP, blocks cart and shows OPTION UNAVAILABLE.
8. Quote failures remain retryable and do not add cart.
9. Quote cache is keyed by variant_id + quantity.
10. Quantity change requires a new stock verification.
11. Checkout rechecks again; PDP verification does not replace checkout verification.

## Size / option truth
Fashion-like products:
- UI label: Size
- exposes provider size_source and size_system
- explicitly states that no verified measurement chart is supplied when absent.

Device/accessory products:
- UI label: Model / option
- provider option labels such as IPhone15 are not called body sizes
- HUNT explicitly states compatibility is not independently verified unless a structured compatibility field exists.

## Browser evidence
Live CJ happy path:
- runtime: product.js launchqa11
- selected: Black / IPhone15
- pre-check: STOCK RECHECK
- CTA: Verify stock & add
- Product Truth: selected option needs live stock verification
- live quote: exact VID + quantity 1
- cart result: exact item ID, variant ID, Black / IPhone15, quantity 1
- HUNT retail / Profit Gate identity preserved

Controlled unavailable-path harness:
- stock_verified=true, stock_available=false
- PDP remains on product
- Decision Check state: blocked
- CTA: Selected option unavailable
- cart count remains 0
- quantity 1 → 2 returns to STOCK RECHECK because quote key changes

Mobile:
- 390px no horizontal overflow.

Fashion truth:
- real CJ dress
- Size label remains Size
- Size & fit truth
- provider system ALPHA
- no verified measurement chart claim

## Guardrails
- No automatic stock calls on every option click.
- No false out-of-stock based on product-detail inventory.
- No fake size chart.
- No inferred device compatibility.
- No Production/backend change.
- Payment and supplier ordering remain OFF.
