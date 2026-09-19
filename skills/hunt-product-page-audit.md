# HUNT Product Page Deep Audit Skill

## Mission
Treat the PDP as a decision system. Prove that users can visually inspect the product, understand what is known, choose a valid variant, evaluate risk, and continue to cart without being misled.

## Audit lanes

### Product identity
- title
- provider/source
- category breadcrumb
- canonical product/variant identity

### Gallery
- main image
- thumbnails
- hidden-image signposting
- image count
- zoom
- next/previous
- keyboard navigation
- focus behavior
- mobile reachability
- broken image fallback

### Variants
- color
- size/option
- exact variant recomputation
- unavailable combinations
- per-variant stock
- size/fit guide when relevant
- device/model compatibility when relevant

### Decision truth
- verified retail price
- Profit Gate state
- quote state
- availability evidence
- shipping recheck boundary
- return-policy boundary
- unknown-data behavior

### Details
- description
- category-specific specifications
- material/dimensions/model where available
- source vs HUNT-derived wording
- manuals/care instructions when supplied

### Social proof
- review count
- rating average
- rating distribution
- review sort/filter
- negative-review discovery
- photos
- moderation
- verified-purchase evidence only when real
- helpfulness when implemented

### Shopper actions
- Like
- Save
- Share
- quantity
- Add to Cart
- mobile sticky Add
- exact variant preserved into cart

### BOOM
- Product Truth Q&A
- compatibility boundary
- why-this explanation
- Deal Builder relevance
- no fake bundle discount

### Rich media
- video source provenance
- controls
- captions/transcript evidence
- 360-view if supported
- media failure fallback

### Cross-navigation
- related products
- endless discovery
- recently viewed
- browse continuity
- no category/gender leakage

## PDP definition of done
A PDP may pass only when:
- every commercial claim is evidence-backed;
- exact product/variant identity survives to cart;
- unknown stock/shipping/compatibility is not guessed;
- gallery and controls work on keyboard and mobile;
- error/fallback states are explicit;
- user can find shipping/returns information;
- no severe console/runtime error exists.
