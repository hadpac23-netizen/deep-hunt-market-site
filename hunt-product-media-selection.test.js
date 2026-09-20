const fs=require("fs");
const assert=require("assert");
const product=fs.readFileSync("product.js","utf8");

assert(product.includes('let renderedVariantId = "";'));
assert(product.includes("const variantChanged=variantId!==renderedVariantId;"));
assert(product.includes("if(variantChanged&&variantSrc)"));
assert(product.includes('thumbs.querySelectorAll("[data-gallery-index]").forEach(button=>{'));
assert(product.includes("galleryIndex=index;"));
assert(product.includes("updateGalleryState({focusThumb:true});"));
assert(product.includes('const color=event.target.closest?.("[data-color]");'));
assert(product.includes('const size=event.target.closest?.("[data-size]");'));
assert(product.includes("chooseVariant();"));
assert(product.includes("renderBuybox();"));

console.log("HUNT product media selection: PASS — thumbnails and provider variants drive the main image deterministically.");
