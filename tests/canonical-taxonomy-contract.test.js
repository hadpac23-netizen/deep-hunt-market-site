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
  const canonical = fs.readFileSync(new URL('../canonical-taxonomy.js', import.meta.url),'utf8');
  const home = fs.readFileSync(new URL('../hunt-deal.js', import.meta.url),'utf8');
  const html = fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');
  assert.match(canonical,/H\.canonicalTaxonomy\s*=\s*Object\.freeze/);
  assert.match(canonical,/version:"canonical50-v4"/);
  assert.ok(html.indexOf('canonical-taxonomy.js?v=canon4') < html.indexOf('hunt-deal.js?v=stable4'));
  assert.doesNotMatch(home,/const shelfMeta\s*=\s*\{/);
  assert.doesNotMatch(home,/const shelfDepartments\s*=\s*\[/);
  assert.doesNotMatch(home,/function isWomenShelfItem/);
  assert.match(home,/function normalizeCanonicalShelfData\(data\)/);
  assert.match(home,/function canonicalDepartments\(\)/);
  assert.match(home,/item\?\._hunt_canonical_shelf/);
});

test('Home legacy slugs come only from shared canonical compatibility aliases and cannot create Kids Socks shelf 51', () => {
  const canonical = fs.readFileSync(new URL('../canonical-taxonomy.js', import.meta.url),'utf8');
  const home = fs.readFileSync(new URL('../hunt-deal.js', import.meta.url),'utf8');
  assert.match(home,/canonicalTaxonomy\?\.legacyAliases/);
  assert.doesNotMatch(home,/const legacyShelfAliases = Object\.freeze\(\{/);
  assert.match(canonical,/dresses:"women-dresses"/);
  assert.match(canonical,/sleepwear:"women-nightwear"/);
  assert.match(canonical,/womenunderwear:"women-underwear"/);
  assert.match(canonical,/menunderwear:"men-underwear"/);
  assert.match(canonical,/suits:"men-tailoring"/);
  assert.doesNotMatch(canonical,/socks:"/);
});


test('canonical taxonomy owns the conservative runtime source bridge', () => {
  const HuntCore = loadCanonicalTaxonomy();
  const aliases = HuntCore.canonicalTaxonomy.sourceAliases;
  assert.equal(aliases['women-dresses'], 'dresses');
  assert.equal(aliases['women-tops'], 'tops');
  assert.equal(aliases['women-underwear'], 'womenunderwear');
  assert.equal(aliases['men-underwear'], 'menunderwear');
  assert.equal(aliases['men-tailoring'], 'suits');
  assert.equal(aliases['wall-art'], 'wallart');
  assert.equal(aliases['kids-schoolwear'], undefined, 'unsafe broad aliases must stay absent');
  assert.equal(aliases['women-occasionwear'], undefined, 'occasionwear must not silently reuse dresses');
});

test('Category resolves canonical exact shelves through the shared source bridge and fails closed', () => {
  const category = fs.readFileSync(new URL('../category.js', import.meta.url),'utf8');
  const html = fs.readFileSync(new URL('../category.html', import.meta.url),'utf8');
  assert.match(category,/canonicalSourceAlias = shelf => H\.canonicalTaxonomy\?\.sourceAliases/);
  assert.match(category,/const sourceSlug = exactCanonicalShelf \? canonicalSourceAlias\(exactCanonicalShelf\)/);
  assert.match(category,/if \(exactCanonicalShelf\) \{[\s\S]*applyRows\(\[\], "exact-source-empty"\)/);
  assert.doesNotMatch(category,/exactCanonicalShelf[\s\S]{0,200}H\.search\(subDef/);
  assert.match(html,/canonical-taxonomy\.js\?v=canon4/);
  assert.match(html,/category\.js\?v=redteam3/);
});



test('shared canonical matcher rejects cross-category and cross-demographic Home contamination', () => {
  const HuntCore = loadCanonicalTaxonomy();
  const match = HuntCore.canonicalTaxonomy.itemMatchesShelf;
  assert.equal(match('women-dresses',{title:"Elegant Women's Long Sleeve Midi Dress",gender:'women'}),true);
  assert.equal(match('women-dresses',{title:'Heavy Duty Garment Rack for Dresses and Coats'}),false);
  assert.equal(match('women-dresses',{title:"2pcs Dress Suit for Women Top and Pleated Skirt",gender:'women'}),false);
  assert.equal(match('women-tops',{title:'Kitchen Trash Can with Touch Top Lid'}),false);
  assert.equal(match('women-tops',{title:"Women's Pleated Chiffon Blouse",gender:'women'}),true);
  assert.equal(match('women-bottoms',{title:'Two Piece Dinosaur Vest Shorts for Boys'}),false);
  assert.equal(match('women-bottoms',{title:"Women's High Waist Straight Leg Pants",gender:'women'}),true);
  assert.equal(match('women-bottoms',{title:"Men's Casual Trousers",gender:'men'}),false);
  assert.equal(match('women-bottoms',{title:"Women's Yoga Jumpsuit Shorts",gender:'women'}),false);
  assert.equal(match('women-tops',{title:"Women's Top and Pants Two Piece Outfit Set",gender:'women'}),false);
  assert.equal(match('wall-art',{title:'Colorful Wall Art (TikTok, temu pick-up service)'}),false);
  assert.equal(match('men-underwear',{title:"Men's Cotton Boxer Briefs",gender:'men'}),true);
  assert.equal(match('men-underwear',{title:"Women's Seamless Briefs",gender:'women'}),false);
});

test('Category browser script parses and canonical Dresses excludes swimwear false positives', () => {
  const category = fs.readFileSync(new URL('../category.js', import.meta.url),'utf8');
  assert.doesNotThrow(()=>new Function(category));
  assert.match(category,/exactShelf==="women-dresses"/);
  assert.match(category,/swimsuit\|swimwear\|bikini\|rash guard/);
});
