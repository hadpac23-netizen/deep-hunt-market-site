const assert=require("node:assert/strict");
const fs=require("node:fs");

const source=fs.readFileSync("supabase/functions/hunt-hypersku-readonly/index.ts","utf8");

assert(source.includes("HYPERSKU_OPEN_API_TOKEN"),"server-side HyperSKU token env missing");
assert(source.includes("HYPERSKU_OPEN_API_BASE_URL"),"server-side HyperSKU base env missing");
assert(source.includes("HYPERSKU_PRODUCT_PATH"),"product path config missing");
assert(source.includes("HYPERSKU_STOCK_PATH"),"stock path config missing");
assert(source.includes("HYPERSKU_SHIPPING_QUOTE_PATH"),"shipping path config missing");
assert(source.includes('"AUTH_REQUIRED"'),"auth blocker missing");
assert(source.includes('"PROVIDER_DOCS_REQUIRED"'),"provider docs blocker missing");
assert(source.includes("fulfillment_enabled:false"),"fulfillment lock missing");
assert(source.includes('mode:"READ_ONLY"'),"read-only mode missing");
assert(source.includes("Provider transport is intentionally locked"),"transport lock missing");
assert(!/hypersku\.com\/(api|openapi|v\d)/i.test(source),"guessed HyperSKU endpoint must not be hard-coded");

console.log("HyperSKU read-only Edge Function source tests: PASS");
