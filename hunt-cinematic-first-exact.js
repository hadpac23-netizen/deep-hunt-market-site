import { DEPARTMENTS, buildIndex, resolveSelection, rankWithinRoute } from './hunt-cinematic-first-taxonomy.mjs';

const V2_SOURCE = './evidence/HUNT-TAXONOMY-PROFIT-V2-PREVIEW-SUPPLEMENT-2026-09-27.json';
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const relatedWorlds = {
  women: ['accessories', 'beauty'], men: ['accessories', 'sports'], kids: ['toys', 'home'],
  gifts: ['accessories', 'home'], accessories: ['women', 'men'], home: ['kitchen', 'garden'],
  tech: ['electrical', 'office'], pets: ['home'], travel: ['accessories']
};
const query = new URLSearchParams(location.search);
const starting = resolveSelection(query.get('dept'), query.get('category'), query.get('shelf'));
const state = { department: starting.department.slug, category: starting.category?.id || null,
  shelf: starting.shelf?.slug || null, visible: 24, preference: '' };
let index = null;
let sourceError = null;

function theme(next) {
  document.documentElement.dataset.huntTheme = next;
  $('#theme').textContent = next === 'dark' ? 'Light' : 'Dark';
  $('#theme').setAttribute('aria-label', `Switch to ${next === 'dark' ? 'light' : 'dark'} mode`);
  updateUrl();
}

function updateUrl() {
  const url = new URL(location.href);
  ['dept', 'category', 'shelf', 'theme'].forEach(key => url.searchParams.delete(key));
  url.searchParams.set('dept', state.department);
  if (state.category) url.searchParams.set('category', state.category);
  if (state.shelf) url.searchParams.set('shelf', state.shelf);
  url.searchParams.set('theme', document.documentElement.dataset.huntTheme);
  history.replaceState(null, '', url.pathname + url.search);
}

function routeProducts(route) { return index?.byRoute.get(route) || []; }
function departmentProducts(department) {
  return department.categories.flatMap(category => category.shelves.flatMap(shelf => routeProducts(`${department.slug}/${shelf.slug}`)));
}

function card(product, preferenceButton = false) {
  return `<article class="card" data-route="${esc(product.canonical_route)}" data-product="${esc(product.item_id)}">
    <div class="media"><img src="${esc(product.image_url)}" alt="${esc(product.title)}" loading="lazy"></div>
    <div class="card-body"><div class="badges"><span class="badge truth">TAXONOMY V2</span><span class="badge">${esc(product.provider)}</span></div>
      <h3>${esc(product.title)}</h3><p>${esc(product.canonical_route)} · verified stock snapshot</p>
      <p class="gate-line">Image PASS · Profit REVIEW · checkout OFF</p>
      ${preferenceButton ? `<button type="button" class="prefer" data-prefer="${esc(product.provider)}:${esc(product.item_id)}">Use as style preference</button>` : ''}
    </div>
  </article>`;
}

function navigation(selection) {
  const d = selection.department;
  $('#dept-nav').innerHTML = DEPARTMENTS.map(dept => `<button type="button" data-dept="${dept.slug}" class="${dept === d ? 'active' : ''}" aria-pressed="${dept === d}">${esc(dept.title)}</button>`).join('');
  $('#category-index').innerHTML = d.categories.map(category => {
    const count = category.shelves.reduce((total, shelf) => total + routeProducts(`${d.slug}/${shelf.slug}`).length, 0);
    return `<button type="button" class="cat-chip ${category === selection.category ? 'active' : ''}" data-category="${category.id}" aria-pressed="${category === selection.category}">${esc(category.title)} · ${count}</button>`;
  }).join('');
  $('#shelf-drawer').hidden = !selection.category;
  if (selection.category) {
    $('#drawer-title').textContent = `${d.title} / ${selection.category.title}`;
    $('#shelf-buttons').innerHTML = selection.category.shelves.map(shelf => {
      const count = routeProducts(`${d.slug}/${shelf.slug}`).length;
      return `<button type="button" data-shelf="${shelf.slug}" class="${shelf === selection.shelf ? 'active' : ''}" aria-pressed="${shelf === selection.shelf}">${esc(shelf.label)}<span>${count}</span></button>`;
    }).join('');
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
  const count = products.length;
  $('#exact-title').textContent = `${selection.department.title} / ${selection.shelf.label}`;
  $('#exact-meta').textContent = `${selection.route} · ${count} vetted Shadow candidate${count === 1 ? '' : 's'} · no final profit claim`;
  $('#density').textContent = count >= 24 ? 'FULL' : count >= 12 ? 'GOOD' : count ? 'THIN' : 'FILLING';
  $('#density').className = `density ${count < 12 ? 'thin' : ''}`;
  $('#exact-rail').innerHTML = products.slice(0, state.visible).map(product => card(product, true)).join('');
  $('#exact-rail').hidden = count === 0;
  $('#empty-state').hidden = count !== 0;
  $('#load-more').hidden = state.visible >= count;
  $('#load-more').textContent = `More from ${selection.department.title} / ${selection.shelf.label}`;
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

function selectDepartment(slug) {
  if (!DEPARTMENTS.some(department => department.slug === slug)) return;
  Object.assign(state, { department: slug, category: null, shelf: null, visible: 24, preference: '' });
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectShelf(categoryId, shelfSlug) {
  const selection = resolveSelection(state.department, categoryId, shelfSlug);
  if (!selection.category || !selection.shelf) return;
  Object.assign(state, { category: selection.category.id, shelf: selection.shelf.slug, visible: 24, preference: '' });
  render();
  $('#exact-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

$('#dept-nav').addEventListener('click', event => {
  const button = event.target.closest('button[data-dept]');
  if (button) selectDepartment(button.dataset.dept);
});
$('#category-index').addEventListener('click', event => {
  const button = event.target.closest('button[data-category]');
  if (button) selectShelf(button.dataset.category);
});
$('#shelf-buttons').addEventListener('click', event => {
  const button = event.target.closest('button[data-shelf]');
  if (button) selectShelf(state.category, button.dataset.shelf);
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
$('#exact-rail').addEventListener('click', event => {
  const button = event.target.closest('button[data-prefer]');
  if (!button) return;
  const selection = resolveSelection(state.department, state.category, state.shelf);
  const product = routeProducts(selection.route).find(candidate => `${candidate.provider}:${candidate.item_id}` === button.dataset.prefer);
  if (!product) return;
  state.preference = product.title;
  boom(selection, routeProducts(selection.route));
  $('#boom-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#theme').addEventListener('click', () => theme(document.documentElement.dataset.huntTheme === 'dark' ? 'light' : 'dark'));
theme(query.get('theme') === 'light' ? 'light' : 'dark');
render();

fetch(V2_SOURCE, { credentials: 'omit', cache: 'no-store' }).then(response => {
  if (!response.ok) throw new Error(`V2 source returned ${response.status}`);
  return response.json();
}).then(supplement => {
  index = buildIndex(supplement);
  render();
}).catch(() => {
  sourceError = 'UNAVAILABLE';
  render();
});
