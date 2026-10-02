# TAX8 / Final Profit Red Team — 2026-10-02

Status: BLOCKED — EXTERNAL_BLOCKED for actual origin/material/classification/landed-cost/market-price proof. Branch guard remediation tested; no runtime closure or commerce activation.

FOUND: both old shadow guards converted null duty into zero and trusted verified booleans without fresh exact destination/currency/shipping/price evidence. Product audit also used its own proposed floor as the sale price and could resolve a product tax exception when only some variants passed. Batch SQL omitted source_payload required to read customs proof.
IMPACT: false final_profit_verified or false exception resolution after future evidence ingestion.
FIX: shared strict numeric parser; exact provider/item/variant/destination/USD binding; official source reference and nonfuture verification time; landed and retail proof expiry and maximum 60-minute age; HS classification verified; exact quantity/retail/shipping/service match; approved market retail and actual customer shipping charged; complete unique variant coverage; batch reads source_payload. All sellable/production_effect flags remain false.
TEST: 43 executable adversarial tests, including three actual product-handler runs with synthetic DB/provider fixtures. Wrong origin/variant/destination/currency/price/quantity/service; expired/stale/future evidence; absent/null/blank/boolean tax; inferred origin; market HOLD; stale retail; invalid stock; partial persistence and incomplete/duplicate variants all fail safely. Genuine verified zero tax remains allowed. Synthetic fixtures are not customs/provider evidence.
STATUS: PARTIAL at overall phase; branch code behavior PASS, supplier/runtime proof BLOCKED.

The matrix below was newly queried at 2026-10-02T18:41:07Z, but shipping/cost/stock observations date to 2026-09-28. They are historical input, not fresh supplier quotes or approved checkout prices. No price was raised or activated. All 40 item-market decisions remain HOLD for launch until exact official proof and current market review exist. Required floor is an internal proposal and cannot establish retail truth.

| Item | Variant | Market | Shipping USD, historical | COO | Material | Customs | Retail USD, historical | Final Profit |
|---|---|---|---:|---|---|---|---:|---|
| 12515068 | 380994254 | AE | 12.17 | UNVERIFIED | UNVERIFIED | BLOCKED | 13.99 | BLOCKED |
| 12515068 | 380994254 | DE | 8.76 | UNVERIFIED | UNVERIFIED | BLOCKED | 13.99 | BLOCKED |
| 12515068 | 380994254 | GB | 7.05 | UNVERIFIED | UNVERIFIED | BLOCKED | 13.99 | BLOCKED |
| 12515068 | 380994254 | IL | 20.83 | UNVERIFIED | UNVERIFIED | BLOCKED | 13.99 | BLOCKED |
| 12515068 | 380994254 | US | 10.20 | UNVERIFIED | UNVERIFIED | BLOCKED | 13.99 | BLOCKED |
| 29949926 | 692178850 | AE | 13.42 | UNVERIFIED | UNVERIFIED | BLOCKED | 29.99 | BLOCKED |
| 29949926 | 692178850 | DE | 8.65 | UNVERIFIED | UNVERIFIED | BLOCKED | 29.99 | BLOCKED |
| 29949926 | 692178850 | GB | 7.63 | UNVERIFIED | UNVERIFIED | BLOCKED | 29.99 | BLOCKED |
| 29949926 | 692178850 | IL | 21.90 | UNVERIFIED | UNVERIFIED | BLOCKED | 29.99 | BLOCKED |
| 29949926 | 692178850 | US | 11.46 | UNVERIFIED | UNVERIFIED | BLOCKED | 29.99 | BLOCKED |
| 31411072 | 712348555 | AE | 13.56 | UNVERIFIED | UNVERIFIED | BLOCKED | 11.99 | BLOCKED |
| 31411072 | 712348555 | DE | 10.04 | UNVERIFIED | UNVERIFIED | BLOCKED | 11.99 | BLOCKED |
| 31411072 | 712348555 | GB | 8.70 | UNVERIFIED | UNVERIFIED | BLOCKED | 11.99 | BLOCKED |
| 31411072 | 712348555 | IL | 25.78 | UNVERIFIED | UNVERIFIED | BLOCKED | 11.99 | BLOCKED |
| 31411072 | 712348555 | US | 12.05 | UNVERIFIED | UNVERIFIED | BLOCKED | 11.99 | BLOCKED |
| 31998888 | 720490497 | AE | 8.40 | UNVERIFIED | UNVERIFIED | BLOCKED | 7.99 | BLOCKED |
| 31998888 | 720490497 | DE | 5.72 | UNVERIFIED | UNVERIFIED | BLOCKED | 7.99 | BLOCKED |
| 31998888 | 720490497 | GB | 4.75 | UNVERIFIED | UNVERIFIED | BLOCKED | 7.99 | BLOCKED |
| 31998888 | 720490497 | IL | 11.69 | UNVERIFIED | UNVERIFIED | BLOCKED | 7.99 | BLOCKED |
| 31998888 | 720490497 | US | 7.29 | UNVERIFIED | UNVERIFIED | BLOCKED | 7.99 | BLOCKED |
| 32590502 | 730135994 | AE | 20.04 | UNVERIFIED | UNVERIFIED | BLOCKED | 29.99 | BLOCKED |
| 32590502 | 730135994 | DE | 13.19 | UNVERIFIED | UNVERIFIED | BLOCKED | 29.99 | BLOCKED |
| 32590502 | 730135994 | GB | 12.42 | UNVERIFIED | UNVERIFIED | BLOCKED | 29.99 | BLOCKED |
| 32590502 | 730135994 | IL | 40.25 | UNVERIFIED | UNVERIFIED | BLOCKED | 29.99 | BLOCKED |
| 32590502 | 730135994 | US | 18.82 | UNVERIFIED | UNVERIFIED | BLOCKED | 29.99 | BLOCKED |
| 32590510 | 730136099 | AE | 21.03 | UNVERIFIED | UNVERIFIED | BLOCKED | 36.99 | BLOCKED |
| 32590510 | 730136099 | DE | 13.87 | UNVERIFIED | UNVERIFIED | BLOCKED | 36.99 | BLOCKED |
| 32590510 | 730136099 | GB | 13.14 | UNVERIFIED | UNVERIFIED | BLOCKED | 36.99 | BLOCKED |
| 32590510 | 730136099 | IL | 43.06 | UNVERIFIED | UNVERIFIED | BLOCKED | 36.99 | BLOCKED |
| 32590510 | 730136099 | US | 20.14 | UNVERIFIED | UNVERIFIED | BLOCKED | 36.99 | BLOCKED |
| 32677402 | 731096132 | AE | 18.07 | UNVERIFIED | UNVERIFIED | BLOCKED | 32.99 | BLOCKED |
| 32677402 | 731096132 | DE | 11.83 | UNVERIFIED | UNVERIFIED | BLOCKED | 32.99 | BLOCKED |
| 32677402 | 731096132 | GB | 10.97 | UNVERIFIED | UNVERIFIED | BLOCKED | 32.99 | BLOCKED |
| 32677402 | 731096132 | IL | 34.63 | UNVERIFIED | UNVERIFIED | BLOCKED | 32.99 | BLOCKED |
| 32677402 | 731096132 | US | 16.19 | UNVERIFIED | UNVERIFIED | BLOCKED | 32.99 | BLOCKED |
| 32679860 | 731126606 | AE | 20.04 | UNVERIFIED | UNVERIFIED | BLOCKED | 36.99 | BLOCKED |
| 32679860 | 731126606 | DE | 13.19 | UNVERIFIED | UNVERIFIED | BLOCKED | 36.99 | BLOCKED |
| 32679860 | 731126606 | GB | 12.42 | UNVERIFIED | UNVERIFIED | BLOCKED | 36.99 | BLOCKED |
| 32679860 | 731126606 | IL | 40.25 | UNVERIFIED | UNVERIFIED | BLOCKED | 36.99 | BLOCKED |
| 32679860 | 731126606 | US | 18.82 | UNVERIFIED | UNVERIFIED | BLOCKED | 36.99 | BLOCKED |

Exact next action: obtain EPROLO official API/support attestation keyed to the eight exact item/variant pairs, including manufacturing country and material percentages. Recheck current cost, stock and shipping for the five existing TAX8 destinations only. Obtain official landed-cost/customs evidence with verified classification, quote reference, amount/currency/quantity, origin, shipping service and expiry. Record independent market-price review; uncompetitive destinations stay MARKET_HOLD. No supplier country/title/category inference.

Draft request, not sent: Please supply official manufacturing-origin and material-composition evidence for the eight item/variant pairs in this matrix, together with confirmation that each variant ID is Product-Detail/order-compatible. Include the source/date and exact product linkage; listing-country and inferred origin do not qualify. Please identify any material/size/color-specific differences and supply the official customs classification evidence where available.

Official reference consulted: https://zonos.com/docs/global-ecommerce/landed-cost and https://zonos.com/docs/global-ecommerce/classify/country-of-origin. Exact source URLs retrieved in this run are retained in the research notes; inferred/predicted COO is not accepted as supplier verification.
