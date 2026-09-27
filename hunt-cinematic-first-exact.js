import { DEPARTMENTS, buildIndex, resolveSelection, rankWithinRoute } from './hunt-cinematic-first-taxonomy.mjs';

const LIVE_SHADOW_SOURCE = 'https://zszlnahjqmwozwubetkm.supabase.co/functions/v1/hunt-cinematic-shadow-catalog';
const LIVE_SHADOW_KEY = 'sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X';
const V2_SOURCE = './evidence/HUNT-TAXONOMY-PROFIT-V2-PREVIEW-SUPPLEMENT-2026-09-27.json';
let sourceMode = 'loading';
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const relatedWorlds = {
  women: ['accessories', 'beauty'], men: ['accessories', 'sports'], kids: ['toys', 'home'],
  gifts: ['accessories', 'home'], accessories: ['women', 'men'], home: ['kitchen', 'garden'],
  tech: ['electrical', 'office'], pets: ['home'], travel: ['accessories']
};

const DEPARTMENT_NAV_GROUPS = {
  women: [
    { title: 'Clothing', categories: ['women-dresses','women-tops','women-jeans','women-bottoms','women-skirts','women-knitwear','women-hoodies','women-outerwear','women-suits'] },
    { title: 'Lingerie & Sleep', categories: ['women-underwear','women-sleepwear','women-socks'] },
    { title: 'Shoes', categories: ['women-shoes'] },
    { title: 'Swim', categories: ['women-swim'] },
    { title: 'Occasion', categories: ['women-evening'] }
  ],
  men: [
    { title: 'Clothing', categories: ['men-tops','men-shirts','men-jeans','men-bottoms','men-knitwear','men-hoodies','men-outerwear','men-suits'] },
    { title: 'Underwear & Basics', categories: ['men-boxers','men-underwear','men-socks'] },
    { title: 'Shoes & Bags', categories: ['men-shoes','men-bags'] },
    { title: 'Accessories', categories: ['men-accessories'] }
  ],
  kids: [
    { title: 'Kids', categories: ['kids-clothing','kids-shoes','kids-accessories'] },
    { title: 'Baby Clothing', categories: ['baby-clothing','baby-sets','baby-sleepsuits'] },
    { title: 'Baby Essentials', categories: ['baby','baby-bedding'] }
  ],
  accessories: [
    { title: 'Jewelry', categories: ['jewelry-necklaces','jewelry-rings','jewelry-earrings','jewelry-bracelets','jewelry'] },
    { title: 'Bags & Small Accessories', categories: ['bags','bag-accessories','keychains'] },
    { title: 'Wear', categories: ['watches','sunglasses','belts','hats','scarves','gloves'] },
    { title: 'Hair & Basics', categories: ['hair-accessories','socks'] }
  ],
  tech: [
    { title: 'Phone Essentials', categories: ['phone-cases','chargers-cables','power-banks','stands-holders'] },
    { title: 'Audio & Wearables', categories: ['audio','wearables','wearable-accessories'] },
    { title: 'Devices & Home', categories: ['cameras','smart-home','electronics'] },
    { title: 'Computer & Gaming', categories: ['computer-accessories','gaming'] }
  ],
  home: [
    { title: 'Decor', categories: ['home-decor','wall-decor','mirrors','rugs','cushions-throws'] },
    { title: 'Textiles & Windows', categories: ['bedding','home-textiles','towels','curtains','curtains-blinds'] },
    { title: 'Storage & Furniture', categories: ['home-storage','storage','furniture','entryway'] },
    { title: 'Care & Utility', categories: ['bath','cleaning','laundry','tools-diy','lighting'] }
  ],
  pets: [
    { title: 'Everyday', categories: ['pet-accessories','pet-feeding','pet-walk'] },
    { title: 'Play & Care', categories: ['pet-toys','pet-grooming'] },
    { title: 'Comfort', categories: ['pet-clothing','pet-beds','pet-houses'] },
    { title: 'Aquarium', categories: ['aquarium'] }
  ],
  sports: [
    { title: 'Training', categories: ['fitness','fitness-accessories','activewear','active-bottoms'] },
    { title: 'Outdoor & Cycling', categories: ['outdoors','cycling'] },
    { title: 'Gear & Bags', categories: ['sports-gear','sports-bags'] }
  ]
};

const SHELF_SEGMENTS = {
  'women/women-underwear': [
    { id:'bras', label:'Bras', include:/\b(?:bra|bralette)\b/i },
    { id:'briefs', label:'Briefs & Knickers', include:/\b(?:briefs?|knickers?|panties|brazilian)\b/i },
    { id:'thongs', label:'Thongs', include:/\bthongs?\b/i },
    { id:'sets', label:'Lingerie Sets', include:/\b(?:lingerie|underwear)\b.*\bset\b|\bset\b.*\b(?:lingerie|underwear)\b/i },
    { id:'shapewear', label:'Shapewear', include:/\b(?:shapewear|shaping|control brief|body shaper)\b/i },
    { id:'bodysuits', label:'Bodysuits', include:/\b(?:bodysuit|body suit|body)\b/i },
    { id:'sports-bras', label:'Sports Bras', include:/\b(?:sports bra|sport bra|fitness bra|yoga bra|running bra)\b/i },
    { id:'maternity-nursing', label:'Maternity & Nursing', include:/\b(?:nursing|breastfeeding|maternity|pregnancy)\b.*\bbra\b|\bbra\b.*\b(?:nursing|breastfeeding|maternity|pregnancy)\b/i }
  ],
  'women/women-sleepwear': [
    { id:'pajamas', label:'Pajamas', include:/\b(?:pajamas?|pyjamas?|pjs?)\b/i },
    { id:'nightwear', label:'Nightwear', include:/\b(?:nightdress|nightgown|night gown|nightwear|chemise)\b/i },
    { id:'robes', label:'Robes & Dressing Gowns', include:/\b(?:robe|robes|dressing gown|bathrobe)\b/i },
    { id:'sleep-sets', label:'Sleep Sets', include:/\b(?:sleepwear|pajama|pyjama)\b.*\bset\b|\bset\b.*\b(?:sleepwear|pajama|pyjama)\b/i }
  ],
  'women/women-shoes': [
    { id:'trainers', label:'Sneakers & Trainers', include:/\b(?:sneakers?|trainers?|running shoes?)\b/i },
    { id:'heels', label:'Heels', include:/\b(?:heels?|stiletto|pumps?)\b/i },
    { id:'sandals', label:'Sandals', include:/\bsandals?\b/i },
    { id:'boots', label:'Boots', include:/\bboots?\b/i },
    { id:'flats', label:'Flats & Loafers', include:/\b(?:flats?|loafers?|ballet|mary jane)\b/i },
    { id:'slippers', label:'Slippers', include:/\bslippers?\b/i }
  ],
  'women/women-swim': [
    { id:'bikinis', label:'Bikinis', include:/\b(?:bikini|two-piece swimsuit|two piece swimsuit)\b/i },
    { id:'one-piece', label:'One-Piece', include:/\b(?:one-piece|one piece|swimsuit)\b/i },
    { id:'cover-ups', label:'Cover-Ups', include:/\b(?:cover-up|cover up|beach dress|sarong)\b/i }
  ],
  'women/women-dresses': [
    { id:'mini', label:'Mini', include:/\bmini\b/i },
    { id:'midi', label:'Midi', include:/\bmidi\b/i },
    { id:'maxi', label:'Maxi', include:/\bmaxi\b/i }
  ]
};
const query = new URLSearchParams(location.search);
const starting = resolveSelection(query.get('dept'), query.get('category'), query.get('shelf'));
const state = { department: starting.department.slug, category: starting.category?.id || null,
  shelf: starting.shelf?.slug || null, segment: query.get('segment') || null,
  visible: 24, preference: '', activeProductKey: query.get('product') || null };
let index = null;
let sourceError = null;
let lastWorldFocus = null;

const PROFILE_KEY = 'hunt_cinematic_preview_profile_v1';
const profile = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
    return {
      terms: Array.isArray(saved.terms) ? saved.terms.slice(-40) : [],
      departments: saved.departments && typeof saved.departments === 'object' ? saved.departments : {},
      routes: saved.routes && typeof saved.routes === 'object' ? saved.routes : {}
    };
  } catch {
    return { terms: [], departments: {}, routes: {} };
  }
})();

function theme(next) {
  document.documentElement.dataset.huntTheme = next;
  $('#theme').textContent = next === 'dark' ? 'Light' : 'Dark';
  $('#theme').setAttribute('aria-label', `Switch to ${next === 'dark' ? 'light' : 'dark'} mode`);
  updateUrl();
}

function updateUrl() {
  const url = new URL(location.href);
  ['dept', 'category', 'shelf', 'segment', 'theme', 'product'].forEach(key => url.searchParams.delete(key));
  url.searchParams.set('dept', state.department);
  if (state.category) url.searchParams.set('category', state.category);
  if (state.shelf) url.searchParams.set('shelf', state.shelf);
  if (state.segment) url.searchParams.set('segment', state.segment);
  url.searchParams.set('theme', document.documentElement.dataset.huntTheme);
  if (state.activeProductKey) url.searchParams.set('product', state.activeProductKey);
  history.replaceState(null, '', url.pathname + url.search);
}

function routeProducts(route) { return index?.byRoute.get(route) || []; }
function segmentDefinition(route, segmentId) {
  return (SHELF_SEGMENTS[route] || []).find(segment => segment.id === segmentId) || null;
}
function productsForSegment(route, products, segmentId) {
  const segment = segmentDefinition(route, segmentId);
  if (!segment) return products;
  return products.filter(product => segment.include.test(String(product.title || '')));
}
function validSegmentForRoute(route, segmentId) {
  return !!segmentDefinition(route, segmentId);
}
function departmentProducts(department) {
  return department.categories.flatMap(category => category.shelves.flatMap(shelf => routeProducts(`${department.slug}/${shelf.slug}`)));
}

function routeSelection(route) {
  const [departmentSlug, shelfSlug] = String(route || '').split('/');
  const department = DEPARTMENTS.find(item => item.slug === departmentSlug);
  if (!department) return null;
  for (const category of department.categories) {
    const shelf = category.shelves.find(item => item.slug === shelfSlug);
    if (shelf) return { department, category, shelf };
  }
  return null;
}

function productKey(product) { return `${product.provider}:${product.item_id}`; }
function huntPrice(product) {
  const value = Number(product?.profit_truth?.target_retail_usd);
  return Number.isFinite(value) && value > 0 ? value : null;
}
function huntMoney(product) {
  const value = huntPrice(product);
  return value == null ? '' : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
}
function productDepartment(product) { return String(product.canonical_route || '').split('/')[0] || product.department || ''; }
function semanticWords(value) {
  const stop = new Set(['with','from','this','that','your','women','woman','mens','men','kids','baby','the','and','for','set','new']);
  return [...new Set(String(value || '').toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 3 && !stop.has(word)))];
}
function allProducts() {
  return index ? [...index.byRoute.values()].flat() : [];
}
function productByKey(key) {
  return allProducts().find(product => productKey(product) === key) || null;
}
function persistProfile() {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
}
function recordInterest(product) {
  if (!product) return;
  const dept = productDepartment(product);
  const route = product.canonical_route;
  profile.terms.push(...semanticWords(product.title).slice(0, 6));
  profile.terms = profile.terms.slice(-40);
  profile.departments[dept] = (profile.departments[dept] || 0) + 1;
  profile.routes[route] = (profile.routes[route] || 0) + 1;
  persistProfile();
}
function similarityScore(product, anchor) {
  if (!product || !anchor) return 0;
  const words = new Set(semanticWords(product.title));
  const anchorWords = semanticWords(anchor.title);
  let score = anchorWords.reduce((sum, word) => sum + (words.has(word) ? 4 : 0), 0);
  if (productDepartment(product) === productDepartment(anchor)) score += 3;
  if (product.canonical_route === anchor.canonical_route) score += 7;
  return score;
}
function personalizationScore(product, anchor) {
  const words = new Set(semanticWords(product.title));
  let score = similarityScore(product, anchor);
  profile.terms.forEach((word, i) => { if (words.has(word)) score += 1 + i / Math.max(1, profile.terms.length); });
  score += (profile.departments[productDepartment(product)] || 0) * 1.2;
  score += (profile.routes[product.canonical_route] || 0) * 2.2;
  return score;
}
function uniqueRanked(products, scoreFn, limit = 24, excluded = new Set()) {
  const seen = new Set(excluded);
  return products.map((product, position) => ({ product, position, score: scoreFn(product) }))
    .sort((a, b) => b.score - a.score || a.position - b.position)
    .filter(({ product }) => {
      const key = productKey(product);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, limit).map(({ product }) => product);
}

function card(product, preferenceButton = false) {
  const key = productKey(product);
  return `<article class="card ${state.activeProductKey === key ? 'is-selected' : ''}" data-route="${esc(product.canonical_route)}" data-product-key="${esc(key)}">
    <div class="media"><img src="${esc(product.image_url)}" alt="${esc(product.title)}" loading="lazy"></div>
    <div class="card-body"><div class="badges"><span class="badge truth">HUNT VERIFIED</span></div>
      <h3>${esc(product.title)}</h3>
      <div class="hunt-price">${huntMoney(product) || 'Price finalizing'}</div>
      <p>${esc(product.canonical_route)} · verified stock snapshot</p>
      <p class="gate-line">Image PASS · Profit REVIEW · checkout OFF</p>
      <div class="card-actions">
        <button type="button" class="open-product" data-open-product="${esc(key)}" aria-label="Open ${esc(product.title)}">Open product</button>
        ${preferenceButton ? `<button type="button" class="prefer" data-prefer="${esc(key)}">Use as style preference</button>` : ''}
      </div>
    </div>
  </article>`;
}

function navigation(selection) {
  const d = selection.department;
  $('#dept-nav').innerHTML = DEPARTMENTS.map(dept => `<button type="button" data-dept="${dept.slug}" class="${dept === d ? 'active' : ''}" aria-pressed="${dept === d}" ${dept === d ? 'aria-current="true"' : ''}>${esc(dept.title)}</button>`).join('');
  $('#all-departments-grid').innerHTML = DEPARTMENTS.map(dept => {
    const count = departmentProducts(dept).length;
    return `<button type="button" data-dept-panel="${dept.slug}" class="${dept === d ? 'active' : ''}" ${dept === d ? 'aria-current="true"' : ''}>${esc(dept.title)}<small>${dept.categories.length} categories · ${count} gated</small></button>`;
  }).join('');
  const grouped = DEPARTMENT_NAV_GROUPS[d.slug];
  $('#category-index').classList.toggle('grouped', !!grouped);
  if (grouped) {
    const byId = new Map(d.categories.map(category => [category.id, category]));
    $('#category-index').innerHTML = grouped.map(group => {
      const buttons = group.categories.map(id => byId.get(id)).filter(Boolean).map(category => {
        const count = category.shelves.reduce((total, shelf) => total + routeProducts(`${d.slug}/${shelf.slug}`).length, 0);
        return `<button type="button" class="cat-chip ${category === selection.category ? 'active' : ''}" data-category="${category.id}" aria-pressed="${category === selection.category}" ${category === selection.category ? 'aria-current="true"' : ''}>${esc(category.title)}<span>${count}</span></button>`;
      }).join('');
      return `<section class="category-group" aria-label="${esc(group.title)}"><strong>${esc(group.title)}</strong><div class="category-group-buttons">${buttons}</div></section>`;
    }).join('') + (d.slug === 'women' ? `<section class="category-group category-group-related" aria-label="Complete the look"><strong>Complete the look</strong><div class="category-group-buttons"><button type="button" class="cat-chip world-chip" data-nav-world="accessories">Accessories & Jewelry</button><button type="button" class="cat-chip world-chip" data-nav-world="beauty">Beauty</button></div></section>` : '');
  } else {
    $('#category-index').innerHTML = d.categories.map(category => {
      const count = category.shelves.reduce((total, shelf) => total + routeProducts(`${d.slug}/${shelf.slug}`).length, 0);
      return `<button type="button" class="cat-chip ${category === selection.category ? 'active' : ''}" data-category="${category.id}" aria-pressed="${category === selection.category}" ${category === selection.category ? 'aria-current="true"' : ''}>${esc(category.title)} · ${count}</button>`;
    }).join('');
  }
  $('#shelf-drawer').hidden = !selection.category;
  if (selection.category) {
    $('#drawer-title').textContent = `${d.title} / ${selection.category.title}`;
    $('#shelf-buttons').innerHTML = selection.category.shelves.map(shelf => {
      const count = routeProducts(`${d.slug}/${shelf.slug}`).length;
      return `<button type="button" data-shelf="${shelf.slug}" class="${shelf === selection.shelf ? 'active' : ''}" aria-pressed="${shelf === selection.shelf}" ${shelf === selection.shelf ? 'aria-current="true"' : ''}>${esc(shelf.label)}<span>${count}</span></button>`;
    }).join('');
    const segments = selection.route ? (SHELF_SEGMENTS[selection.route] || []) : [];
    const segmentWrap = $('#segment-wrap');
    segmentWrap.hidden = segments.length === 0;
    if (segments.length) {
      const routeItems = routeProducts(selection.route);
      if (state.segment && !validSegmentForRoute(selection.route, state.segment)) state.segment = null;
      $('#segment-buttons').innerHTML = [
        `<button type="button" data-segment="" class="${!state.segment ? 'active' : ''}" aria-pressed="${!state.segment}">All <span>${routeItems.length}</span></button>`,
        ...segments.map(segment => {
          const count = productsForSegment(selection.route, routeItems, segment.id).length;
          const active = state.segment === segment.id;
          return `<button type="button" data-segment="${segment.id}" class="${active ? 'active' : ''}" aria-pressed="${active}" ${count === 0 ? 'disabled aria-disabled="true"' : ''}>${esc(segment.label)} <span>${count}</span></button>`;
        })
      ].join('');
    }
  } else {
    $('#segment-wrap').hidden = true;
    state.segment = null;
  }
  const active = $('#dept-nav .active');
  active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function hero(selection, products) {
  const d = selection.department;
  const exact = !!selection.shelf;
  const first = exact ? products[0] : departmentProducts(d)[0];
  $('#title').textContent = exact ? selection.category.title : d.title;
  $('#eyebrow').textContent = exact ? `HUNT · ${d.title.toUpperCase()} · EXACT SHELF` : `HUNT · ${d.title.toUpperCase()} WORLD`;
  $('#lede').textContent = exact
    ? `${d.title} → ${selection.category.title} → ${selection.shelf.label}. Continue down for exact products, more from this shelf, related shelves and BOOM order.`
    : `Explore ${d.title} through its own categories. Each category opens its exact shelf.`;
  const crumb = [d.title, selection.category?.title, selection.shelf?.label].filter(Boolean);
  $('#breadcrumb').innerHTML = crumb.map((piece, i) => `${i ? '<b class="divider">›</b>' : ''}<span>${esc(piece)}</span>`).join('');
  $('#hero').classList.toggle('no-product', !first);
  if (first) {
    $('#hero-image').src = first.image_url;
    $('#hero-image').alt = first.title;
    $('#hero-kicker').textContent = first.canonical_route.toUpperCase();
    $('#hero-title').textContent = first.title;
    $('#hero-status').textContent = 'Taxonomy V2 · image technical PASS · inventory verified · Profit REVIEW';
  } else {
    $('#hero-image').removeAttribute('src');
    $('#hero-image').alt = '';
    $('#hero-kicker').textContent = exact ? `${d.title.toUpperCase()} / ${selection.shelf.slug.toUpperCase()}` : `HUNT · ${d.title.toUpperCase()}`;
    $('#hero-title').textContent = sourceError ? 'V2 source unavailable' : exact ? 'This shelf is being filled' : 'Choose an exact shelf';
    $('#hero-status').textContent = sourceError ? 'The clean V2 source could not be loaded. Shelves remain closed.'
      : !index ? 'Checking the clean V2 Shadow source.'
      : exact ? 'No products passed all exact category and preview checks.' : `${d.title} categories only · Shadow preview`;
  }
  const gated = departmentProducts(d).length;
  $('#stats').innerHTML = [
    `${d.categories.length} exact categories`,
    index ? `${gated} gated Shadow candidates` : 'Checking V2 source',
    'Payment · supplier orders · taxonomy publish OFF'
  ].map(value => `<span class="stat">${esc(value)}</span>`).join('');
}

function exactShelf(selection, products) {
  const segment = state.segment ? segmentDefinition(selection.route, state.segment) : null;
  const visibleProducts = productsForSegment(selection.route, products, state.segment);
  const count = visibleProducts.length;
  $('#exact-title').textContent = `${selection.department.title} / ${selection.shelf.label}`;
  $('#exact-meta').textContent = `${selection.route}${segment ? ` · ${segment.label}` : ''} · ${count} vetted Shadow candidate${count === 1 ? '' : 's'} · no final profit claim`;
  $('#density').textContent = count >= 24 ? 'FULL' : count >= 12 ? 'GOOD' : count ? 'THIN' : 'FILLING';
  $('#density').className = `density ${count < 12 ? 'thin' : ''}`;
  $('#exact-rail').innerHTML = visibleProducts.slice(0, state.visible).map(product => card(product, true)).join('');
  $('#exact-rail').hidden = count === 0;
  $('#empty-state').hidden = count !== 0;
  $('#load-more').hidden = state.visible >= count;
  $('#load-more').textContent = segment ? `More ${segment.label}` : `More from ${selection.department.title} / ${selection.shelf.label}`;
}

function related(selection) {
  const d = selection.department;
  const siblings = selection.category.shelves.filter(shelf => shelf !== selection.shelf)
    .map(shelf => ({ shelf, category: selection.category }));
  const other = d.categories.filter(category => category !== selection.category)
    .flatMap(category => category.shelves.map(shelf => ({ shelf, category })));
  const sortedOther = other.filter(item => routeProducts(`${d.slug}/${item.shelf.slug}`).length)
    .sort((a, b) => routeProducts(`${d.slug}/${b.shelf.slug}`).length - routeProducts(`${d.slug}/${a.shelf.slug}`).length);
  const suggestions = [...siblings, ...sortedOther].slice(0, 8);
  $('#related-title').textContent = `More in ${d.title}`;
  $('#related-list').innerHTML = suggestions.map(({ category, shelf }) => {
    const count = routeProducts(`${d.slug}/${shelf.slug}`).length;
    return `<button type="button" data-related-category="${category.id}" data-related-shelf="${shelf.slug}">${esc(shelf.label)}<small>${esc(d.title)} · ${count} vetted</small></button>`;
  }).join('') || '<span class="empty-related">More exact shelves are being filled.</span>';
}

function boom(selection, products) {
  const terms = state.preference ? state.preference.split(/\s+/).filter(word => word.length > 3).slice(0, 5) : [];
  const ranked = rankWithinRoute(products, terms);
  $('#boom-title').textContent = `BOOM order · ${selection.shelf.label}`;
  $('#boom-meta').textContent = products.length
    ? `Only ${selection.route}. ${state.preference ? 'Your selected style changed the order inside this shelf.' : 'Choose a style on a product card to reorder this shelf.'} Preview ranking; no account model connected.`
    : `Waiting for verified products in ${selection.route}. BOOM cannot create or reclassify products.`;
  $('#boom-rail').innerHTML = ranked.slice(0, 4).map(product => card(product)).join('');
  $('#boom-rail').hidden = ranked.length === 0;
}

function worlds(selection) {
  const next = relatedWorlds[selection.department.slug] || ['women', 'home'];
  $('#worlds-list').innerHTML = next.filter(slug => slug !== selection.department.slug).map(slug => {
    const d = DEPARTMENTS.find(candidate => candidate.slug === slug);
    return `<button type="button" data-world="${d.slug}">${esc(d.title)}<small>Separate department</small></button>`;
  }).join('');
}

function finderResults(queryText) {
  const q = String(queryText || '').trim().toLowerCase();
  if (q.length < 2) return [];
  const results = [];
  for (const department of DEPARTMENTS) {
    if (department.title.toLowerCase().includes(q) || department.slug.includes(q)) {
      results.push({ type:'department', label:department.title, meta:`${department.categories.length} categories`, department:department.slug });
    }
    for (const category of department.categories) {
      for (const shelf of category.shelves) {
        const haystack = `${category.title} ${shelf.label} ${shelf.slug.replace(/-/g,' ')}`.toLowerCase();
        if (haystack.includes(q)) {
          results.push({
            type:'shelf',
            label:`${department.title} · ${shelf.label}`,
            meta:`${routeProducts(`${department.slug}/${shelf.slug}`).length} gated`,
            department:department.slug, category:category.id, shelf:shelf.slug
          });
        }
      }
    }
  }
  if (index) {
    for (const product of allProducts()) {
      if (results.filter(item => item.type === 'product').length >= 8) break;
      const haystack = `${product.title} ${product.canonical_route}`.toLowerCase();
      if (haystack.includes(q)) {
        results.push({
          type:'product',
          label:product.title,
          meta:product.canonical_route,
          product:productKey(product)
        });
      }
    }
  }
  const seen = new Set();
  return results.filter(item => {
    const key = `${item.type}:${item.department || ''}:${item.category || ''}:${item.shelf || ''}:${item.product || ''}:${item.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 14);
}

function renderFinder(queryText) {
  const q = String(queryText || '').trim();
  const results = finderResults(q);
  if (q.length < 2) {
    $('#hunt-find-results').innerHTML = '<p class="find-empty">Type at least 2 letters. Search departments, exact shelves or gated products.</p>';
    return;
  }
  if (!results.length) {
    $('#hunt-find-results').innerHTML = '<p class="find-empty">No verified HUNT match yet. Try a broader category name.</p>';
    return;
  }
  $('#hunt-find-results').innerHTML = results.map(item => {
    const attrs = item.type === 'product'
      ? `data-find-product="${esc(item.product)}"`
      : item.type === 'department'
        ? `data-find-department="${esc(item.department)}"`
        : `data-find-department="${esc(item.department)}" data-find-category="${esc(item.category)}" data-find-shelf="${esc(item.shelf)}"`;
    return `<button type="button" class="find-result" ${attrs}><span>${esc(item.label)}</span><small>${esc(item.type.toUpperCase())} · ${esc(item.meta)}</small></button>`;
  }).join('');
}

function setFinder(open, { returnFocus = false } = {}) {
  const panel = $('#hunt-find-panel');
  const toggle = $('#find-toggle');
  panel.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  if (open) {
    renderFinder($('#hunt-find-input').value);
    requestAnimationFrame(() => $('#hunt-find-input').focus());
  } else if (returnFocus) {
    requestAnimationFrame(() => toggle.focus());
  }
}

function navigateToExactRoute(departmentSlug, categoryId, shelfSlug) {
  if (!DEPARTMENTS.some(department => department.slug === departmentSlug)) return;
  state.department = departmentSlug;
  const selection = resolveSelection(departmentSlug, categoryId, shelfSlug);
  if (!selection.category || !selection.shelf) return;
  Object.assign(state, {
    category: selection.category.id, shelf: selection.shelf.slug, segment: null,
    visible: 24, preference: '', activeProductKey: null
  });
  render();
  requestAnimationFrame(() => $('#exact-section').scrollIntoView({ behavior:'smooth', block:'start' }));
}

function render() {
  const selection = resolveSelection(state.department, state.category, state.shelf);
  state.department = selection.department.slug;
  state.category = selection.category?.id || null;
  state.shelf = selection.shelf?.slug || null;
  const products = selection.route ? routeProducts(selection.route) : [];
  document.title = `HUNT · ${selection.department.title}${selection.category ? ` / ${selection.category.title}` : ''} · Cinematic`;
  navigation(selection);
  hero(selection, products);
  $('#flow').hidden = !selection.route || !index || !!sourceError;
  $('#selection-hint').hidden = !!selection.route && !!index;
  $('#selection-hint').textContent = sourceError ? 'Clean V2 source unavailable. No products are shown.'
    : !index ? 'Checking the clean Taxonomy Gate V2 source.' : 'Select a category to open its exact shelf.';
  if (selection.route && index && !sourceError) {
    exactShelf(selection, products);
    related(selection);
    boom(selection, products);
    worlds(selection);
  }
  updateUrl();
}

function setDepartmentPanel(open, { focusToggle = false } = {}) {
  const panel = $('#all-departments-panel');
  const toggle = $('#all-departments-toggle');
  panel.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  if (open) requestAnimationFrame(() => panel.querySelector('button.active')?.focus() || panel.querySelector('button')?.focus());
  else if (focusToggle) requestAnimationFrame(() => toggle.focus());
}

function selectDepartment(slug) {
  if (!DEPARTMENTS.some(department => department.slug === slug)) return;
  Object.assign(state, { department: slug, category: null, shelf: null, segment: null, visible: 24, preference: '', activeProductKey: null });
  setDepartmentPanel(false);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectShelf(categoryId, shelfSlug) {
  const selection = resolveSelection(state.department, categoryId, shelfSlug);
  if (!selection.category || !selection.shelf) return;
  Object.assign(state, { category: selection.category.id, shelf: selection.shelf.slug, segment: null, visible: 24, preference: '', activeProductKey: null });
  render();
  $('#exact-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setWorldBackgroundInert(value) {
  [document.querySelector('body > header'), document.querySelector('body > main'), document.querySelector('body > .qa')]
    .filter(Boolean).forEach(element => { element.inert = value; });
}
function renderWorldGrid(selector, products) {
  $(selector).innerHTML = products.map(product => card(product, false)).join('');
}
function renderProductWorld(product) {
  if (!product || !index) return;
  const key = productKey(product);
  const deptSlug = productDepartment(product);
  const department = DEPARTMENTS.find(candidate => candidate.slug === deptSlug);
  const exact = routeProducts(product.canonical_route).filter(candidate => productKey(candidate) !== key);
  const sameDepartmentPool = department ? department.categories.flatMap(category =>
    category.shelves.flatMap(shelf => routeProducts(`${department.slug}/${shelf.slug}`))
  ).filter(candidate => candidate.canonical_route !== product.canonical_route && productKey(candidate) !== key) : [];
  const exactLayer = uniqueRanked(exact, candidate => similarityScore(candidate, product), 24);
  const used = new Set([key, ...exactLayer.map(productKey)]);
  const nearbyLayer = uniqueRanked(sameDepartmentPool, candidate => similarityScore(candidate, product), 24, used);
  nearbyLayer.forEach(candidate => used.add(productKey(candidate)));
  const forYouLayer = uniqueRanked(allProducts().filter(candidate => productKey(candidate) !== key),
    candidate => personalizationScore(candidate, product), 24, used);
  forYouLayer.forEach(candidate => used.add(productKey(candidate)));
  const crossDepartments = new Set(relatedWorlds[deptSlug] || []);
  const crossPool = allProducts().filter(candidate => crossDepartments.has(productDepartment(candidate)));
  const crossLayer = uniqueRanked(crossPool, candidate => personalizationScore(candidate, product), 18, used);

  $('#product-world-image').src = product.image_url;
  $('#product-world-image').alt = product.title;
  $('#product-world-title').textContent = product.title;
  $('#product-world-path').textContent = product.canonical_route;
  $('#product-world-route').textContent = product.canonical_route;
  $('#product-world-badges').innerHTML = `<span class="badge truth">HUNT VERIFIED</span>${huntMoney(product) ? `<span class="badge hunt-price-badge">${esc(huntMoney(product))}</span>` : ''}`;
  const stock = Number(product.inventory_snapshot);
  $('#product-world-status').textContent = [
    Number.isFinite(stock) && stock > 0 ? `Verified stock snapshot: ${stock}` : 'Verified stock snapshot',
    'Image technical PASS',
    'Profit REVIEW',
    'Checkout OFF'
  ].join(' · ');
  $('#world-similar-meta').textContent = `${exactLayer.length} from ${product.canonical_route}`;
  $('#world-nearby-meta').textContent = `${nearbyLayer.length} from ${department?.title || deptSlug}, kept in their own shelves`;
  renderWorldGrid('#world-similar-grid', exactLayer);
  renderWorldGrid('#world-nearby-grid', nearbyLayer);
  renderWorldGrid('#world-for-you-grid', forYouLayer);
  renderWorldGrid('#world-cross-grid', crossLayer);
}
function openProduct(product) {
  if (!product || !index) return;
  if ($('#product-world').hidden) lastWorldFocus = document.activeElement;
  state.activeProductKey = productKey(product);
  recordInterest(product);
  renderProductWorld(product);
  updateUrl();
  $('#product-world').hidden = false;
  document.body.classList.add('world-open');
  setWorldBackgroundInert(true);
  $('#product-world-scroll').scrollTop = 0;
  requestAnimationFrame(() => $('#world-close').focus());
}
function closeProduct({ returnFocus = true } = {}) {
  if ($('#product-world').hidden) return;
  $('#product-world').hidden = true;
  document.body.classList.remove('world-open');
  setWorldBackgroundInert(false);
  state.activeProductKey = null;
  updateUrl();
  if (returnFocus && lastWorldFocus?.focus) requestAnimationFrame(() => lastWorldFocus.focus());
}
function focusTrapWorld(event) {
  if ($('#product-world').hidden) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeProduct();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...$('#product-world-shell').querySelectorAll('button,[href],[tabindex]:not([tabindex="-1"])')]
    .filter(element => !element.disabled && !element.hidden);
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

$('#find-toggle').addEventListener('click', () => setFinder($('#hunt-find-panel').hidden));
$('#hunt-find-close').addEventListener('click', () => setFinder(false, { returnFocus:true }));
$('#hunt-find-input').addEventListener('input', event => renderFinder(event.target.value));
$('#hunt-find-results').addEventListener('click', event => {
  const button = event.target.closest('button.find-result');
  if (!button) return;
  if (button.dataset.findProduct) {
    const product = productByKey(button.dataset.findProduct);
    if (!product) return;
    const target = routeSelection(product.canonical_route);
    if (target) navigateToExactRoute(target.department.slug, target.category.id, target.shelf.slug);
    setFinder(false);
    requestAnimationFrame(() => openProduct(product));
    return;
  }
  if (button.dataset.findShelf) {
    navigateToExactRoute(button.dataset.findDepartment, button.dataset.findCategory, button.dataset.findShelf);
    setFinder(false);
    return;
  }
  if (button.dataset.findDepartment) {
    setFinder(false);
    selectDepartment(button.dataset.findDepartment);
  }
});
$('#hunt-find-input').addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    setFinder(false, { returnFocus:true });
  } else if (event.key === 'Enter') {
    const first = $('#hunt-find-results button.find-result');
    if (first) {
      event.preventDefault();
      first.click();
    }
  }
});

$('#all-departments-toggle').addEventListener('click', () => {
  setFinder(false);
  setDepartmentPanel($('#all-departments-panel').hidden);
});
$('#all-departments-close').addEventListener('click', () => setDepartmentPanel(false, { focusToggle: true }));
$('#all-departments-grid').addEventListener('click', event => {
  const button = event.target.closest('button[data-dept-panel]');
  if (button) selectDepartment(button.dataset.deptPanel);
});
document.addEventListener('click', event => {
  if (!$('#hunt-find-panel').hidden && !event.target.closest('#hunt-find-panel') && !event.target.closest('#find-toggle')) setFinder(false);
  if ($('#all-departments-panel').hidden) return;
  if (event.target.closest('#all-departments-panel') || event.target.closest('#all-departments-toggle')) return;
  setDepartmentPanel(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('#all-departments-panel').hidden && $('#product-world').hidden) {
    event.preventDefault();
    setDepartmentPanel(false, { focusToggle: true });
  }
});

$('#dept-nav').addEventListener('click', event => {
  const button = event.target.closest('button[data-dept]');
  if (button) selectDepartment(button.dataset.dept);
});
$('#category-index').addEventListener('click', event => {
  const worldButton = event.target.closest('button[data-nav-world]');
  if (worldButton) {
    selectDepartment(worldButton.dataset.navWorld);
    return;
  }
  const button = event.target.closest('button[data-category]');
  if (button) selectShelf(button.dataset.category);
});
$('#shelf-buttons').addEventListener('click', event => {
  const button = event.target.closest('button[data-shelf]');
  if (button) selectShelf(state.category, button.dataset.shelf);
});
$('#segment-buttons').addEventListener('click', event => {
  const button = event.target.closest('button[data-segment]');
  if (!button || button.disabled) return;
  state.segment = button.dataset.segment || null;
  state.visible = 24;
  render();
  $('#exact-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#related-list').addEventListener('click', event => {
  const button = event.target.closest('button[data-related-shelf]');
  if (button) selectShelf(button.dataset.relatedCategory, button.dataset.relatedShelf);
});
$('#worlds-list').addEventListener('click', event => {
  const button = event.target.closest('button[data-world]');
  if (button) selectDepartment(button.dataset.world);
});
$('#load-more').addEventListener('click', () => { state.visible += 24; render(); });
document.addEventListener('click', event => {
  const openButton = event.target.closest('button[data-open-product]');
  if (openButton) {
    const product = productByKey(openButton.dataset.openProduct);
    if (product) openProduct(product);
    return;
  }
  const cardElement = event.target.closest('.card[data-product-key]');
  if (cardElement && !event.target.closest('button')) {
    const product = productByKey(cardElement.dataset.productKey);
    if (product) openProduct(product);
    return;
  }
  const preferButton = event.target.closest('button[data-prefer]');
  if (preferButton) {
    const product = productByKey(preferButton.dataset.prefer);
    if (!product) return;
    state.preference = product.title;
    recordInterest(product);
    const selection = resolveSelection(state.department, state.category, state.shelf);
    if (selection.route) boom(selection, routeProducts(selection.route));
    if (!$('#product-world').hidden && state.activeProductKey) renderProductWorld(productByKey(state.activeProductKey));
  }
});
$('#world-close').addEventListener('click', () => closeProduct());
$('#product-world').addEventListener('click', event => { if (event.target.closest('[data-close-world]')) closeProduct(); });
$('#world-back-shelf').addEventListener('click', () => {
  closeProduct({ returnFocus: false });
  $('#exact-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#world-prefer').addEventListener('click', () => {
  const product = productByKey(state.activeProductKey);
  if (!product) return;
  state.preference = product.title;
  recordInterest(product);
  renderProductWorld(product);
  $('#world-personal-meta').textContent = 'Updated for this browser profile · preview only';
});
document.addEventListener('keydown', focusTrapWorld);
$('#theme').addEventListener('click', () => theme(document.documentElement.dataset.huntTheme === 'dark' ? 'light' : 'dark'));
theme(query.get('theme') === 'light' ? 'light' : 'dark');
render();

async function fetchCatalogSource() {
  try {
    const live = await fetch(LIVE_SHADOW_SOURCE, {
      credentials: 'omit',
      cache: 'no-store',
      headers: { apikey: LIVE_SHADOW_KEY }
    });
    if (!live.ok) throw new Error(`Live shadow source returned ${live.status}`);
    const data = await live.json();
    sourceMode = 'live-shadow';
    return data;
  } catch (liveError) {
    const fallback = await fetch(V2_SOURCE, { credentials: 'omit', cache: 'no-store' });
    if (!fallback.ok) throw new Error(`V2 fallback returned ${fallback.status}`);
    sourceMode = 'checked-in-fallback';
    return fallback.json();
  }
}

fetchCatalogSource().then(supplement => {
  index = buildIndex(supplement);
  sourceError = null;
  render();
  const requested = state.activeProductKey ? productByKey(state.activeProductKey) : null;
  if (requested) requestAnimationFrame(() => openProduct(requested));
}).catch(() => {
  sourceMode = 'unavailable';
  sourceError = 'UNAVAILABLE';
  render();
});
