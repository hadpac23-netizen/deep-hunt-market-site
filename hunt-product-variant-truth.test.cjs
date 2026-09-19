const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("product.html","utf8");
const js=fs.readFileSync("product.js","utf8");
const qa=fs.readFileSync("hunt-product-qa.js","utf8");
const css=fs.readFileSync("hunt-deal.css","utf8");

for(const token of [
  'id="hd-size-truth"',
  'id="hd-size-truth-copy"',
  'id="hd-variant-truth"',
  'id="hd-variant-availability"',
  'id="hd-variant-compatibility"'
]) assert(html.includes(token),"X04 UI missing: "+token);

for(const token of [
  "variantQuoteCache",
  "variantQuoteErrors",
  "variantQuoteKey",
  "variantAvailability",
  "verifySelectedVariantStock",
  "/hunt-cj-quote",
  "stock_verified",
  "stock_available",
  "cartReady",
  "Verify stock & add",
  "Stock recheck required",
  "selectedAvailability"
]) assert(js.includes(token),"X04 behavior missing: "+token);

assert(js.includes("async function addCurrentToCart"),"Add to cart must support async stock verification");
assert(js.includes("if(!selectedAvailability.cartReady)"),"Cart must require selected variant stock readiness");
assert(js.includes("url.searchParams.set(\"vid\""),"CJ quote must verify exact VID");
assert(js.includes("url.searchParams.set(\"quantity\""),"CJ quote must verify selected quantity");
assert(js.includes("No verified measurement chart has been supplied"),"Size truth boundary missing");

for(const token of ["selectedAvailability","No structured compatibility matrix has been supplied","Current selection stock still needs live verification"]){
  assert(qa.includes(token),"Product Truth X04 contract missing: "+token);
}
for(const token of [".hd-size-truth",".hd-variant-truth","#hd-variant-availability[data-state=\"unavailable\"]",".hd-decision-check-cell[data-state=\"blocked\"]"]){
  assert(css.includes(token),"X04 styling missing: "+token);
}

console.log("hunt_product_variant_truth=PASS");
