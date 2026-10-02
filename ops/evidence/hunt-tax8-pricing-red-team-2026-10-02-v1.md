# HUNT TAX8 Pricing Red Team — 2026-10-02 v1

## Scope

Shadow-only market-pricing review for the eight EPROLO products currently carrying open `DESTINATION_TAX_NOT_VERIFIED` exceptions across AE/DE/GB/IL/US.

This evidence does not change customer retail, sellability, Production state, payment state, supplier ordering, tax truth, or final-profit truth.

## Live blocker shape

- 40 open `DESTINATION_TAX_NOT_VERIFIED` exceptions = 8 products × 5 destinations.
- 1 open `FINAL_PROFIT_NOT_VERIFIED` variant exception for item `12515068` / IL.
- All eight products currently have no verified COO, HS code, customs code, material, composition, or ship-from country in the canonical shelf-candidate payload.
- Existing reserve rules for AE/DE/GB/IL are `RESERVE_ONLY` and `production_effect=false`.
- US remains `HOLD` because address-level state/local tax and seller nexus are required.

## Pricing finding

The historical `profit_gate_v2.target_retail_usd` is stale for all eight products. Current exact-variant shipping + reserve floors are materially higher than the old target retail.

Therefore destination-tax work must not be treated as the only remaining profit blocker. Pricing truth must be revalidated before any attempt to mark final profit verified.

## Candidate matrix

| Item | Product | Old retail | GB floor | DE floor | AE floor | IL floor | US | Shadow market decision |
|---|---|---:|---:|---:|---:|---:|---|---|
| 12515068 | Flying woven air-cushion men's shoes | $13.99 | $26.99 | $29.99 | $29.99 | $50.99 | HOLD | GB `MARKET_PRICE_CANDIDATE`; DE/AE `REVIEW`; IL `HOLD`; US `HOLD` |
| 31998888 | EVA slip-on couple sandals | $7.99 | $15.99 | $16.99 | $17.99 | $25.99 | HOLD | GB/DE `REVIEW`; AE/IL `HOLD`; US `HOLD` |
| 31411072 | Air-cushion dad sneakers | $11.99 | $27.99 | $29.99 | $30.99 | $57.99 | HOLD | GB/DE/AE `REVIEW`; IL `HOLD`; US `HOLD` |
| 29949926 | Stand-collar denim jacket | $29.99 | $44.99 | $45.99 | $45.99 | $68.99 | HOLD | GB/DE/AE `REVIEW`; IL `HOLD`; US `HOLD` |
| 32590502 | Premium minimalist lapel jacket | $29.99 | $53.99 | $54.99 | $55.99 | $102.99 | HOLD | GB/DE/AE `REVIEW`; IL `HOLD`; US `HOLD` |
| 32590510 | Vintage Maillard loose jacket | $36.99 | $61.99 | $61.99 | $62.99 | $113.99 | HOLD | GB/DE/AE `REVIEW`; IL `HOLD`; US `HOLD` |
| 32677402 | Vintage oil-waxed biker jacket | $32.99 | $53.99 | $54.99 | $54.99 | $94.99 | HOLD | GB/DE/AE `REVIEW`; IL `HOLD`; US `HOLD` |
| 32679860 | Star velvet PU baseball jacket | $36.99 | $60.99 | $60.99 | $60.99 | $108.99 | HOLD | GB/DE/AE `REVIEW`; IL `HOLD`; US `HOLD` |

## Market evidence

### 12515068 — strongest pricing candidate

A recently crawled independent storefront listing carries the exact long product title and variants at **$27.99**.

That is close to the HUNT current reserve floors:
- GB $26.99
- DE $29.99
- AE $29.99

Additional current comparable market evidence places flying-woven / air-cushion men's shoes around the same broad range. This supports keeping GB as `MARKET_PRICE_CANDIDATE`, while DE/AE remain review rather than automatic PASS.

IL at $50.99 is not market-validated and remains HOLD. US remains HOLD for address-level tax/nexus.

### 31998888 — EVA sandals

Comparable current consumer listings:
- TikTok Shop US-style comparable EVA/couple slides: approximately $14.13–$23.00.
- SHEIN IL comparable EVA/couple slippers: approximately ₪17.26–₪28.08 for several low-cost current listings.
- Noon UAE comparable EVA sandals/slippers: approximately AED 10–26 in multiple current listings.

HUNT floors:
- GB $15.99
- DE $16.99
- AE $17.99 = about AED 66.07 at the 2026-10-02 FX rate
- IL $25.99 = about ₪79.33 at the 2026-10-02 FX rate

Conclusion: GB/DE can remain REVIEW pending local-market confirmation, while AE and IL should stay MARKET HOLD because HUNT's required price is materially above the sampled comparable market.

### 31411072 — air-cushion dad sneakers

Current SHEIN IL comparable men's air-cushion / shock-absorbing dad sneakers were observed around:
- ₪85.90 ≈ $28.14
- ₪98.60 ≈ $32.30

HUNT floors:
- GB $27.99
- DE $29.99
- AE $30.99
- IL $57.99 ≈ ₪177.01

Conclusion: GB/DE/AE floors are within the observed broad comparable range and stay REVIEW; IL is materially above the sampled local comparable market and remains HOLD.

### Jacket group

Current broad PU/leather-jacket retail evidence shows many comparable products around the ~$30–60 band, with some higher-priced listings. This means HUNT's non-IL floors of roughly $45–63 are not automatically impossible, but they are upper-market and require product-specific validation before a retail target is approved.

Current SHEIN IL samples for comparable men's PU jackets included approximately:
- ₪46.04
- ₪59.00
- ₪69.00
- ₪77.31
- ₪89–119
- up to ₪159 for some biker styles

Current denim stand-collar / men's denim samples included roughly ₪99–159 for several comparable styles.

HUNT IL jacket floors range from:
- $68.99 ≈ ₪210.58
- $94.99 ≈ ₪289.94
- up to $113.99 ≈ ₪347.94

Conclusion: all five jacket products stay IL `MARKET_HOLD`. Non-IL GB/DE/AE remain `REVIEW` until closer product-specific pricing proof exists.

## Product-detail / material evidence

Official EPROLO public product pages supplied useful material descriptions for some jacket items, but did **not** establish COO:
- `32590502`: lining material Polyester.
- `32677402`: official product description reports main fabric composition Polyester Fiber despite the product title using “Leather”. This is direct evidence that title-based customs/material inference is unsafe.
- `32679860`: official product page reports Fabric Name: PU.

No COO was verified from these public pages.

## Tax / Zonos sequencing

Do not resolve any tax exception yet.

Correct order:
1. Approve destination-aware customer retail / market enablement.
2. Obtain verified COO for the exact products/variants from an official supplier source.
3. Use Zonos Landed Cost Shadow. Zonos can classify HS from item description/category/material when HS is absent, but guaranteed GraphQL landed-cost workflows still require `countryOfOrigin`.
4. Recompute destination economics using verified tax/duty evidence.
5. Resolve tax/final-profit exceptions only when the evidence actually passes.

## Current recommendation

Prioritize further closure work in this order:
1. `12515068` — strongest candidate; exact $27.99 market evidence is close to GB/DE/AE floors.
2. `31411072` — non-IL floors align broad comparable sneaker pricing; IL remains HOLD.
3. `31998888` — GB/DE need local confirmation; AE/IL remain HOLD due clear price mismatch.
4. Jackets — obtain closer market evidence before spending COO/Zonos effort; IL remains HOLD for all five.

## Safety state

- `final_profit_verified` stays false.
- Tax exceptions stay open.
- No customer retail is changed by this evidence.
- No sellable/public/Production effect.
- Payment Live OFF.
- Supplier Live Order OFF.
- Profit Release OFF.
- PayPlus Paid callback OFF.
- No Merge / no Production without Owner Gate.
