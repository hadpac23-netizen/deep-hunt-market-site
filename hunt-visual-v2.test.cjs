const fs=require("fs");
const assert=require("assert");

const pages=["index.html","category.html","product.html","search.html","checkout.html","profile.html"];
for(const file of pages){
  const html=fs.readFileSync(file,"utf8");
  assert(html.includes("hunt-visual-v2.css?v=1"),file+" missing HUNT Visual System 2.0");
  assert(html.includes("hd-commerce-v2"),file+" missing commerce V2 body class");
}
const index=fs.readFileSync("index.html","utf8");
const category=fs.readFileSync("category.html","utf8");
const product=fs.readFileSync("product.html","utf8");
const search=fs.readFileSync("search.html","utf8");
const checkout=fs.readFileSync("checkout.html","utf8");
const profile=fs.readFileSync("profile.html","utf8");
const theme=fs.readFileSync("hunt-theme.js","utf8");
const css=fs.readFileSync("hunt-visual-v2.css","utf8");

assert(index.includes('class="hd-hero4-categories"'),"Hero 4 category shortcuts missing");
assert(index.indexOf('category.html?c=women')<index.indexOf('category.html?c=men'),"Women must precede Men in Home priority");
assert(index.indexOf('category.html?c=accessories')<index.indexOf('category.html?c=men'),"Accessories must precede Men in Home priority");
assert(index.includes('id="hd-hero4-search-input"'),"Hero 4 conversational search missing");
assert(index.includes('id="hd-hero4-promo"'),"Hero 4 dynamic promo surface missing");
assert(theme.includes('"women","bags","jewelry","beauty","shoes","men"'),"Discovery priority order missing");

assert(category.includes('id="hd-category-grid"'),"Category product grid missing");
assert(product.includes('id="hd-product-add"'),"Product add-to-cart control missing");
assert(product.includes('id="hd-deal-builder"'),"BOOM Deal Builder missing");
assert(search.includes('id="hd-ai-search-input"'),"AI Find search input missing");
assert(search.includes('id="hd-mission-panel"'),"Mission Shopping panel missing");

assert(checkout.includes('id="hd-checkout-verify"'),"Checkout verification control missing");
assert(checkout.includes('class="hd-btn hd-btn-primary hd-pay-disabled" type="button" disabled'),"Payment must remain disabled in prelaunch");
assert(checkout.includes("Payment activation pending"),"Checkout live-payment boundary missing");
assert(profile.includes('id="hd-profile-saved"'),"Saved-products section missing");
assert(profile.includes('id="hd-profile-orders"'),"Order tracking section missing");

assert(css.includes("HUNT VISUAL SYSTEM 2.0 · COMMERCE FIRST"),"Visual System 2.0 contract missing");
assert(css.includes("HUNT V2 · CATEGORY"),"Category V2 styling missing");
assert(css.includes("HUNT V2 · PRODUCT"),"Product V2 styling missing");
assert(css.includes("HUNT V2 · AI FIND"),"Search V2 styling missing");
assert(css.includes("HUNT V2 · CHECKOUT"),"Checkout V2 styling missing");
assert(css.includes("HUNT V2 · PROFILE"),"Profile V2 styling missing");
assert(css.includes("@media(max-width:760px)"),"Mobile styling contract missing");
assert(css.includes('html[data-hunt-theme="dark"]'),"Dark mode support missing");


assert(css.includes("HUNT V2 · SHOPPER ACTIONS + DARK MEDIA SAFETY"),"Shopper action / dark media V2 styling missing");
assert(css.includes('mix-blend-mode:normal!important;filter:none!important;opacity:1!important'),"Dark mode image safety contract missing");

console.log("hunt_visual_v2=PASS");
