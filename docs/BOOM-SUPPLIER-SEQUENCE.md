# BOOM Supplier Sequence

## Tier A — HUNT merchant / onsite-first targets
1. ORPE / BRASTY — perfume + beauty first. API/feed, stock/price/order sync, white-label. Status: NOT CONNECTED; credentials/onboarding required.
2. BrandsGateway — luxury/designer fashion. Custom REST API, stock sync, automated orders/fulfillment. Status: NOT CONNECTED; plan/API economics must pass.
3. Brandsdistribution / BDroppy — broad branded fashion. API/data exports and dropshipping lane. Status: NOT CONNECTED.
4. PerfumesWholesale.eu — fragrance/beauty backup lane with REST catalog/stock/price/order capability. Status: NOT CONNECTED.
5. Doba — general US catalog/order/tracking API target. Status: NOT CONNECTED.
6. CJdropshipping — catalog already appears in HUNT snapshots; order/credential path must still be verified before calling it transaction-ready.

## Tier B — additional manufacturing / general supply
Prodigi, Gelato, Printify, BigBuy, Syncee and other approved feeds after Tier A coverage is stable.

## Intelligence / affiliate-only lane
Amazon Creators, Awin, CJ Affiliate, impact.com and similar feeds may support discovery, price intelligence and affiliate monetization, but do not count as HUNT onsite checkout unless their specific approved integration supports it.

## Decision gate per supplier
PASS only if:
- official/authorized source and terms fit HUNT
- safe-product filtering is possible
- current price and stock source is clear
- shipping and returns can be documented
- brand/authenticity evidence is sufficient
- economics pass
- credentials are stored server-side
- no fake brand affiliation or fake connection state
- owner approves any paid onboarding or subscription
