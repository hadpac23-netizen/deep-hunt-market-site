# EPROLO Fulfillment Red Team — 2026-10-02

Status: BLOCKED — EPROLO_EXECUTION_BLOCKED.

FOUND: official account-support contract documents POST add_order.html and GET order_list.html, but Product-Detail/order-compatible variantsid provenance and safe nonbillable execution are unproven. getCostByProduct method mismatch remains (documented GET versus prior runtime POST). Tax8 COO/material/tax evidence is missing.
IMPACT: wrong variant namespace, unverified tax_cost or an unintended billable order.
FIX/TEST: existing branch request preview retains required tax_cost, country/code, province/code, postal code, city, name, address, order_id/number, orderItemlist[].variantsid and quantity. Missing tax/province/namespace proof fails closed; personal fields render as <collected>. No add_product, add_order or supplier mutation was called.
STATUS: PARTIAL request-shape verification; order/query/tracking E2E BLOCKED.

Exact next action: obtain account support's written exact Product Detail/order variant namespace and current cost-quote method contract, plus explicit nonbillable Sandbox/test-account procedure. Finish TAX8 truth first. Validate a PII-redacted request, then execute only within the confirmed test procedure and reconcile by unique merchant order ID before retries. Historical Get All Products variant IDs do not establish order compatibility.

Official support source retained in ops/hunt-eprolo-order-contract.json: https://www.showdoc.com.cn/1196052652818927/6042185641524205. This run's public retrieval returned the documentation shell, not a new authenticated contract confirmation.
