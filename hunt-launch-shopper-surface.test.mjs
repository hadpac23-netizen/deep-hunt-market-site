import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const productJs = readFileSync(new URL('./product.js', import.meta.url), 'utf8');
const productHtml = readFileSync(new URL('./product.html', import.meta.url), 'utf8');
const checkoutJs = readFileSync(new URL('./checkout.js', import.meta.url), 'utf8');
const profileJs = readFileSync(new URL('./profile.js', import.meta.url), 'utf8');
const cinematicJs = readFileSync(new URL('./hunt-cinematic-first-exact.js', import.meta.url), 'utf8');
const authJs = readFileSync(new URL('./auth.js', import.meta.url), 'utf8');

test('shopper-facing product surfaces use HUNT identity instead of supplier labels', () => {
  assert.match(productJs, /HUNT VERIFIED/);
  assert.match(productHtml, /HUNT price/);
  assert.doesNotMatch(productJs, /hd-product-provider"\)\.textContent\s*=\s*product\.provider/);
  assert.doesNotMatch(checkoutJs, /<small>\$\{esc\(item\.provider\)\}/);
  assert.doesNotMatch(profileJs, /<small>\$\{H\.esc\(row\.provider/);
  assert.match(cinematicJs, /HUNT VERIFIED/);
});

test('supplier routing remains internal for product and checkout truth', () => {
  assert.match(productJs, /const provider = params\.get\("provider"\)/);
  assert.match(checkoutJs, /provider:item\.provider/);
  assert.match(productJs, /cjCheckoutReady/);
});

test('unconfigured login providers are hidden from shoppers', () => {
  assert.match(authJs, /button\.hidden=!enabled/);
  assert.match(authJs, /external\[provider\]===true/);
});


test('profile links use HUNT public refs and host-safe auth redirects', () => {
  assert.match(profileJs, /HUNT_SHADOW_V1/);
  assert.match(profileJs, /hunt-cinematic-first-exact-preview\.html\?product=/);
  assert.doesNotMatch(profileJs, /product\.html\?provider=/);
  assert.match(profileJs, /location\.pathname\+location\.search\+location\.hash/);
});

test('checkout shopper copy never renders the provider label', () => {
  assert.match(checkoutJs, /HUNT VERIFIED/);
  assert.doesNotMatch(checkoutJs, /<small>\$\{esc\(item\.provider\)\}/);
});
