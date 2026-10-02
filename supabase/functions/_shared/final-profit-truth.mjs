// Internal evidence only. No flag here can enable selling, payments or ordering.
const clean = value => typeof value === "string" ? value.trim() : "";
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
export function finiteAmount(value) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function bound(node, context) {
  return object(node) && node.provider === context.provider &&
    clean(node.item_id) === context.item_id && clean(node.variant_id) === context.variant_id;
}
function proof(evidence, kinds, now, expiring = false) {
  if (!object(evidence) || !kinds.includes(evidence.source_type) || !clean(evidence.source_ref)) return false;
  const checked = Date.parse(evidence.verified_at);
  if (!Number.isFinite(checked) || checked > now) return false;
  const expiry = Date.parse(evidence.expires_at);
  if (expiring && (!Number.isFinite(expiry) || expiry <= now || now - checked > 60 * 60 * 1000)) return false;
  return evidence.expires_at === undefined || (Number.isFinite(expiry) && expiry > now && expiry > checked);
}
function variantNode(root, variantId) {
  if (!object(root)) return null;
  if (object(root.variants) && Object.hasOwn(root.variants, variantId)) return root.variants[variantId];
  return clean(root.variant_id) === variantId ? root : null;
}
function marketNode(node, country) {
  return object(node?.markets) && Object.hasOwn(node.markets, country) ? node.markets[country] : null;
}
function marketBound(node, context) {
  return bound(node, context) && node.destination_country === context.country && node.currency === "USD";
}
const originSources = ["OFFICIAL_SUPPLIER_API", "OFFICIAL_SUPPLIER_PAGE", "SUPPLIER_ATTESTATION", "CUSTOMS_DOCUMENT"];
const taxSources = ["OFFICIAL_LANDED_COST_PROVIDER", "CUSTOMS_AUTHORITY"];
export function customsTruth(source, context, now = Date.now()) {
  const node = variantNode(source?.customs_truth_v1, context.variant_id);
  const origin = clean(node?.country_of_origin).toUpperCase();
  const originVerified = bound(node, context) && node.country_of_origin_verified === true &&
    /^[A-Z]{2}$/.test(origin) && proof(node.country_of_origin_evidence, originSources, now);
  const market = marketNode(node, context.country);
  const amount = finiteAmount(market?.duty_tax_usd);
  const landed = originVerified && marketBound(market, context) && market.country_of_origin === origin &&
    market.landed_cost_verified === true && market.destination_tax_duty_verified === true &&
    amount !== null && amount >= 0 && market.quantity === 1 &&
    finiteAmount(market.item_amount_usd) === context.retail_usd && context.retail_usd > 0 &&
    finiteAmount(market.shipping_usd) === context.shipping_usd &&
    clean(market.shipping_method) === context.shipping_method && Boolean(context.shipping_method) &&
    clean(market.hs_code).length > 0 && market.classification_verified === true &&
    proof(market.evidence, taxSources, now, true);
  return { country_of_origin: origin || null, country_of_origin_verified: Boolean(originVerified),
    landed_cost_verified: Boolean(landed), destination_tax_duty_verified: Boolean(landed),
    duty_tax_usd: landed ? amount : null };
}
export function retailTruth(source, context, now = Date.now()) {
  const node = variantNode(source?.retail_truth_v1, context.variant_id);
  const market = marketNode(node, context.country);
  const price = finiteAmount(market?.retail_usd);
  const chargedShipping = finiteAmount(market?.customer_shipping_usd);
  const verified = bound(node, context) && marketBound(market, context) &&
    market.status === "PASS" && market.retail_price_verified === true &&
    market.market_price_verified === true && price !== null && price > 0 &&
    chargedShipping !== null && chargedShipping >= 0 &&
    proof(market.evidence, ["MARKET_PRICE_REVIEW"], now, true);
  return { retail_price_verified: Boolean(verified), current_retail_usd: verified ? price : null,
    customer_shipping_usd: verified ? chargedShipping : null };
}
function economics(profile, sale, cost, ship, tax, chargedShipping) {
  const value = (key, fallback) => profile?.[key] === undefined ? fallback : finiteAmount(profile[key]);
  const pay = value("payment_rate", 0.04), refund = value("refund_reserve_rate", 0.05);
  const variable = value("platform_variable_rate", 0), fixed = value("platform_fixed_per_order", 0);
  const minC = value("min_contribution_per_unit", 4), minM = value("min_margin_rate", 0.20);
  if ([pay, refund, variable, fixed, minC, minM].some(n => n === null || n < 0) ||
      pay + refund + variable >= 1 || minM >= 1) return { gate: "BLOCK", contribution: null, margin: null };
  const gross = sale + chargedShipping;
  const contribution = gross - cost - ship - tax - gross * (pay + refund + variable) - fixed;
  const margin = sale > 0 ? contribution / sale : 0;
  return { contribution: Number(contribution.toFixed(2)), margin: Number(margin.toFixed(4)),
    gate: contribution >= minC && margin >= minM ? "PASS" : contribution > 0 ? "REVIEW" : "BLOCK" };
}
export function finalProfitTruth(source, context, profile, now = Date.now()) {
  const retail = retailTruth(source, context, now);
  const customs = customsTruth(source, { ...context, retail_usd: retail.current_retail_usd }, now);
  const cost = finiteAmount(context.cost_usd), ship = finiteAmount(context.shipping_usd);
  const stock = finiteAmount(context.stock_quantity);
  const inputsVerified = cost !== null && cost > 0 && ship !== null && ship >= 0 &&
    Number.isSafeInteger(stock) && stock > 0 && Boolean(clean(context.shipping_method));
  const econ = inputsVerified && retail.retail_price_verified && customs.destination_tax_duty_verified ?
    economics(profile, retail.current_retail_usd, cost, ship, customs.duty_tax_usd, retail.customer_shipping_usd) : null;
  const verified = inputsVerified && retail.retail_price_verified && customs.country_of_origin_verified &&
    customs.destination_tax_duty_verified && econ?.gate === "PASS";
  const reason = verified ? null : !inputsVerified ? "SUPPLIER_INPUTS_NOT_VERIFIED" :
    !customs.country_of_origin_verified ? "COUNTRY_OF_ORIGIN_NOT_VERIFIED" :
    !retail.retail_price_verified ? "RETAIL_PRICE_UNVERIFIED" :
    !customs.destination_tax_duty_verified ? "DESTINATION_TAX_NOT_VERIFIED" : "ECONOMICS_NOT_PASS";
  return { ...retail, ...customs, economics: econ, final_profit_verified: Boolean(verified), reason };
}
export function completeCustomsCoverage(rows, complete, field) {
  return complete === true && Array.isArray(rows) && rows.length > 0 &&
    new Set(rows.map(row => row.variant_id)).size === rows.length &&
    rows.every(row => clean(row.variant_id) && row[field] === true);
}
