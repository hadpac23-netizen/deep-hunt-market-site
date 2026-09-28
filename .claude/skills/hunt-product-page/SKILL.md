---
name: hunt-product-page
description: This skill should be used when creating or changing HUNT product detail pages, variant selectors, size data, product attributes, galleries, recommendations, reviews, or product-page navigation.
---

# HUNT Product Page

Maintain vertical information flow:
Breadcrumb -> Gallery -> Purchase block -> Color/Variant -> Size/Configuration -> Quantity -> CTA -> Measurements -> Attributes -> Details -> Shipping/Returns -> Reviews/Video -> Similar -> Pairs Well With -> Discover -> Recently Viewed.

Variant rules:
- Render supplier-backed/verified options only.
- Selection updates exact image, price, stock, shipping, SKU and relevant specs.
- Disable unavailable options; never make them selectable.

Sizing:
- Supplier size is primary.
- US / UK / EU only when mapping is verified.
- Convert verified cm to inches mathematically.
- Never guess regional conversions.

Attribute schema must match product type:
- apparel: material, fit, measurements, care
- shoes: size, foot length, width, material
- bags: dimensions, capacity, compartments, strap, weight
- jewelry: material, finish, length, dimensions, closure/stone when verified
- watches: case, band, movement, material, water resistance when verified
- electronics: model, storage, memory, connectivity, voltage, plug, compatibility
- home: dimensions, material, weight, capacity
- lighting: dimensions, power, voltage, plug, color temperature/source type

Recommendations:
- Similar = exact shopping intent.
- Pairs Well With = controlled complementary.
- Discover = diverse but truth-gated.
- Deduplicate across sections.
- Keep vertical product grids.
