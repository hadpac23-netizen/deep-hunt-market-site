import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const privacy = fs.readFileSync("storefront-privacy.js", "utf8");
const pwa = fs.readFileSync("pwa.js", "utf8");
const product = fs.readFileSync("product.html", "utf8");

test("customer storefront loads the supplier privacy guard", () => {
  assert.match(pwa, /storefront-privacy\.js/);
  assert.match(product, /storefront-privacy\.js/);
  assert.match(product, /data-hunt-privacy/);
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


test("PWA cache cannot pin pre-red-team customer scripts", () => {
  const sw=fs.readFileSync("service-worker.js","utf8");
  const pwaSrc=fs.readFileSync("pwa.js","utf8");
  assert.match(sw,/hunt-shell-pwa4/);
  assert.match(pwaSrc,/service-worker\.js\?v=pwa4/);
  assert.match(sw,/storefront-privacy\|market-core\|product\|category\|hunt-wow/);
  assert.doesNotMatch(sw,/hunt-shell-pwa3/);
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
