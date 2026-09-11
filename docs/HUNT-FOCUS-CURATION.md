# HUNT Focus Curation

Purpose: replace fuzzy weak-shelf matching with high-precision curated catalog layers built only from existing authorized catalog snapshots.

## Layers
- catalog-fashion/: fashion, gender, fit, basics, sleep, sets and kids apparel.
- catalog-focus/: Beauty, Tech, Gaming, Travel, Sports, Bedding, Hats, Socks and other weak categories.
- Broad catalog shards remain the fallback only when no curated shelf has enough real products.

## Truth rules
- Product must have provider, stable item id, HTTPS image and positive source price.
- Block unsafe/restricted items, sexualized titles, body-ideal products, supplier-logistics noise and unverified luxury-brand inventory.
- Curated items carry curation_source so category pages do not reclassify them with fuzzy inference.
- Exact duplicate titles are removed from Focus curation.
- Perfume remains approval-gated until an authenticated/authorized source is available.

## Current curated coverage
Fashion highlights: Women 463, Men 110, Kids apparel 16, Shoes 110, Sets 23.
Focus highlights: Beauty 10, Tech 33, Travel 21, Gaming 8, Sports 6, Bedding 5, Hats 17, Socks 23.

Remaining priority gaps require live supplier depth rather than broader fuzzy matching: perfume, kids basics, petite, maternity, sleepwear, loungewear, men basics and suits.
