import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEPARTMENTS, buildIndex, isEligible, rankWithinRoute, resolveSelection } from './hunt-cinematic-original-taxonomy.mjs';

const fixture = JSON.parse(readFileSync(new URL('./evidence/HUNT-TAXONOMY-PROFIT-V2-PREVIEW-SUPPLEMENT-2026-09-27.json', import.meta.url)));
const index = buildIndex(fixture);

test('department/category/shelf selection is exact and never crosses departments', () => {
  assert.equal(DEPARTMENTS.length, 17);
  const selection = resolveSelection('women', 'dresses');
  assert.equal(selection.route, 'women/women-dresses');
  assert.equal(index.byRoute.get(selection.route)?.length || 0, 0);
  assert.equal(resolveSelection('gifts', 'decor').route, 'gifts/gift-decor');
  assert.equal(resolveSelection('women', 'dresses', 'pet-beds').route, 'women/women-dresses');
  assert.equal(resolveSelection('men', 'dresses').category, null);
  const uniqueRoutes = DEPARTMENTS.flatMap(d => d.categories.flatMap(c => c.shelves.map(s => `${d.slug}/${s.slug}`)));
  assert.equal(new Set(uniqueRoutes).size, uniqueRoutes.length);
});

test('only clean V2 image, inventory, safety and profit-review candidates enter exact routes', () => {
  assert.equal(index.stats.source, fixture.total_products);
  assert.ok(index.stats.accepted > 0);
  assert.ok(index.stats.excluded > 0);
  for (const [route, products] of index.byRoute) {
    for (const product of products) {
      assert.equal(product.canonical_route, route);
      assert.equal(`${product.department}/${product.category}`, route);
      assert.equal(product.image_technical_status, 'PASS');
      assert.equal(product.market5_all_pass, true);
      assert.equal(product.profit_truth.status, 'PROFIT_REVIEW');
      assert.equal(product.production_exposure, false);
      assert.ok(product.inventory_snapshot > 0);
    }
  }
  const original = fixture.shelves['women/women-evening'][0];
  assert.equal(isEligible('women/women-dresses', original), false);
  assert.equal(isEligible('women/women-evening', { ...original, image_technical_status: 'HOLD' }), false);
  assert.equal(isEligible('women/women-evening', { ...original, market5_all_pass: false }), false);
  assert.equal(isEligible('women/women-evening', { ...original, inventory_snapshot: 0 }), false);
  assert.equal(isEligible('women/women-evening', { ...original, profit_truth: { status: 'PASS', final_profit_verified: true } }), false);
  assert.throws(() => buildIndex({ ...fixture, version: 'LEGACY_CATALOG_HOME' }));
});

test('Gifts has no accessory products and BOOM can only reorder its input route', () => {
  assert.ok(!DEPARTMENTS.find(d => d.slug === 'gifts').categories.some(c => c.id === 'accessories'));
  assert.equal(index.byRoute.get('gifts/party')?.length || 0, 0);
  assert.equal(index.byRoute.get('home/curtains-blinds')?.length || 0, 0);
  assert.equal(index.byRoute.get('pets/pet-clothing')?.length || 0, 0);
  const necklace = fixture.shelves['accessories/jewelry-necklaces'][0];
  assert.equal(isEligible('gifts/gift-decor', { ...necklace, department: 'gifts', category: 'gift-decor', image_technical_status: 'PASS' }), false);
  const costume = fixture.shelves['gifts/party'][0];
  assert.equal(isEligible('gifts/party', costume), false);
  assert.ok((index.byRoute.get('men/men-bottoms') || []).length > 0);
  const titles = [...index.byRoute.values()].flat().map(p => `${p.canonical_route}:${p.title.toLowerCase().replace(/\s+/g, ' ').trim()}`);
  assert.equal(new Set(titles).size, titles.length);
  const route = 'women/women-evening';
  const products = index.byRoute.get(route) || [];
  const ranked = rankWithinRoute(products, ['black']);
  assert.deepEqual(new Set(ranked.map(p => p.item_id)), new Set(products.map(p => p.item_id)));
  assert.ok(ranked.every(p => p.canonical_route === route));
});
