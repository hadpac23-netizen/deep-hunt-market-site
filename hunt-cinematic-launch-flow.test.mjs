import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./hunt-cinematic-first-exact-preview.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('./hunt-cinematic-first-exact.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('./hunt-cinematic-first-exact.css', import.meta.url), 'utf8');

test('product world exists as an accessible modal continuation', () => {
  assert.match(html, /id="product-world"/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /id="world-similar-grid"/);
  assert.match(html, /id="world-nearby-grid"/);
  assert.match(html, /id="world-for-you-grid"/);
  assert.match(html, /id="world-cross-grid"/);
  assert.match(css, /\.product-world-shell/);
  assert.match(css, /\.world-grid/);
});

test('the continuation order preserves taxonomy before discovery', () => {
  const sameShelf = html.indexOf('01 · SAME EXACT SHELF');
  const sameDepartment = html.indexOf('02 · SAME DEPARTMENT');
  const personalized = html.indexOf('03 · BOOM PERSONALIZATION');
  const crossWorld = html.indexOf('04 · CLEARLY SEPARATE WORLDS');
  assert.ok(sameShelf > -1);
  assert.ok(sameShelf < sameDepartment);
  assert.ok(sameDepartment < personalized);
  assert.ok(personalized < crossWorld);
  assert.match(js, /candidate\.canonical_route !== product\.canonical_route/);
  assert.match(js, /crossDepartments\.has\(productDepartment\(candidate\)\)/);
});

test('BOOM personalization cannot mutate canonical routes', () => {
  assert.match(js, /function personalizationScore/);
  assert.match(js, /localStorage\.setItem\(PROFILE_KEY/);
  assert.doesNotMatch(js, /canonical_route\s*=/);
  assert.doesNotMatch(js, /department\s*=\s*productDepartment/);
});

test('launch preview keeps live commerce controls off', () => {
  assert.match(html, /PAYMENT OFF · SUPPLIER ORDER OFF · TAXONOMY PUBLISH OFF/);
  assert.doesNotMatch(html, /pay now|place order|supplier order now/i);
  assert.doesNotMatch(js, /payment[_-]?live\s*=\s*true|supplier[_-]?live\s*=\s*true/i);
});

test('keyboard and reduced-motion accessibility hooks stay present', () => {
  assert.match(html, /class="skip-link"/);
  assert.match(js, /event\.key === 'Escape'/);
  assert.match(js, /event\.key !== 'Tab'/);
  assert.match(js, /\.inert = value/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /focus-visible/);
});


test('shopper cards hide supplier identity and expose HUNT price presentation', () => {
  assert.match(js, /HUNT VERIFIED/);
  assert.match(js, /function huntPrice/);
  assert.match(js, /target_retail_usd/);
  assert.doesNotMatch(js, /<span class="badge">\$\{esc\(product\.provider\)\}<\/span>/);
  assert.match(html, /href="auth\.html"/);
});


test('all-departments navigation remains keyboard accessible', () => {
  assert.match(html, /id="all-departments-toggle"/);
  assert.match(html, /aria-controls="all-departments-panel"/);
  assert.match(html, /id="all-departments-grid"/);
  assert.match(js, /setDepartmentPanel/);
  assert.match(js, /data-dept-panel/);
  assert.match(js, /event\.key === 'Escape'/);
  assert.match(css, /\.all-departments-grid/);
});
