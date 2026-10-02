// Applied only at the public storefront boundary. Supplier evidence remains private.
const privateField = /(?:^|_)(?:supplier_cost|cost_price|cost_amount|landed_cost|purchase_price|wholesale_price|profit|margin)(?:_|$)|^projected_product_|^(?:source_payload|raw_response|raw_supplier_response|customs_truth_v1|origin_truth_v1|retail_truth_v1)$/i;
const supplierAmount = /^(?:price_amount|base_price|base_price_amount|min_price|max_price|cheapest_price|shipping_cost|supplier_price|taxesFee|taxes_fee)$/i;

export function publicStorefrontPayload(value, inheritedBasis = "") {
  if (Array.isArray(value)) return value.map(row => publicStorefrontPayload(row, inheritedBasis));
  if (value === null || typeof value !== "object") return value;
  const basis = String(value.price_basis || inheritedBasis).toUpperCase();
  const merchant = basis === "MERCHANT_RETAIL";
  const verifiedRetail = value.retail_price_verified === true && String(value.profit_gate_status).toUpperCase() === "PASS";
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (key !== "profit_gate_status" && privateField.test(key)) continue;
    if (supplierAmount.test(key) && !merchant) continue;
    if (/^(?:retail_price_amount|retail_price|compare_at_amount)$/.test(key) && !merchant && !verifiedRetail) continue;
    out[key] = publicStorefrontPayload(child, basis);
  }
  if (String(value.price_basis).toUpperCase() === "SUPPLIER_BASE") out.price_basis = "DETAIL_REQUIRED";
  return out;
}
