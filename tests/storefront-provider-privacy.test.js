import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const privacy = fs.readFileSync("storefront-privacy.js", "utf8");
const pwa = fs.readFileSync("pwa.js", "utf8");
const product = fs.readFileSync("product.html", "utf8");
const profile = fs.readFileSync("profile.js", "utf8");
const profileHtml = fs.readFileSync("profile.html", "utf8");
const deal = fs.readFileSync("hunt-deal.js", "utf8");

test("customer storefront loads the supplier privacy guard", () => {
  assert.match(pwa, /storefront-privacy\.js/);
  assert.match(product, /storefront-privacy\.js/);
  assert.match(product, /data-hunt-privacy/);
  assert.match(profileHtml, /storefront-privacy\.js\?v=source-privacy4/);
  assert.match(profileHtml, /data-hunt-privacy/);
});

test("product page does not expose supplier wording in static customer copy", () => {
  assert.doesNotMatch(product, />PROVIDER</i);
  assert.doesNotMatch(product, /Supplier price/i);
  assert.doesNotMatch(product, /This provider has not exposed/i);
  assert.match(product, /HUNT SOURCE/);
  assert.match(product, /HUNT price/);
});

test("privacy guard aliases known fulfillment sources in product links", () => {
  assert.match(privacy, /providerAlias/);
  assert.match(privacy, /providerFromAlias/);
  assert.match(privacy, /url\.searchParams\.set\("src",alias\)/);
  assert.match(privacy, /url\.searchParams\.delete\("provider"\)/);
  assert.match(privacy, /HUNT Network/);
  assert.match(privacy, /MutationObserver/);
});

test("profile hides fulfillment provider identity from saved items and orders", () => {
  assert.match(profile, /sourceCodeForProvider/);
  assert.match(profile, /q\.set\("src",src\)/);
  assert.doesNotMatch(profile, /product\.html\?provider=/);
  assert.doesNotMatch(profile, /<small>\$\{H\.esc\(row\.provider/);
  assert.doesNotMatch(profile, /<small>\$\{H\.esc\(order\.provider/);
  assert.match(profile, /HUNT SAVED/);
  assert.match(profile, /HUNT ORDER/);
  assert.match(profileHtml, /profile\.js\?v=profile2/);
  assert.doesNotMatch(profileHtml, /checkout\/provider systems/i);
});

test("deal storefront never renders raw provider identity into customer-visible copy", () => {
  assert.doesNotMatch(deal, /<div class=\"hd-provider\">\$\{esc\(c\.provider/);
  assert.doesNotMatch(deal, /<div class=\"hd-provider\">\$\{esc\(item\.provider/);
  assert.doesNotMatch(deal, /<small>\$\{esc\(item\.provider/);
  assert.doesNotMatch(deal, /candidate\.provider, retail/);
  assert.doesNotMatch(deal, /p\.provider \+ \": \" \+ p\.state/);
  assert.doesNotMatch(deal, /data-search=\"\$\{esc\(\(c\.title\|\|\"\"\)\+\" \"\+\(c\.provider/);
  assert.match(deal, /HUNT NETWORK/);
  assert.match(deal, /HUNT VERIFIED SOURCE/);
  assert.match(deal, /HUNT SOURCE/);
});

test("PWA cache cannot pin pre-red-team customer scripts", () => {
  const sw=fs.readFileSync("service-worker.js","utf8");
  const pwaSrc=fs.readFileSync("pwa.js","utf8");
  assert.match(sw,/hunt-shell-pwa7/);
  assert.match(pwaSrc,/service-worker\.js\?v=pwa7/);
  assert.match(sw,/storefront-privacy\|market-core\|product\|product-flow\|category\|profile\|hunt-wow/);
  assert.doesNotMatch(sw,/hunt-shell-pwa6/);
});

test("product navigation uses opaque source codes and preserves category context", () => {
  const core=fs.readFileSync("market-core.js","utf8");
  const category=fs.readFileSync("category.js","utf8");
  const productJs=fs.readFileSync("product.js","utf8");
  assert.match(core,/q\.set\("src", sourceCodeForProvider/);
  assert.doesNotMatch(core,/product\.html\?provider=/);
  assert.match(category,/H\.productUrl\(product,\{c:slug,sub\}\)/);
  assert.match(category,/H\.sourceCodeForProvider\(p\?\.provider\)/);
  assert.doesNotMatch(category,/`\$\{p\.provider \|\| ""\}:\$\{p\.item_id/);
  assert.doesNotMatch(category,/H\.esc\(product\.provider \|\| "Provider"\)/);
  assert.match(productJs,/H\.providerForSourceCode\(params\.get\("src"\)\)/);
  assert.match(productJs,/hunt_product_\$\{H\.sourceCodeForProvider\(provider\)\}:\$\{id\}/);
  assert.match(productJs,/cleanUrl\.searchParams\.delete\("provider"\)/);
});
