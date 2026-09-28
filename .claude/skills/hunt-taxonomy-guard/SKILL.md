---
name: hunt-taxonomy-guard
description: This skill should be used whenever HUNT products are categorized, imported, displayed in shelves, deduplicated, routed, recommended, or moved between departments. It enforces exact taxonomy and prevents product mixing.
---

# HUNT Taxonomy Guard

## Canonical hierarchy
Main Category -> Department -> Exact Shelf -> Product -> Variant.

## Canonical identity
Product: provider + item_id.
Variant: provider + item_id + variant_id.

## Mandatory gate before render
1. Safety pass.
2. Normalize candidate taxonomy.
3. Inspect exact product identity from title/metadata/verified source.
4. Resolve one canonical route.
5. Reject duplicate visible ownership.
6. Reject cross-shelf filler.
7. HOLD ambiguous identities.

## Exact examples
- Socks -> Socks only.
- Earrings -> Earrings only.
- Necklaces -> Necklaces only.
- Bracelets -> Bracelets only.
- Rings -> Rings only.
- Hair clips/scrunchies/headbands -> Hair Accessories only.
- Bags/totes/backpacks/crossbody -> Bags only.
- Hats/caps/beanies -> Hats only.
- Watches -> Watches only.
- Sunglasses -> Sunglasses only.
- Shoes -> Shoes only.
- Swimwear -> Swimwear only.
- Lighting -> Lighting only.
- Kitchen -> Kitchen only.
- Tech -> Tech only.

Generic Accessories never overrides a more specific exact identity.

## Legacy data
Do not trust a shard/category label by itself.
Example: a title such as “Christmas Tree Skirt” is not Women -> Dresses even if an old source labels it dresses.

## Recommendations
Do not use recommendation logic to bypass taxonomy.
Similar must remain exact-intent.
Complementary and Discover must remain separate and deduplicated.
