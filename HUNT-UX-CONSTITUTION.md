# HUNT UX & Taxonomy Constitution

Status: PRE-LAUNCH INVARIANTS
Scope: HUNT storefront, category pages, product pages, recommendations, BOOM personalization, Cinematic UI, Studio/Dragon integrations.
Owner override: only the Owner may explicitly change these rules.

## 1. Canonical hierarchy
User-facing hierarchy:
Main Category -> Department -> Exact Shelf -> Product -> Variant

Examples of Main Categories:
Women, Men, Kids, Jewelry, Home, Tech, Beauty, Sports, Travel.

Internal data names may differ, but the storefront must present this user-facing hierarchy consistently.

No product may appear in two sellable shelves at the same time.
No cross-category filler is allowed to make a shelf look full.
A parent/overview category may link to child shelves, but must not silently merge child inventories into one product rail.

## 2. Global dedupe identity
Canonical product identity is:
provider + item_id

Variant identity is:
provider + item_id + variant_id

A product duplicated across feeds, supplements, previews, recommendation pools, or category sources must be deduplicated before render.

## 3. Vertical browsing
Primary shopping flow is vertical.
Product grids continue downward.
No primary shopping experience may require left/right product scrolling.
Horizontal interaction is allowed only for small local controls such as image thumbnails or color swatches.

Desktop grids: responsive multi-column.
Mobile grids: one or two columns.
No page-wide horizontal overflow.

## 4. Main Category isolation and department window
Opening a Main Category such as Women, Men, Home, Tech or Jewelry first opens a clean vertical Department window beneath it.

Departments are listed one below another.
Opening one Department expands only that Department directly below its row.
Product browsing continues downward. It never becomes a horizontal product rail.

Opening Women shows Women departments only.
Opening Men shows Men departments only.
Opening Home shows Home departments only.
Opening Tech shows Tech departments only.
Opening Jewelry shows Jewelry departments only.

Non-fashion catalog departments remain first-class parts of HUNT and must not be forced into fashion schemas.

## 5. Jewelry is an independent taxonomy
Jewelry is its own Department/Hub with exact shelves including:
- Earrings
- Necklaces
- Bracelets
- Rings
- Anklets
- Brooches & Pins
- Jewelry Sets

Hair Accessories, Bags, Watches, Sunglasses and generic Accessories are not Jewelry unless exact taxonomy evidence says otherwise.

Jewelry product identity rules take precedence over legacy generic Accessories placement.

## 6. Product page flow
Product pages read top-to-bottom:
Breadcrumb
Gallery
Title / verified price / stock / shipping
Color / exact variant controls
Size / configuration
Quantity / cart
Verified size & measurements
Product-specific attributes
Details
Shipping / returns
Reviews
Video if verified
Similar Products
Pairs Well With
Discover Something Different

Essential information must not be hidden behind horizontal page-level tabs.

## 7. Variant truth
Never invent options.
Only show supplier-backed or HUNT-verified variants.
Variant selection must update the correct image, price, stock, shipping and attribute state.

Unavailable variants may remain visible as disabled where useful.
They must never be selectable.

## 8. Sizes and measurements
Supplier size is the source identity.
US / UK / EU equivalents are shown only when verified.
Do not guess conversion.

Verified cm values may be mathematically converted to inches for display.
Unknown units are not converted.

Apparel and footwear should expose visible size controls when practical rather than hiding sizes in a dropdown.

## 9. Product-type attribute schemas
Do not use one fashion template for all products.

Examples:
Apparel: size, color, material, fit, measurements, care.
Shoes: size, regional mapping, foot length, width, color, material.
Bags: dimensions, capacity, material, compartments, strap type, weight.
Jewelry: material, finish, length, dimensions, stone/type if verified, closure.
Watches: case size, band size, material, movement, verified water resistance.
Home: dimensions, material, weight, capacity, assembly.
Electronics: model, storage, memory, connectivity, voltage, plug, power, compatibility.
Lighting: dimensions, voltage, plug, power, color temperature/source type.
Beauty: volume, weight, shade, ingredients/applicability when verified.

Missing values remain unknown.

## 10. Recommendations
Recommendations are not uncontrolled random filler.

There are three separate intents:
1. Similar Products
2. Pairs Well With
3. Discover Something Different

A product may appear in only one recommendation section per page render.
The currently viewed product may never appear in recommendations.

Recommendation candidates remain subject to safety, stock, destination, shipping, pricing, profit, image and Product Truth gates.

## 11. Taxonomy guard
Before rendering a product in a shelf:
- exact department must match
- exact shelf must match
- blocked/sensitive categories must be excluded
- canonical owner must be unique
- duplicate product keys must be removed

If taxonomy is ambiguous, HOLD the product instead of guessing.

## 12. Launch safety
Visual completeness never overrides Product Truth.

Production, Payment Live and Supplier Live Order remain independent release gates.
A product may look complete in Shadow and still remain non-sellable.

## 13. Regression checklist
Before storefront merge/deploy verify:
- no duplicate provider:item_id across visible shelves
- no aggregate child-shelf mixing
- Women isolated
- Men isolated
- Jewelry isolated and split to exact sub-shelves
- non-fashion departments preserved
- vertical product grids
- no page-wide horizontal product scrolling
- product options variant-correct
- verified sizes only
- cm/in conversion only from verified cm
- product attributes are category-appropriate
- Similar / Complementary / Discover are separate and deduplicated
- mobile 1-2 column product flow
- dark/light mode
- RTL/LTR does not alter taxonomy
- cart/checkout preview still works
- Production/Supplier Live/Payment state unchanged unless Owner approved

## 14. Change control
Aesthetic redesign is allowed.
The following require explicit Owner approval:
- taxonomy hierarchy changes
- canonical product ownership changes
- recommendation intent changes
- size conversion policy changes
- Production / Payment / Supplier Live activation

When in doubt, preserve this Constitution and HOLD the uncertain change.


## 15. Explicit no-mixing examples
- Socks belong only in Socks. Socks must never render inside generic Accessories.
- Earrings belong only in Earrings.
- Necklaces belong only in Necklaces.
- Bracelets belong only in Bracelets.
- Rings belong only in Rings.
- Hair clips/headbands/scrunchies belong only in Hair Accessories.
- Bags/backpacks/totes/crossbody bags belong only in Bags.
- Hats/caps/beanies belong only in Hats/Headwear.
- Watches belong only in Watches.
- Sunglasses belong only in Sunglasses.
- Shoes belong only in Shoes.
- Swimwear belongs only in Swimwear.
- Lighting, Kitchen, Tech, Home and other non-fashion identities must never be used as fashion filler.
- When exact identity conflicts with a generic Accessories label, exact identity wins and the generic placement is rejected.
