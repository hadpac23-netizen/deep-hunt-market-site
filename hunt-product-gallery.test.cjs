const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("product.html","utf8");
const js=fs.readFileSync("product.js","utf8");
const css=fs.readFileSync("hunt-deal.css","utf8");

for(const token of [
  'id="hd-gallery-count"',
  'id="hd-product-gallery-total"',
  'id="hd-zoom-prev"',
  'id="hd-zoom-next"',
  'id="hd-zoom-image-count"'
]) assert(html.includes(token),"Gallery UI contract missing: "+token);

for(const token of [
  "galleryImages",
  "galleryIndex",
  "updateGalleryState",
  "moveGallery",
  "zoomFocusable",
  "handleZoomKeydown",
  'event.key==="ArrowLeft"',
  'event.key==="ArrowRight"',
  'event.key!=="Tab"',
  "zoomReturnFocus",
  "aria-current"
]) assert(js.includes(token),"Gallery behavior contract missing: "+token);

for(const token of [
  ".hd-gallery-count",
  ".hd-product-gallery-meta",
  ".hd-zoom-nav",
  ".hd-zoom-prev",
  ".hd-zoom-next",
  ".hd-zoom-image-count",
  ":focus-visible"
]) assert(css.includes(token),"Gallery styling contract missing: "+token);

assert(!html.includes('role="listitem"'),"Thumbnail buttons must retain native button semantics");
assert(js.includes('galleryImages.length+" photo"'),"Gallery total signposting missing");
console.log("hunt_product_gallery=PASS");
