# HUNT Free Tax Reserve Path — 2026-09-28

Mode: Shadow / Preview only
Payment Live: OFF
Supplier Live Order: OFF
Production Effect: OFF

## Decision
Stripe Tax is not required for current HUNT progress.
Until a free/approved transaction-level tax source is available, HUNT uses official-rate tax reserves for conservative profit screening only.

## Official reserve rules
- DE adult footwear: 19% VAT reserve — German Federal Ministry of Finance.
- GB adult footwear: 20% VAT reserve — GOV.UK. Children shoes can be zero-rated; rule is adult-footwear only.
- IL adult footwear: 18% VAT reserve — Israel Tax Authority, effective 2025-01-01.
- AE adult footwear: 5% VAT reserve — UAE Federal Tax Authority.
- US: HOLD — no country-level sales tax rate; address-level state/local tax and seller nexus are required.

## Truth semantics
RESERVE_ONLY:
- can be used for conservative pricing / margin screening
- tax_verified = false
- final_profit_eligible = false

HOLD:
- cannot produce a tax-aware profit result

No reserve rule may be converted to Final Profit Verified.

## Men -> Shoes verification
Fresh audit set:
- 3 curated route-locked EPROLO products
- 83 exact variants
- US / DE / GB / IL / AE
- stock verified: 83/83 per market
- shipping verified: 83/83 per market

At previous retail floors, 0/83 variants passed the active profit gates after conservative VAT reserve in DE/GB/IL/AE.
Therefore old floors are not safe under the reserve scenario.

Reserve-aware required retail floor ranges:
- AE: $17.99–$30.99
- DE: $16.99–$29.99
- GB: $15.99–$27.99
- IL: $25.99–$57.99
- US: HOLD

## Database implementation
Private table:
- private.hunt_tax_reserve_rules

Private functions:
- private.hunt_tax_reserve_preview(country,gross_amount)
- private.hunt_tax_reserve_required_floor(...)

Access:
- revoked from public / anon / authenticated
- SECURITY INVOKER
- no Production price writes

This path lets HUNT continue safely without paying for browser automation or Stripe Tax.
