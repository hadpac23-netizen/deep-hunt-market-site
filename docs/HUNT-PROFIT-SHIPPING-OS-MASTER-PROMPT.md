# HUNT PROFIT & SHIPPING OS — Master Prompt

## Mission
Build a global profit and shipping intelligence layer for HUNT that decides how every product and cart should be sold, shipped and priced to maximize verified net contribution without misleading the customer or damaging trust.

PRODUCT → VARIANT → SUPPLIER → WAREHOUSE → DESTINATION → SHIPPING METHOD → CART → LANDED COST → CUSTOMER PRICE → VERIFIED NET PROFIT

## Governance
AUDIT → REUSE → EXTEND → CREATE ONLY IF MISSING.

Reuse Product Truth, Product Passport, Commerce Truth, Price Gate, Shipping Chess, Profit Engine, Profit Attribution, Deal Builder, BOOM Orchestrator, Decision Intelligence Fabric, Learning Governance, Incident & Repair and Owner Gate.

Do not create parallel truth stores or duplicate engines. Production mutation requires Owner Gate. No live payment, supplier order, live price, discount, free-shipping, supplier-routing or customs-responsibility change without explicit approval.

## Core Rule
A product is never simply profitable. Evaluate:
SKU × VARIANT × SUPPLIER × WAREHOUSE × DESTINATION × SHIPPING METHOD × CART CONTEXT.

The same item may PASS in one route and BLOCK in another.

## Country Landed-Cost Gate
Required inputs:
- sale price and customer shipping revenue
- supplier product cost
- supplier shipping cost
- destination
- supplier / warehouse
- payment fee
- FX cost where applicable
- tax/import cost borne by HUNT
- discount cost
- affiliate/creator cost
- marketing cost
- expected return/refund cost
- other variable cost
- evidence state for all required values

TRUE LANDED VARIABLE COST = all verified variable costs.
PROJECTED NET CONTRIBUTION = customer revenue minus true landed variable cost.
Missing required truth => UNKNOWN, never zero.

## Warehouse Arbitrage
For exact product/variant truth in multiple routes, compare complete economics: product cost, shipping, customs, tax, delivery, reliability, return exposure and chargeable weight. Never choose by item price alone.

## DIM / Packaging Intelligence
Product Passport should support packed length/width/height, actual weight, dimensional weight, chargeable weight, package count and packaging type.

Track contribution per chargeable kg and per cubic volume where useful. Bulky furniture and office furniture require route-specific review.

## Cart Shipping Solver
Compare supplier split, warehouse split, package count, destination, incremental shipping, customs/tax, return risk and relevant add-ons.

Possible outputs: charge full shipping, subsidize part, unlock free shipping, suggest a relevant shipping-sponsor add-on, substitute route/supplier/warehouse, consolidate, split, or reject an uneconomic route.

Free shipping requires a known funding source.

## Shipping-Sponsor Products
Find relevant low-incremental-shipping products with positive contribution that can improve cart economics. Never add irrelevant items merely to manipulate basket size.

## Multi-Supplier Shipping Chess
Compare multiple shipments, alternate supplier, alternate warehouse, allowed consolidation and product substitution. Optimize verified contribution × delivery quality × customer trust, not shipping cost alone.

## Customs / Duties Truth
Product Passport should support country of origin, HS code, classification confidence, customs treatment, duty status, tax responsibility and destination restrictions.

Customer-facing state: DUTIES_INCLUDED / DUTIES_ESTIMATED / DUTIES_CUSTOMER_RESPONSIBILITY / DUTIES_UNKNOWN. UNKNOWN blocks false landed-price promises.

## Shipping Quote TTL
Every quote must bind supplier, item, exact variant, warehouse, destination, method, amount, currency, quoted_at and expires_at. Expired quotes are stale truth.

## Shipping Drift Detector
Compare quoted vs actual cost and detect quote drift, route/warehouse changes, dimensional mismatch, remote-area surcharge and ETA drift. Repeated drift lowers supplier confidence.

## Supplier Shipping Truth Score
Score quote accuracy, stock accuracy, ETA accuracy, dimensional accuracy, cancellations, tracking, fulfillment and refund/dispute history.

## Return-Aware Profit
Expected economics must include observed return risk by product/category/variant/country/supplier/channel when available.

## Realized Profit Loop
After every real non-test completed order:
Customer Revenue
minus Supplier Final Payable
minus Actual Shipping
minus Actual Duty/Tax
minus Payment Processing
minus FX
minus Discounts
minus Affiliate/Creator
minus Marketing
minus Refund/Return/Cancellation
minus Other Variable Cost
= VERIFIED NET CONTRIBUTION

Feed realized evidence back to Price Gate, Shipping Solver, Supplier Score, Distribution Score and Product Ranking. A test order can validate plumbing but never counts as realized profit.

## Country Profit Matrix
PRODUCT × COUNTRY → PASS / REVIEW / HOLD / REJECT / UNKNOWN. Global marketplace does not mean every SKU is globally sellable.

## Customer Shipping Experience
Track shipping transparency, ETA accuracy, customs clarity, tracking, split-shipment messaging, pickup options and return convenience.

## Profit Protection Evals
Always test stale quotes, false free shipping, negative route margin, wrong warehouse, dimensional mismatch, hidden duty, supplier drift, split-shipment explosion, return-heavy bundle, stale stock, currency movement, HS uncertainty, unknown tax treatment and missing costs.

## Shared Output Contract
status: PASS | REVIEW | HOLD | REJECT | UNKNOWN
score: 0-100
confidence: 0-1
reason_codes: []
evidence_refs: []
blockers: []
supplier / warehouse / destination / shipping_method
projected_contribution: null
verified_net_contribution: null
recommended_action: ""
requires_owner_gate: false

## Build Priority
P0: Country Landed-Cost Gate → DIM/Packaging Gate → Cart Shipping Solver → Realized Profit Loop.
P1: Warehouse Arbitrage → Shipping Quote TTL → Drift Detector → Supplier Shipping Truth Score.
P2: Shipping-Sponsor Products → Multi-Supplier Shipping Chess → Return-Aware Profit → Country Profit Matrix.
ALWAYS: Profit Protection Evals.

## Final Principle
Do not ask “Is this product profitable?”
Ask: “What is the best verified way to sell this exact variant to this exact destination, through this exact supplier/warehouse/route, while preserving customer trust and leaving real net contribution?”
