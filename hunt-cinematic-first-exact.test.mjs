import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEPARTMENTS, buildIndex, isEligible, resolveSelection, rankWithinRoute } from './hunt-cinematic-first-taxonomy.mjs';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const supplement = read('./evidence/HUNT-TAXONOMY-PROFIT-V2-PREVIEW-SUPPLEMENT-2026-09-27.json');
const index = buildIndex(supplement);

test('the original department and Women category sequence is preserved', () => {
  assert.deepEqual(DEPARTMENTS.slice(0, 3).map(d => d.slug), ['women', 'men', 'kids']);
  assert.deepEqual(DEPARTMENTS[0].categories.slice(0, 6).map(c => c.id),
    ['women-dresses', 'women-evening', 'women-suits', 'women-tops', 'women-jeans', 'women-bottoms']);
  const women = resolveSelection('women', 'women-dresses');
  assert.equal(women.route, 'women/women-dresses');
  assert.equal(resolveSelection('men', 'women-dresses').route, null);
});

test('exact V2 routes admit no other department, and empty categories remain empty', () => {
  assert.ok(index.stats.accepted >= 163);
  assert.equal(index.byRoute.get('women/women-dresses')?.length || 0, 0);
  assert.equal(index.byRoute.get('gifts/party')?.length || 0, 0);
  assert.ok([...index.byRoute.entries()].every(([route, products]) => products.every(p =>
    p.canonical_route === route && `${p.department}/${p.category}` === route)));
  const evening = index.byRoute.get('women/women-evening');
  assert.ok(evening.length > 0);
  assert.ok(evening.every(p => p.department === 'women' && p.category === 'women-evening'));
  assert.equal(isEligible('gifts/party', { ...evening[0], department: 'gifts', category: 'party' }), false);
});

test('uncovered configured routes use a conservative label-semantic fallback', () => {
  const base = {
    department: 'women',
    category: 'women-dresses',
    taxonomy_gate_v2: 'REMAP',
    provider: 'TEST',
    item_id: 'dress-1',
    title: 'Elegant Evening Dress',
    availability_verified: true,
    inventory_snapshot: 5,
    production_exposure: false,
    sell_state: 'SHADOW_QA_PROFIT_REVIEW',
    image_technical_status: 'PASS',
    image_url: 'https://example.test/dress.jpg',
    market5_all_pass: true,
    candidate_status: 'MARKET5_READY_STYLE_PHYSICAL_PENDING',
    profit_truth: {
      status: 'PROFIT_REVIEW',
      final_profit_verified: false,
      projected_product_contribution_usd: 5
    }
  };
  assert.equal(isEligible('women/women-dresses', base), true);
  assert.equal(isEligible('women/women-dresses', { ...base, title: 'Protective Phone Case' }), false);
});

test('the reviewed V2 supplement sequence is kept, and BOOM only reorders it', () => {
  const route = 'women/women-evening';
  const sourceIds = supplement.shelves[route].filter(p => isEligible(route, p)).map(p => `${p.provider}:${p.item_id}`);
  const actualIds = index.byRoute.get(route).map(p => `${p.provider}:${p.item_id}`);
  assert.deepEqual(actualIds.slice(0, sourceIds.length), sourceIds);
  const original = index.byRoute.get(route);
  const ranked = rankWithinRoute(original, ['dress']);
  assert.deepEqual(new Set(ranked), new Set(original));
  assert.ok(ranked.every(p => p.canonical_route === route));
});

test('the preview uses the linked original Full Shelves CSS and only the existing V2 product source', () => {
  const html = readFileSync(new URL('./boom-hunt-full-shelves-shadow-v1.html', import.meta.url), 'utf8');
  const originalCss = html.split('<style>')[1].split('</style>')[0];
  const previewCss = readFileSync(new URL('./hunt-cinematic-first-exact.css', import.meta.url), 'utf8');
  const script = readFileSync(new URL('./hunt-cinematic-first-exact.js', import.meta.url), 'utf8');
  assert.ok(previewCss.startsWith('/* Original Full Shelves · Cinematic styling from boom-hunt-full-shelves-shadow-v1.html (7987eb5). */\n' + originalCss));
  assert.match(script, /TAXONOMY-PROFIT-V2-PREVIEW-SUPPLEMENT/);
  assert.doesNotMatch(script, /READONLY-SNAPSHOT/);
  assert.doesNotMatch(script, /catalog-home|FULL-SHELVES-STYLIST-SHADOW|city-frame|city-hero/i);
});
