import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const taxonomySource = fs.readFileSync(new URL('../canonical-taxonomy.js', import.meta.url), 'utf8');

const EXPECTED_CANONICAL_SHELVES = {
  'women-dresses': 'women',
  'women-tops': 'women',
  'women-bottoms': 'women',
  'women-jumpsuits': 'women',
  'women-loungewear': 'women',
  'women-maternity': 'women',
  'women-nightwear': 'women',
  'women-occasionwear': 'women',
  'women-tailoring': 'women',
  'women-underwear': 'women',

  'men-tops': 'men',
  'men-shirts': 'men',
  'men-bottoms': 'men',
  'men-jeans': 'men',
  'men-shorts': 'men',
  'men-loungewear': 'men',
  'men-nightwear': 'men',
  'men-swimwear': 'men',
  'men-tailoring': 'men',
  'men-underwear': 'men',

  'kids-underwear': 'kids',
  'kids-nightwear': 'kids',
  'kids-occasionwear': 'kids',
  'kids-schoolwear': 'kids',
  'kids-swimwear': 'kids',
  boys: 'kids',
  girls: 'kids',

  baby: 'baby',
  'baby-bedding': 'baby',
  'baby-bodysuits': 'baby',
  'baby-sets': 'baby',
  'baby-sleepsuits': 'baby',
  newborn: 'baby',
  nursery: 'baby',

  'curtains-blinds': 'home',
  'cushions-throws': 'home',
  dinnerware: 'home',
  furniture: 'home',
  garden: 'home',
  glassware: 'home',
  'home-decor': 'home',
  laundry: 'home',
  mirrors: 'home',
  'rugs-runners': 'home',
  tableware: 'home',
  towels: 'home',
  'wall-art': 'home',

  'sports-outdoor': 'sports',
  'tech-accessories': 'tech',
  'wallets-small-accessories': 'accessories'
};

function loadCanonicalTaxonomy() {
  const HuntCore = {
    categoryDefs: {},
    categoryGroups: [],
    categoryUrl: slug => `category.html?c=${encodeURIComponent(slug)}`,
    storefront: async () => ({ shelves: {} })
  };

  const sandbox = {
    window: { HuntCore },
    URL,
    location: { href: 'https://hunt.test/category.html?c=women' },
    history: { state: null, replaceState() {} },
    setTimeout() {}
  };

  vm.runInNewContext(taxonomySource, sandbox, { filename: 'canonical-taxonomy.js' });
  return HuntCore;
}

test('canonical taxonomy contains exactly the approved 50 shelves', () => {
  assert.equal(Object.keys(EXPECTED_CANONICAL_SHELVES).length, 50, 'test contract must contain exactly 50 canonical shelves');

  const { categoryDefs } = loadCanonicalTaxonomy();
  const actual = Object.keys(categoryDefs).sort();
  const expected = Object.keys(EXPECTED_CANONICAL_SHELVES).sort();

  assert.equal(actual.length, 50, `expected exactly 50 canonical shelves, found ${actual.length}`);
  assert.deepEqual(actual, expected, 'canonical shelf set drifted from the approved 50-shelf contract');
});

test('every canonical shelf is unique and mapped to the approved department', () => {
  const { categoryDefs } = loadCanonicalTaxonomy();
  const keys = Object.keys(categoryDefs);

  assert.equal(new Set(keys).size, keys.length, 'canonical shelf slugs must be unique');

  for (const [shelf, parent] of Object.entries(EXPECTED_CANONICAL_SHELVES)) {
    const entry = categoryDefs[shelf];
    assert.ok(entry, `missing canonical shelf ${shelf}`);
    assert.equal(entry.canonical, true, `${shelf} must remain canonical`);
    assert.equal(entry.parent, parent, `${shelf} must remain mapped to ${parent}`);
    assert.ok(String(entry.title || '').trim(), `${shelf} must keep a customer-facing title`);
  }
});

test('canonical shelf URLs preserve department hierarchy and exact-shelf routing', () => {
  const HuntCore = loadCanonicalTaxonomy();

  for (const [shelf, parent] of Object.entries(EXPECTED_CANONICAL_SHELVES)) {
    const expectedUrl = parent === shelf
      ? `category.html?c=${encodeURIComponent(shelf)}`
      : `category.html?c=${encodeURIComponent(parent)}&sub=${encodeURIComponent(shelf)}`;

    assert.equal(HuntCore.categoryUrl(shelf), expectedUrl, `${shelf} route must preserve canonical hierarchy`);
  }
});
