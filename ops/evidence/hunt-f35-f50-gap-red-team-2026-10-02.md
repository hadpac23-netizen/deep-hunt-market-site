# HUNT F35/F50 Gap Red Team — 2026-10-02

## Scope

PR26 / `launch/hunt-candidate-2026-09-29-v1` only. This checkpoint does not authorize merge, Production deployment, live payment, live supplier ordering, or profit release.

## Safety gates — reverified

- Payment Live: OFF
- PayPlus paid callback acceptance: OFF
- Supplier Live Order: OFF
- Profit release: OFF
- Merge: NO
- Production deploy: NO
- Owner Gate required before any launch-state change

## F35 — immutable EPROLO Gap12 batch recovered

The prior gap scan reported 5 Kids Swimwear + 7 Kids Socks. The exact set has now been deterministically recovered and pinned in `hunt_shelf_candidates` as:

`EPROLO-GAP12-20261002-V1`

Every row carries the target bucket and pinned exact variant id. All remain `sellable=false` and `production_effect=false`.

### Kids Swimwear — 5

| item_id | exact variant | QA | reason |
|---|---|---|---|
| 29050385 | 681669511 | PASS | exact kids swimwear variant; size/color/stock verified |
| 26138848 | 649117322 | REJECT | exact variant color axis unclassified |
| 31703544 | 716676841 | PASS | exact kids swimwear variant; size/color/stock verified |
| 28549981 | 675963827 | REJECT | `NON_APPAREL_IN_KIDS_SWIMWEAR` — inflatable swimming ring/accessory |
| 32354540 | 727214143 | REJECT | baby-age taxonomy mismatch for Kids Swimwear |

### Kids Socks — 7

| item_id | exact variant | QA | reason |
|---|---|---|---|
| 28043918 | 669992175 | REJECT | size axis missing/unverified |
| 27414917 | 663177691 | PASS | child-targeted exact variant, one-size/color/stock verified |
| 30373286 | 697249347 | REJECT | children/women age-gender mix |
| 9178804 | 234570998 | REJECT | product contains adult variants as well as kids variants |
| 24502505 | 628903708 | REJECT | size axis missing/unverified |
| 32230445 | 725646403 | REJECT | product contains adult variants |
| 31280945 | 710877455 | REJECT | women/kids mix plus exact inventory only 1 |

### Gap12 closure counts

- immutable batch rows: **12**
- QA PASS: **3**
- QA REJECT: **9**
- sellable rows: **0**
- Production-effect rows: **0**
- `FINAL_PROFIT_VERIFIED`: **0**

Rejected rows were not deleted globally. They are rejected for the target shelf/batch with an explicit reason so they cannot contaminate Kids taxonomy while remaining available for future correct-shelf review where appropriate.

## Exact variant evidence

Live read-only exact-variant metadata was refreshed for the 11 semantically eligible products. The known non-apparel swim-ring false positive was stopped before Shipping Shadow.

Examples from PASS products:

- `29050385 / 681669511`: pink, XL (3–8 years), inventory 5,363, supplier cost $3.18, 180 g.
- `31703544 / 716676841`: light blue, 7Y, inventory 995, supplier cost $5.92, 230 g.
- `27414917 / 663177691`: ginger, one size 34–39, inventory 19,667, supplier cost $2.13, 100 g.

Physical quality remains `UNVERIFIED`; supplier metadata is not treated as sample/physical-quality proof.

## Shipping Shadow — only the three Gap12 QA PASS products

Destinations checked: **US, DE, GB, IL, AE**.

Result: **15/15 exact-variant market rows have stock verified + shipping verified**. All rows are stored in `private.hunt_variant_market_shadow_pricing`; all remain `sellable=false` and `production_effect=false`.

### Kids Socks `27414917 / 663177691`

Current target retail: **$6.99**.

| Market | Shipping USD | Shadow retail floor | Contribution | Margin | Result |
|---|---:|---:|---:|---:|---|
| US | 6.31 | 7.99 | 3.66 | 52.40% | PROFIT REVIEW |
| DE | 5.37 | 7.99 | 3.75 | 53.61% | PROFIT REVIEW |
| GB | 4.03 | 7.99 | 3.87 | 55.34% | PROFIT REVIEW |
| IL | 7.63 | 7.99 | 3.54 | 50.70% | PROFIT REVIEW |
| AE | 6.92 | 7.99 | 3.61 | 51.62% | PROFIT REVIEW |

The current $6.99 target retail is below the $7.99 shadow floor and contribution remains below the active $4/unit minimum even before verified destination tax. Status is therefore `PROFIT_REVIEW_TAX_UNVERIFIED`, not PASS.

### Kids Swimwear `29050385 / 681669511`

No verified target retail exists yet. Supplier cost is $3.18. Shipping verified:

- US $5.80
- DE $4.54
- GB $3.52
- IL $7.71
- AE $6.31

Current shadow retail floor: $8.99. Status: `SHIPPING_PASS_RETAIL_PENDING`.

### Kids Swimwear `31703544 / 716676841`

No verified target retail exists yet. Supplier cost is $5.92. Shipping verified:

- US $7.80
- DE $6.34
- GB $4.92
- IL $11.51
- AE $8.98

Shadow retail floor is $11.99 for US/DE/GB/AE and $12.99 for IL. Status: `SHIPPING_PASS_RETAIL_PENDING`.

### Profit truth

All 15 market rows have `DESTINATION_TAX_NOT_VERIFIED`. COO/customs classification truth also remains insufficient. Therefore:

- `FINAL_PROFIT_VERIFIED = 0`
- no public display
- no sellable promotion
- no Payment/Supplier gate changes

## Shadow Catalog status

The three Gap12 QA PASS products are retained as internal Shadow candidates only:

- `29050385`: HOLD — retail price + destination tax not verified.
- `31703544`: HOLD — retail price + destination tax not verified.
- `27414917`: HOLD — Kids Socks taxonomy Owner Gate + profit review/tax unresolved.

`Kids Socks` is not silently mixed into Women or Men socks. The approved storefront taxonomy remains the existing 50-shelf contract; a dedicated Kids Socks destination requires an explicit taxonomy decision.

## Kids Schoolwear targeted gap fill

A semantic audit of current EPROLO rows found multiple false positives already carrying `kids-schoolwear`. These were marked target-shelf REJECT / public-display false:

- `30986502` watercolor/art kit — non-apparel art supplies.
- `27766785` microscope/science device — non-apparel.
- `20655020` pencil case — stationery/accessory, not schoolwear apparel.
- `25223891` parachute/gym equipment — sports equipment.
- `31727897` painting pens/art supplies — non-apparel.

Two real apparel candidates were found and pinned as `EPROLO-SCHOOLWEAR2-20261002-V1`:

1. `32884413 / 733879698` — Boys Preppy Style School Uniform Casual Two-Piece Suit Set for Kids.
   - variants: 90–150 cm
   - exact variant: Navy Blue / 90 cm
   - exact inventory: 599
   - supplier cost: $14.78
   - image technical: PASS
   - Market5 evidence: present

2. `31955589 / 719657797` — Long Sleeve Shirt with Tie, Children's School Uniform.
   - variants: 90–130 cm across two color/body options
   - exact variant: Light blue and white body / 90 cm
   - exact inventory: 190
   - supplier cost: $5.59
   - image technical: PASS
   - Market5 evidence: present

Both passed semantic/exact-variant gap-fill QA and then passed Shipping Shadow to US/DE/GB/IL/AE: **10/10 stock + shipping verified**.

Neither has a verified target retail yet; both remain `SHIPPING_PASS_RETAIL_PENDING`, destination tax is unverified, and `FINAL_PROFIT_VERIFIED` remains false.

Notable shipping economics:

- `31955589`: IL shipping $12.35; shadow floor $11.99.
- `32884413`: IL shipping $27.61; shadow floor $24.99.

The two-piece uniform is therefore especially expensive to ship to Israel and must not be promoted merely because taxonomy/stock are correct.

## Men Loungewear targeted sourcing

Current EPROLO candidate DB still contains **0 clean Men Loungewear candidates**. Broad keyword hits were rejected because they were Women products, footwear, costumes, or other taxonomy mismatches.

CJ Shadow searches were attempted without persisting products:

- `men pajama set`: 0 results
- `men home wear`: 0 results
- another search hit CJ availability/rate-limit errors (`503` / `429`)

The EPROLO broad read-only catalog scan also failed closed with `catalog_read_failed`: the upstream HTTP response was 200 but did not satisfy the integration contract (`code=0` plus array data), so no catalog rows were persisted.

**Truthful status: Men/Loungewear remains 0 verified. Do not substitute Women items, slippers, robes used as fashion dresses, or ambiguous products.**

## F50 — launch blockers still open

1. Supplier freshness automation is not yet proven live end-to-end; stale data must fail closed.
2. EPROLO `FINAL_PROFIT_VERIFIED` remains 0 because destination tax/customs truth is not verified.
3. CJ authenticated sandbox fulfillment has no proven tracking -> shipped end-to-end path.
4. PayPlus sandbox signed callback/status/idempotent paid-transition proof remains open.
5. Official EPROLO Create Order / Order Query / Tracking contract remains open.
6. Legal/business identity and customer-policy review remain open.
7. Branch-protection / required-check verification remains unproven to the current integration.
8. EPROLO public display remains quarantined until runtime/evidence gates are ready.

## Competitive benchmark gaps to evaluate

These are capability comparisons, not automatic launch requirements.

- NEXT: Schoolwear is a full department experience with Boys/Girls, shirts, polos, trousers, dresses, shoes, bags/accessories, coats/jackets, PE kit, socks/tights, fit/size guidance and practical schoolwear filters.
- H&M: Men's Nightwear & Loungewear is a distinct assortment with pyjamas, trousers, shorts, sets and robes plus size/fit/product-type filters.
- ASOS: stronger apparel decision support through size guides, international conversions, model sizing, fit details, fit-oriented reviews and personalised fit assistance.
- Zara: favourites, restock notifications, low-stock messaging and stock-aware cart handling.
- Temu: prominent delivery guarantee, returns/refunds flows and price-adjustment proposition.

## Required next execution order

1. Keep the 3 Gap12 PASS products in Shadow HOLD until pricing/tax/taxonomy gates close.
2. Keep the 2 verified Schoolwear apparel candidates in Shadow HOLD until retail + profit truth is established.
3. Add a permanent Schoolwear semantic guard before EPROLO public display can ever be enabled, so non-apparel school-related products cannot repopulate the shelf.
4. Resume Men Loungewear source discovery only through supplier read-only channels after upstream rate-limit/catalog availability recovers; do not lower semantic/variant/shipping standards.
5. Continue F50 launch-blocker closure.
6. Keep Payment Live OFF, Supplier Live Order OFF, Profit Release OFF, no Merge/Production without Owner Gate.
