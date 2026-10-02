import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const taxonomy = fs.readFileSync(new URL('../canonical-taxonomy.js', import.meta.url), 'utf8');
const categoryHtml = fs.readFileSync(new URL('../category.html', import.meta.url), 'utf8');

test('category page loads canonical taxonomy before category runtime', () => {
  const taxonomyPos = categoryHtml.indexOf('canonical-taxonomy.js');
  const categoryPos = categoryHtml.indexOf('category.js');
  assert.ok(taxonomyPos > -1, 'canonical taxonomy script must be loaded');
  assert.ok(categoryPos > taxonomyPos, 'canonical taxonomy must load before category.js');
});

test('launch-critical canonical apparel shelves are routed', () => {
  for (const shelf of [
    'women-underwear','women-tops','women-bottoms','women-nightwear',
    'men-underwear','men-tops','men-bottoms','men-nightwear','men-swimwear',
    'kids-underwear','kids-nightwear','kids-swimwear'
  ]) {
    assert.match(taxonomy, new RegExp(`\\"${shelf}\\"`), `missing canonical route for ${shelf}`);
  }
});

test('canonical routes preserve department hierarchy while loading exact shelf', () => {
  assert.match(taxonomy, /entry\.canonical\s*&&\s*entry\.parent/);
  assert.match(taxonomy, /searchParams\.set\(\"c\", requestedSub\)/);
  assert.match(taxonomy, /searchParams\.delete\(\"sub\"\)/);
  assert.match(taxonomy, /history\.replaceState/);
});

test('women and men exact shelves receive canonical gender scope', () => {
  assert.match(taxonomy, /shelf\.startsWith\(\"women-\"\)\s*\?\s*\"women\"/);
  assert.match(taxonomy, /shelf\.startsWith\(\"men-\"\)\s*\?\s*\"men\"/);
});
