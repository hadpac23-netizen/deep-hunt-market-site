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


test('live shadow catalog is preferred with a checked-in fallback', () => {
  assert.match(js, /hunt-cinematic-shadow-catalog/);
  assert.match(js, /headers:\s*\{ apikey: LIVE_SHADOW_KEY \}/);
  assert.match(js, /sourceMode = 'live-shadow'/);
  assert.match(js, /sourceMode = 'checked-in-fallback'/);
  assert.match(js, /HUNT-TAXONOMY-PROFIT-V2-PREVIEW-SUPPLEMENT-2026-09-27\.json/);
});

test('shadow eligibility accepts evidence-pending without treating it as final profit', () => {
  const taxonomy = readFileSync(new URL('./hunt-cinematic-first-taxonomy.mjs', import.meta.url), 'utf8');
  assert.match(taxonomy, /PASS_PHYSICAL_EVIDENCE_PENDING/);
  assert.match(taxonomy, /final_profit_verified !== false/);
});


test('Women navigation is grouped without changing canonical routes', () => {
  assert.match(js, /DEPARTMENT_NAV_GROUPS/);
  assert.match(js, /Lingerie & Sleep/);
  assert.match(js, /data-category/);
  assert.match(js, /Complete the look/);
  assert.match(css, /\.category-index\.grouped/);
  assert.match(css, /\.category-group/);
});

test('Women underwear sleepwear and shoes expose safe type filters inside the same canonical shelf', () => {
  assert.match(js, /women\/women-underwear/);
  assert.match(js, /Bras/);
  assert.match(js, /Thongs/);
  assert.match(js, /Shapewear/);
  assert.match(js, /Bodysuits/);
  assert.match(js, /Robes & Dressing Gowns/);
  assert.match(js, /Sneakers & Trainers/);
  assert.match(js, /Heels/);
  assert.match(js, /Boots/);
  assert.match(js, /segmentDefinition/);
  assert.match(js, /productsForSegment/);
  assert.doesNotMatch(js, /canonical_route\s*=.*segment/);
});

test('empty type filters are disabled instead of borrowing products', () => {
  assert.match(js, /count === 0 \? 'disabled aria-disabled="true"'/);
  assert.match(html, /id="segment-buttons"/);
});


test('Quick Find searches only the gated in-memory catalog and canonical routes', () => {
  assert.match(html, /id="hunt-find-input"/);
  assert.match(js, /function finderResults/);
  assert.match(js, /for \(const product of allProducts\(\)\)/);
  assert.match(js, /product\.canonical_route/);
  assert.match(js, /navigateToExactRoute/);
  assert.doesNotMatch(js, /hunt-cj-product-detail-shadow/);
});

test('Quick Find supports keyboard close and first-result activation', () => {
  assert.match(js, /event\.key === 'Escape'/);
  assert.match(js, /event\.key === 'Enter'/);
  assert.match(js, /first\.click\(\)/);
});

test('Women commerce navigation exposes lingerie sleep and footwear groups without route mutation', () => {
  assert.match(js, /Lingerie & Sleep/);
  assert.match(js, /Robes & Dressing Gowns/);
  assert.match(js, /Sports Bras/);
  assert.match(js, /Maternity & Nursing/);
  assert.match(js, /Sneakers & Trainers/);
  assert.match(js, /productsForSegment/);
  assert.doesNotMatch(js, /canonical_route\s*=.*segment/);
});


test('Accessories Jewelry is the featured first navigation group', () => {
  assert.match(js, /Jewelry & Watches/);
  assert.match(js, /featured: true/);
  assert.match(js, /jewelry-earrings','jewelry-necklaces','jewelry-rings','jewelry-bracelets','jewelry','watches/);
  assert.match(css, /\.category-group-featured/);
});

test('Women exposes direct exact shortcuts into jewelry shelves', () => {
  assert.match(js, /data-nav-exact="accessories\|jewelry-earrings\|jewelry-earrings"/);
  assert.match(js, /data-nav-exact="accessories\|jewelry-necklaces\|jewelry-necklaces"/);
  assert.match(js, /data-nav-exact="accessories\|jewelry-rings\|jewelry-rings"/);
  assert.match(js, /navigateToExactRoute/);
});

test('Jewelry semantic policies block common non-jewelry false positives', () => {
  assert.match(taxonomy, /smart ring/);
  assert.match(taxonomy, /steel ring/);
  assert.match(taxonomy, /ring detail/);
  assert.match(taxonomy, /christmas tree pendant/);
  assert.match(taxonomy, /smart bracelet/);
});


test('BOOM Stylist ranking stays inside the exact route', () => {
  assert.match(js, /function stylistScore/);
  assert.match(js, /function contributionScore/);
  assert.match(js, /function curateWithinRoute/);
  assert.match(js, /stylistScore\(b\) - stylistScore\(a\)/);
  assert.match(js, /contributionScore\(b\) - contributionScore\(a\)/);
  assert.match(js, /function routeProducts\(route\) \{ return curateWithinRoute\(index\?\.byRoute\.get\(route\) \|\| \[\]\); \}/);
  assert.doesNotMatch(js, /canonical_route\s*=.*stylist/i);
});

test('Jewelry exact identity blocks clothing display storage and holiday false positives', () => {
  assert.match(taxonomy, /jumpsuit/);
  assert.match(taxonomy, /display stand/);
  assert.match(taxonomy, /watch storage/);
  assert.match(taxonomy, /christmas tree pendant/);
});
