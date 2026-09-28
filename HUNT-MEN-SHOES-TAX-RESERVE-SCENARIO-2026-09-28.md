# HUNT Men Shoes — Tax Reserve Scenario — 2026-09-28

Shadow / Preview only.
This is a conservative reserve scenario, NOT final tax truth.
Production Effect: OFF
Sellable: OFF
Payment Live: OFF
Supplier Live Order: OFF

Active profit profile:
- payment reserve: 4%
- refund reserve: 5%
- platform variable: 0%
- platform fixed: $0
- minimum contribution: $4/unit
- minimum margin: 20%

Current official standard-rate references used for reserve modeling:
- DE: 19%
- GB: 20%
- IL: 18%
- AE: 5%
- US: no country-level reserve; address-level state/local tax + nexus determination required

Reserve method:
- Customer price assumed tax-inclusive for scenario modeling.
- Tax reserve = gross sale * rate / (1 + rate).
- New floor solves both:
  1. contribution >= $4
  2. contribution margin >= 20%
- These floors remain RESERVE_ONLY until a transaction-level tax source verifies the tax obligation.

## 12515068
- DE: reserve floor $29.99 | tax reserve ~$4.79 | contribution ~$6.20 | margin ~20.68%
- GB: reserve floor $26.99 | tax reserve ~$4.50 | contribution ~$5.47 | margin ~20.28%
- IL: reserve floor $50.99 | tax reserve ~$7.78 | contribution ~$10.25 | margin ~20.11%
- AE: reserve floor $29.99 | tax reserve ~$1.43 | contribution ~$6.15 | margin ~20.52%
- US: HOLD — address-level tax engine required

## 31998888
- DE: reserve floor $16.99 | tax reserve ~$2.71 | contribution ~$4.27 | margin ~25.12%
- GB: reserve floor $15.99 | tax reserve ~$2.67 | contribution ~$4.38 | margin ~27.37%
- IL: reserve floor $25.99 | tax reserve ~$3.96 | contribution ~$5.24 | margin ~20.15%
- AE: reserve floor $17.99 | tax reserve ~$0.86 | contribution ~$4.35 | margin ~24.20%
- US: HOLD — address-level tax engine required

## 31411072
- DE: reserve floor $29.99 | tax reserve ~$4.79 | contribution ~$6.10 | margin ~20.35%
- GB: reserve floor $27.99 | tax reserve ~$4.67 | contribution ~$5.75 | margin ~20.53%
- IL: reserve floor $57.99 | tax reserve ~$8.85 | contribution ~$11.78 | margin ~20.32%
- AE: reserve floor $30.99 | tax reserve ~$1.48 | contribution ~$6.81 | margin ~21.96%
- US: HOLD — address-level tax engine required

## Interpretation
The previous pre-tax floor prices were not safe enough if HUNT must absorb standard VAT.
The reserve-aware floors above preserve the active contribution/margin gates under a conservative VAT-inclusive scenario.
They are not Production prices and must not be published automatically.

## Tax Truth states
- VERIFIED: transaction-level tax amount from an approved source; eligible to participate in Final Profit.
- RESERVE_ONLY: statutory standard-rate scenario; never Final Profit.
- HOLD: no approved transaction-level tax determination.

Preview adapter:
- supabase/functions/hunt-tax-truth-preview/index.ts
- commit fd7a97537d8c00674e05e5b1296a811f90d759bc
