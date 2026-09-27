# HUNT original Cinematic candidate and exact category preview

## Source audit before implementation

The supplied `preview/hunt-current-2026-09-26/hunt-current-preview.html` is a status wrapper with two iframes. It is not a single integrated original Cinematic storefront. Its first iframe is `boom-hunt-full-shelves-shadow-v1.html`, which supplied product shelves, but mixed a legacy full-shelves Shadow file with the newer V2 supplement. It also assembled broad `women-clothing` and `men-clothing` rails from several canonical categories. The second iframe is `boom-hunt-cinematic-stylist-shadow-v1.html`, which contains the earliest Cinematic scene styling available on this branch: the dark/off-white light tokens, translucent stage, hero card, card depth, scene transition, and responsive layout. Its `sceneIn` fade and Stylist hero composition are the visual base here.

The motion and city ingredients were separate in repository history:

| Source | Role in this isolated preview |
| --- | --- |
| `boom-hunt-cinematic-stylist-shadow-v1.html` on `preview/hunt-current-2026-09-26` | Base CSS tokens, stage, hero, scene, cards, light/dark mode. Extracted to `hunt-cinematic-original-exact.css`; one literal escaped newline before its reduced-motion rule was normalized. |
| `hunt-brand-motion.css` and `hunt-brand-motion.js` on `feature/hunt-motion-lab-v1` (`0b5f6cc`) | Original HUNT signature: staggered letter descent, glass sweep, T spin, star/sparkles, face/smile and reduced-motion state. Copied to `hunt-original-brand-motion.*`; only sapphire/gold color accents are applied in the separate additive CSS. |
| `hunt-city-hero.css` and `hunt-city-hero.js` on `feature/hunt-cinematic-city-hero` (`9f7d4f6`) | City crossfade timing and slow zoom. Recreated on the original scene stage with four checked-in real city photos from `assets/hunt-city/real/` on the same branch. The original image attribution is copied in `assets/hunt-cinematic-original/SOURCES.json`. |
| `hunt-cinematic-category-flow-v17.*`, V18 branch | Excluded. No styles, layouts, category code, or assets were copied from either redesign. |

The exact previously approved integrated file cannot be established from the linked page alone. This preview combines the identified original Cinematic scene, city, and signature motion sources, and documents that provenance rather than claiming the wrapper was the original design.

## Taxonomy and safety behavior

- Only `evidence/HUNT-TAXONOMY-PROFIT-V2-PREVIEW-SUPPLEMENT-2026-09-27.json` is fetched. No `catalog-home.json`, full-shelves baseline, catalog shard, live API, or fallback is loaded.
- Each product is admitted only if `department/category` equals its dataset shelf key and a configured canonical route. Taxonomy must be V2 `REMAP`, inventory positive, availability verified, image technical status `PASS`, a HTTPS image present, a positive projected product contribution in `PROFIT_REVIEW`, and Production exposure false. Restricted identities and explicit holds are excluded; Gifts also excludes accessory identities. The source's V2 label is not treated as final semantic QA.
- The checked-in source declares 1,678 V2 Shadow entries across 102 shelf keys. The stricter preview admits 239 across 42 routes and excludes 1,439. `women/women-dresses` has zero V2 candidates. The visible Dresses shelf therefore says it is being filled.
- BOOM's local preview preference only reorders the already gated array for one exact route. It neither adds products nor changes canonical classification. No account personalization service is connected.
- Product cards have no checkout action or live price. All source entries are Profit REVIEW, and final net profit is unverified. Supplier live orders, Payment Live, and Production taxonomy publication stay off.
- This is a Shadow architecture preview. Semantic classification, exact variant, physical image quality, destination shipping, and final profit still need independent verification before any Production publish.

## Scope

The isolated branch adds new preview files and local city assets only. It does not edit the existing current preview, storefront entry point, checkout, supplier order path, Production taxonomy, or payment settings.
