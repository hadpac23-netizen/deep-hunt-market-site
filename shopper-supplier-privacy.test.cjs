const fs=require("fs");
const assert=require("node:assert");

const product=fs.readFileSync("product.js","utf8");
const category=fs.readFileSync("category.js","utf8");
const profile=fs.readFileSync("profile.js","utf8");
const history=fs.readFileSync("hunt-history.js","utf8");

assert(product.includes('$("#hd-product-provider").textContent = "HUNT VERIFIED SOURCE";'),"Product page must hide supplier name");
assert(!product.includes('$("#hd-product-provider").textContent = product.provider || provider;'),"Product page supplier leak regression");

assert(category.includes('<span class="hd-market-source">HUNT SOURCE</span>'),"Category card source badge must be generic");
assert(category.includes('<small>HUNT SOURCE · ${H.esc(stateLabel)}</small>'),"Category card detail source must be generic");
assert(!category.includes('H.esc(product.provider || "CATALOG")'),"Category supplier badge leak regression");
assert(!category.includes('<small>${H.esc(product.provider || "Provider")}'),"Category supplier detail leak regression");

assert(profile.includes("<small>HUNT SOURCE</small>"),"Profile product source must be generic");
assert(profile.includes("<small>HUNT ORDER</small>"),"Profile order source must be generic");
assert(!profile.includes('<small>${H.esc(row.provider||"")}</small>'),"Profile product supplier leak regression");
assert(!profile.includes('<div><small>${H.esc(order.provider)}</small>'),"Profile order supplier leak regression");

assert(history.includes("<small>HUNT SOURCE</small>"),"History product source must be generic");
assert(!history.includes("<small>\'+esc(row.provider||\"\")+\'</small>"),"History supplier leak regression");

console.log("shopper_supplier_privacy=PASS");
