const fs = require("fs");
const assert = require("assert");

const src = fs.readFileSync("boom-printful-readiness.mjs", "utf8");
assert(src.includes('process.env.PRINTFUL_API_TOKEN'));
assert(src.includes('process.env.PRINTFUL_STORE_ID'));
assert(src.includes('mode: "READ_ONLY"'));
assert(src.includes('shipping: "NOT_VERIFIED"'));
assert(src.includes('fulfillment: "DISABLED"'));
assert(src.includes('fetch(base + path'));
assert(!src.includes('"/stores"'));
assert(src.includes('"/store/products"'));
assert(src.includes('expectedStoreId ? { "X-PF-Store-Id": expectedStoreId } : {}'));
assert(!src.includes("POST"));
assert(!src.includes("orders"));
assert(!src.includes("console.log(token"));
console.log("PASS boom-printful-readiness");
