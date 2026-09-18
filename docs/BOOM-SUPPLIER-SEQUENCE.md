# BOOM Supplier Sequence

## Tier 0 — HUNT primary orchestration lane
1. HyperSKU — official Open API/custom-store integration path; product/source/stock/shipping/order/tracking mapping first. Keep fulfillment OFF until live quote, country eligibility, economics and owner gates pass.
2. CJdropshipping — existing major connected source; preserve current quote/stock/shipping checks.
3. EPROLO — additional official supplier lane behind the same supplier abstraction.

HyperSKU must never be assumed globally available. Country/warehouse/SKU shipping eligibility is verified live through Shipping Chess before ranking or checkout.

## Tier 1 — act after owner approval
1. Prodigi — free API key + Sandbox; catalog-only integration first.
2. Gelato — official Product API; catalog/pricing/country support.
3. Printify — official catalog/blueprint/provider/variant API.
4. BrandsGateway — authenticated luxury catalog; paid plan/API economics must pass first.
5. Mytheresa — free affiliate application via CJ/Rakuten; daily product feeds if approved.
6. Sephora — free affiliate application via Rakuten; 200+ brands / 13K+ products per official program page if approved.
7. FragranceX — wholesale/reseller review; authentic fragrance lane only after account/feed approval.

## Tier 2
BigBuy, Syncee, approved jewelry/accessories feeds, additional retailer affiliates.

## Decision gate per supplier
PASS only if:
- official/authorized source
- catalog/feed/API terms support HUNT
- safe-product filtering possible
- price/availability source is clear
- shipping/returns can be documented
- economics pass
- no fake brand affiliation
