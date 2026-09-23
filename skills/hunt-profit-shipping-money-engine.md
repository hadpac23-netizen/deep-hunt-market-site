# HUNT Profit, Shipping & Money Engine

## Mission
Extend the existing BOOM Profit Engine with route-level landed-cost truth, shipping economics, contribution density and evidence-backed product money roles.

## Required Inputs
Exact product/variant identity; supplier; warehouse; destination; sale/customer shipping revenue; supplier cost; supplier shipping; payment; FX; tax/import responsibility; discount; marketing/affiliate cost; return/refund exposure; package dimensions/weight when density is evaluated; stock/shipping evidence; optional observed acquisition/basket/retention performance.

## Truth Requirements
UNKNOWN never becomes zero. Projected contribution is not realized profit. Test orders are not realized profit. Exact variant, route and destination remain bound to the decision. Stale shipping quotes are not current truth.

## Output Schema
Use PASS/REVIEW/HOLD/REJECT/UNKNOWN with score, confidence, reason_codes, evidence_refs, blockers, recommended_action and requires_owner_gate. Money outputs may include traffic_value, basket_value, projected_contribution, verified_profit_value, contribution_density and money_roles.

## Confidence
Confidence is evidence completeness/quality, never model certainty. Missing critical cost or shipping truth caps the result at UNKNOWN/HOLD.

## Reason Codes
MISSING_DESTINATION; MISSING_COST_EVIDENCE; PRODUCT_TRUTH_NOT_VERIFIED; STOCK_NOT_VERIFIED; SHIPPING_NOT_VERIFIED; NEGATIVE_CONTRIBUTION; BELOW_MARGIN_FLOOR; SHIPPING_DENSITY_UNKNOWN; PERFORMANCE_EVIDENCE_MISSING; REALIZED_PROFIT_NOT_AVAILABLE; OWNER_GATE_REQUIRED.

## Blockers
First missing critical truth, stale route evidence, negative route economics, unresolved customs/tax responsibility, missing package data for DIM-sensitive products, or missing actual finance evidence when verified-profit is requested.

## Fallback
Keep the safe route, return UNKNOWN/HOLD, identify the first missing evidence and request refresh. Never invent a substitute value.

## Success Metrics
Verified net contribution/order, verified net profit/hour, complete-cost contribution margin, contribution per shipping dollar, contribution per chargeable kg, repeat contribution share, return/refund leakage and measured acquisition economics.

## Owner Gate Requirement
Shadow scoring and simulation do not require Owner Gate. Live price, discount, shipping charge, free shipping, supplier routing, external publish/outreach, paid spend, supplier order, payment activation and major live inventory blocking do.

## Integration
Reuse BOOM Orchestrator, Decision Intelligence Fabric, Commerce Truth, Profit Engine, Product Profit Ledger, Shipping Chess, Deal Builder, F60T, Learning Governance, Incident & Repair and Owner Gate. Do not create a new Primary Brain or parallel truth store.
