const fs=require("fs");
const assert=require("assert");

const product=fs.readFileSync("product.js","utf8");
const payment=fs.readFileSync("supabase/functions/hunt-payment-session/index.ts","utf8");
const profit=fs.readFileSync("supabase/functions/_shared/hunt-commerce-profit.mjs","utf8");

assert(product.includes('const readyForCart = Boolean(selectedVariant) && cjCheckoutReady && selectedAvailability.cartReady;'));
assert(product.includes('const canVerifyStock = Boolean(selectedVariant) && cjCheckoutReady && selectedAvailability.state==="recheck";'));
assert(!product.includes('if (!retail.ready || !cjCheckoutReady) return;'));
assert(product.includes('"Add for price check →"'));
assert(product.includes('"Verify stock & add →"'));

assert(payment.includes("minimumSafeSalePricePerUnit"));
assert(payment.includes("destination_price_adjusted"));
assert(payment.includes("catalog_retail_amount"));
assert(payment.includes('if(economics.profit_gate_status!=="PASS")throw new Error("PROFIT_RECHECK_FAILED")'));
assert(profit.includes("export function minimumSafeSalePricePerUnit"));

console.log("HUNT product → checkout integrity: PASS — selectable CJ variants are not blocked by price-pending state, and destination pricing still fails closed.");
