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
  assert.match(privacy, /url\.searchParams\.set\("provider",source\)/);
  assert.match(privacy, /HUNT Network/);
  assert.match(privacy, /MutationObserver/);
});
