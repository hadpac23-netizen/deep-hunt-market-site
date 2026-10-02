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

function declaredCanonicalSlugs() {
  const block = taxonomySource.match(/const\s+canonicalDefs\s*=\s*\{([\s\S]*?)\n\s*\};/);
  assert.ok(block, 'canonicalDefs source block must exist');
  return [...block[1].matchAll(/^\s*"([^"]+)"\s*:\s*def\(/gm)].map(match => match[1]);
}

test('canonical taxonomy declares exactly the approved 50 shelves with no duplicate slugs', () => {
  const expected = Object.keys(EXPECTED_CANONICAL_SHELVES).sort();
  const declared = declaredCanonicalSlugs();

  assert.equal(expected.length, 50, 'test contract must contain exactly 50 canonical shelves');
  assert.equal(declared.length, 50, `expected exactly 50 canonical declarations, found ${declared.length}`);
  assert.equal(new Set(declared).size, declared.length, 'canonical shelf declarations must not contain duplicate slugs');
  assert.deepEqual([...declared].sort(), expected, 'canonical declarations drifted from the approved 50-shelf contract');
});

test('runtime canonical taxonomy contains exactly the approved 50 shelves', () => {
  const { categoryDefs } = loadCanonicalTaxonomy();
  const actual = Object.keys(categoryDefs).sort();
  const expected = Object.keys(EXPECTED_CANONICAL_SHELVES).sort();

  assert.equal(actual.length, 50, `expected exactly 50 runtime canonical shelves, found ${actual.length}`);
  assert.deepEqual(actual, expected, 'runtime canonical shelf set drifted from the approved 50-shelf contract');
});

test('every canonical shelf is mapped to the approved department', () => {
  const { categoryDefs } = loadCanonicalTaxonomy();

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

test('Home consumes the exported canonical taxonomy instead of a legacy shelf universe', () => {
  const canonical = fs.readFileSync(path.resolve(__dirname,'../canonical-taxonomy.js'),'utf8');
  const home = fs.readFileSync(path.resolve(__dirname,'../hunt-deal.js'),'utf8');
  const html = fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
  assert.match(canonical,/H\.canonicalTaxonomy\s*=\s*Object\.freeze/);
  assert.match(canonical,/version:"canonical50-v2"/);
  assert.ok(html.indexOf('canonical-taxonomy.js?v=canon2') < html.indexOf('hunt-deal.js?v=stable3'));
  assert.doesNotMatch(home,/const shelfMeta\s*=\s*\{/);
  assert.doesNotMatch(home,/const shelfDepartments\s*=\s*\[/);
  assert.doesNotMatch(home,/function isWomenShelfItem/);
  assert.match(home,/function normalizeCanonicalShelfData\(data\)/);
  assert.match(home,/function canonicalDepartments\(\)/);
  assert.match(home,/item\?\._hunt_canonical_shelf/);
});

test('Home legacy slugs are compatibility aliases only and cannot create Kids Socks shelf 51', () => {
  const home = fs.readFileSync(path.resolve(__dirname,'../hunt-deal.js'),'utf8');
  assert.match(home,/dresses:"women-dresses"/);
  assert.match(home,/sleepwear:"women-nightwear"/);
  assert.match(home,/womenunderwear:"women-underwear"/);
  assert.match(home,/menunderwear:"men-underwear"/);
  assert.match(home,/suits:"men-tailoring"/);
  assert.doesNotMatch(home,/socks:"/);
});
