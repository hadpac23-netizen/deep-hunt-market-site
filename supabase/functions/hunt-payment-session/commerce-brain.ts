export type CommerceProfile = {
  id?: string | null;
  status?: string | null;
  owner_approved?: boolean | null;
  payment_rate?: number | string | null;
  refund_reserve_rate?: number | string | null;
  platform_variable_rate?: number | string | null;
  platform_fixed_per_order?: number | string | null;
  min_contribution_per_unit?: number | string | null;
};

export type CommerceLine = {
  provider?: string | null;
  item_id?: string | null;
  variant_id?: string | null;
  qty?: number | string | null;
  supplier_cost_per_unit?: number | string | null;
  shipping_amount?: number | string | null;
  shipping_method?: string | null;
  shipping_aging?: string | null;
  origin_country_code?: string | null;
  taxes_amount?: number | string | null;
  clearance_fee_amount?: number | string | null;
};

export type CommercePricing = {
  country_code?: string | null;
  currency?: string | null;
  product_amount?: number | string | null;
  shipping_amount?: number | string | null;
  total_amount?: number | string | null;
  discount_amount?: number | string | null;
  line_items?: CommerceLine[] | null;
};

const finite = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundMoney = (value: number) => Number(value.toFixed(2));
const roundRate = (value: number) => Number(value.toFixed(6));

export function assessCommerce(profile: CommerceProfile | null, pricing: CommercePricing) {
  const blockers: string[] = [];
  const lines = Array.isArray(pricing?.line_items) ? pricing.line_items : [];
  const productAmount = finite(pricing?.product_amount);
  const shippingCharged = finite(pricing?.shipping_amount);
  const totalAmount = finite(pricing?.total_amount);
  const discountAmount = finite(pricing?.discount_amount) ?? 0;
  const currency = String(pricing?.currency || "").toUpperCase();

  if (!profile || profile.status !== "active" || profile.owner_approved !== true) {
    blockers.push("PROFIT_PROFILE_NOT_ACTIVE");
  }
  if (!lines.length) blockers.push("COMMERCE_LINES_MISSING");
  if (currency !== "USD") blockers.push("COMMERCE_CURRENCY_NOT_SUPPORTED");
  if (productAmount === null || productAmount <= 0) blockers.push("PRODUCT_AMOUNT_INVALID");
  if (shippingCharged === null || shippingCharged < 0) blockers.push("SHIPPING_AMOUNT_INVALID");
  if (totalAmount === null || totalAmount <= 0) blockers.push("TOTAL_AMOUNT_INVALID");
  if (discountAmount < 0 || (productAmount !== null && discountAmount > productAmount)) {
    blockers.push("DISCOUNT_AMOUNT_INVALID");
  }

  let units = 0;
  let supplierProductCost = 0;
  let supplierShippingCost = 0;
  let taxesAndClearance = 0;
  for (const line of lines) {
    const qty = finite(line?.qty);
    const unitCost = finite(line?.supplier_cost_per_unit);
    const shippingCost = finite(line?.shipping_amount);
    if (qty === null || qty < 1) blockers.push("SUPPLIER_QUANTITY_INVALID");
    if (unitCost === null || unitCost <= 0) blockers.push("SUPPLIER_COST_NOT_VERIFIED");
    if (shippingCost === null || shippingCost < 0) blockers.push("SUPPLIER_SHIPPING_NOT_VERIFIED");
    units += Math.max(0, qty || 0);
    supplierProductCost += Math.max(0, unitCost || 0) * Math.max(0, qty || 0);
    supplierShippingCost += Math.max(0, shippingCost || 0);
    taxesAndClearance += Math.max(0, finite(line?.taxes_amount) || 0);
    taxesAndClearance += Math.max(0, finite(line?.clearance_fee_amount) || 0);
  }

  if (
    shippingCharged !== null &&
    Math.abs(roundMoney(supplierShippingCost) - roundMoney(shippingCharged)) > 0.01
  ) {
    blockers.push("SHIPPING_COST_MISMATCH");
  }

  const paymentRate = finite(profile?.payment_rate);
  const refundReserveRate = finite(profile?.refund_reserve_rate);
  const platformVariableRate = finite(profile?.platform_variable_rate);
  const platformFixed = finite(profile?.platform_fixed_per_order);
  const minContributionPerUnit = finite(profile?.min_contribution_per_unit);

  if (paymentRate === null || paymentRate < 0) blockers.push("PAYMENT_RATE_NOT_CONFIGURED");
  if (refundReserveRate === null || refundReserveRate < 0) blockers.push("REFUND_RESERVE_NOT_CONFIGURED");
  if (platformVariableRate === null || platformVariableRate < 0) blockers.push("PLATFORM_RATE_NOT_CONFIGURED");
  if (platformFixed === null || platformFixed < 0) blockers.push("PLATFORM_FIXED_COST_NOT_CONFIGURED");
  if (minContributionPerUnit === null || minContributionPerUnit < 0) blockers.push("MIN_CONTRIBUTION_NOT_CONFIGURED");

  const safeTotal = Math.max(0, totalAmount || 0);
  const paymentReserve = safeTotal * Math.max(0, paymentRate || 0);
  const refundReserve = safeTotal * Math.max(0, refundReserveRate || 0);
  const platformReserve =
    safeTotal * Math.max(0, platformVariableRate || 0) + Math.max(0, platformFixed || 0);
  const contribution =
    safeTotal -
    supplierProductCost -
    supplierShippingCost -
    paymentReserve -
    refundReserve -
    platformReserve;
  const minimumContribution = Math.max(0, minContributionPerUnit || 0) * units;

  if (roundMoney(contribution) < roundMoney(minimumContribution)) {
    blockers.push("MINIMUM_CONTRIBUTION_NOT_MET");
  }

  const uniqueBlockers = [...new Set(blockers)];
  const status = uniqueBlockers.length ? "BLOCKED" : "PASS";
  return {
    version: 1,
    status,
    evaluated_at: new Date().toISOString(),
    profile_id: profile?.id || null,
    country_code: String(pricing?.country_code || "").toUpperCase() || null,
    currency: currency || null,
    units,
    product_amount: roundMoney(Math.max(0, productAmount || 0)),
    shipping_charged: roundMoney(Math.max(0, shippingCharged || 0)),
    discount_amount: roundMoney(Math.max(0, discountAmount)),
    total_amount: roundMoney(safeTotal),
    supplier_product_cost: roundMoney(supplierProductCost),
    supplier_shipping_cost: roundMoney(supplierShippingCost),
    taxes_and_clearance: roundMoney(taxesAndClearance),
    payment_reserve: roundMoney(paymentReserve),
    refund_reserve: roundMoney(refundReserve),
    platform_reserve: roundMoney(platformReserve),
    contribution_amount: roundMoney(contribution),
    contribution_rate: safeTotal > 0 ? roundRate(contribution / safeTotal) : 0,
    minimum_contribution: roundMoney(minimumContribution),
    blockers: uniqueBlockers,
    routes: lines.map((line) => ({
      provider: String(line?.provider || ""),
      item_id: String(line?.item_id || ""),
      origin_country_code: String(line?.origin_country_code || "") || null,
      shipping_method: String(line?.shipping_method || "") || null,
      shipping_aging: String(line?.shipping_aging || "") || null,
    })),
  };
}

export function publicCommerceSummary(snapshot: ReturnType<typeof assessCommerce> | null | undefined) {
  if (!snapshot) {
    return {
      status: "BLOCKED",
      checks: {
        supplier_price: false,
        stock: false,
        shipping: false,
        contribution: false,
      },
      routes: [],
    };
  }
  return {
    status: snapshot.status,
    country_code: snapshot.country_code,
    currency: snapshot.currency,
    checks: {
      supplier_price: !snapshot.blockers.includes("SUPPLIER_COST_NOT_VERIFIED"),
      stock: true,
      shipping:
        !snapshot.blockers.includes("SUPPLIER_SHIPPING_NOT_VERIFIED") &&
        !snapshot.blockers.includes("SHIPPING_COST_MISMATCH"),
      contribution: snapshot.status === "PASS",
    },
    routes: snapshot.routes,
  };
}
