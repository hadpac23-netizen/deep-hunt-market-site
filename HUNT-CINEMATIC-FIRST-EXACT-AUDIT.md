# HUNT Cinematic first visual and exact shelf audit · 2026-09-27

## The visual candidate

The URL supplied by the owner points to `hunt-current-preview.html` on `preview/hunt-current-2026-09-26` (`7987eb5`). Its default, first tab is **Full Shelves · Cinematic** and loads `boom-hunt-full-shelves-shadow-v1.html`. The second tab loads `boom-hunt-cinematic-stylist-shadow-v1.html`. The mistaken earlier isolated preview used the second tab and added city photographs from `feature/hunt-cinematic-city-hero`. That composite is not the first, default visual the owner linked.

| Original source | Exact element preserved here |
| --- | --- |
| `boom-hunt-full-shelves-shadow-v1.html`, first/default iframe of linked candidate, introduced by `db820a6` | Its entire inline CSS forms the prefix of `hunt-cinematic-first-exact.css`: deep navy and off-white themes, sapphire/gold tokens, Georgia display type, stage and product hero, off-white product media, translucent cards, scroll rails, responsive layout. Additions after the prefix implement selected category states and the exact flow. |
| `evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json` | **Category order and labels only**, extracted into `hunt-cinematic-first-categories.json` and the static taxonomy module. No products from it are loaded by the new preview. Broad aggregate `women-clothing` and `men-clothing` rails are deliberately absent. |
| `hunt-brand-motion.css` / `hunt-brand-motion.js`, `e66dd80` and `feature/hunt-motion-lab-v1` (`0b5f6cc`) | Byte-identical copies as `hunt-cinematic-first-brand-motion.*`: H→U→N→T descent, glass sweep, T rotation, star and sparkles, smile/wink, idle accent and reduced-motion behavior. |
| `hunt-current-preview.html`, `7987eb5` | Its dark preview and Shadow mode context. The new page is a separate file and branch, not a modification of the current wrapper. |

The repository does not establish which earlier integrated storefront file was verbally approved. The linked candidate establishes this default visual precisely. No V17/V18 assets, layouts or category code and no photographic city hero enter this version. Depth comes from the original navy/sapphire gradients, glass panels, product media, stage and restrained transitions.

## Product populations and ordering

These numbers refer to different populations and are not interchangeable:

| Population | Observed count | Role |
| --- | ---: | --- |
| Overall HUNT catalog | Over 30,000, as reported by the owner | Not replaced or edited by this preview. A single authoritative all-catalog count was not available in the inspected Shadow table. |
| `public.hunt_shelf_candidates` read-only query on 2026-09-27 | 26,349 distinct candidates | Shadow candidate table subset; 26,347 are `sellable=false` and `production_effect=false`. |
| Live Taxonomy Gate V2 `REMAP` in that table | 9,395 | Taxonomy status, not display authorization. The linked wrapper's earlier snapshot states 9,373. |
| Live V2 `REMAP` plus Profit `PROFIT_REVIEW` | 8,128 | Profit still unverified. |
| Live V2 rows meeting safety, technical image, inventory, Market5, status and projected contribution checks | 269 | Read-only database audit across 43 routes; the product rows are not exported in the published preview. |
| Checked-in V2 preview supplement | 1,678 rows across 102 route keys | Earlier curated Shadow export. Kept first in its existing within-shelf order. |
| Exact preview after dedupe and additional semantic route checks | 163 products across 33 exact routes | The checked-in V2 supplement retains its within-shelf order. 1,515 input occurrences were not admitted, including repeated titles. |
| Earlier Full Shelves Shadow dataset | 5,854 unique routed candidates, 133 rails | Preserved in the repository, but has no V2 marker on its product rows and is not a preview product source. |

The earlier Full Shelves builder sorted products by Product Truth, preview score, curation/selection score, image count and then title. The new exact preview preserves the reviewed V2 supplement's sequence within each route. BOOM can reorder only the already admitted items of the same exact route. The owner's earlier shelf work and the larger catalog are not deleted, but cannot silently bypass V2, image, inventory, safety and Profit checks to fill this preview.

Women → Dresses has **zero** V2 `REMAP` records in the inspected live candidate table and zero accepted preview products. It is explicitly marked as being filled. Gifts → Party also has zero after semantic checks: two V2 source rows are costumes, not party supplies. Accessories stay in their own department; only a separately labeled optional related-world link can point to Accessories from Gifts.

## Exact flow and boundaries

Department → only that department's category buttons → exact shelf → gated products → more from the same shelf → other shelves from the same department → BOOM order of the same shelf → separately labeled optional worlds. The visual hero is drawn only from the selected department, and from the selected exact route once one is open. Empty shelves show no borrowed cards.

The browser fetches only the already checked-in V2 supplement. `catalog-home.json`, the older Full Shelves product JSON and the read-only database rows are not fetched. Safety and semantic title holds, positive verified stock, image technical PASS with HTTPS, Market5 readiness, Shadow mode and projected positive Profit REVIEW are checked again by the client before display. This is QA, not a final physical image, destination shipping, variant, or final net-profit approval.

Payment Live, Supplier Live Order and Production taxonomy publication remain OFF. No checkout or supplier order action is present. Existing current preview, main storefront and Production settings are untouched.

## Continuation repair · semantic gate and canonical route alignment

A structural preview bug was found in the exact-shelf semantic gate: the static UI defines 141 configured routes, while only 33 routes had explicit `identityPolicies`. The previous `titleFitsRoute()` implementation returned `false` whenever a route lacked a manual policy, so otherwise-gated Taxonomy V2 products could be rejected solely because the preview had no hand-written regex for that shelf.

The isolated preview branch now keeps the explicit policies for known-risk routes, and adds a conservative fallback for uncovered configured routes. The fallback derives normalized semantic terms only from the configured category/shelf label and slug, then requires the product title to match at least one meaningful shelf term. Cross-department identity remains blocked by the existing exact `department/category === route` check, and all existing V2, stock, image, Market5, Shadow and projected-contribution gates remain mandatory. This is not an allow-all fallback.

A second taxonomy drift was confirmed from the live read-only Taxonomy Gate V2 data: Camping Kitchen is canonicalized as `camping/camp-cooking`, while the isolated UI still used `camping/camping-cook`. The isolated taxonomy and category reference now use `camping/camp-cooking` while preserving the visible label **Camping Kitchen**.

The live V2 data also contains `kids/tableware`. The original approved category reference does not currently contain a Kids/Baby tableware UI category, so this route remains intentionally undisplayed rather than being renamed, borrowed, or injected into another shelf. It requires an explicit taxonomy/UI reconciliation before display.

No new live product rows were exported to the repository during this repair. Payment Live, Supplier Live Order and Production taxonomy publication remain OFF, and Production storefront files were not modified.
