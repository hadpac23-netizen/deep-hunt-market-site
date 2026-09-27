import { DEPARTMENTS, buildIndex, resolveSelection, rankWithinRoute } from './hunt-cinematic-original-taxonomy.mjs';

const SOURCE = './evidence/HUNT-TAXONOMY-PROFIT-V2-PREVIEW-SUPPLEMENT-2026-09-27.json';
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const cities = ['tokyo', 'paris', 'shenzhen', 'dubai'];
const worldNames = { tokyo: 'TOKYO', paris: 'PARIS', shenzhen: 'SHENZHEN', dubai: 'DUBAI' };
const relatedWorlds = {
  women: ['accessories', 'beauty'], men: ['accessories', 'sports'], kids: ['toys', 'home'],
  gifts: ['accessories', 'home'], accessories: ['women', 'men'], home: ['kitchen', 'garden'],
  tech: ['electrical', 'office'], pets: ['home'], travel: ['accessories']
};

let index = null;
let state = { department: 'women', category: null, shelf: null, visible: 8, preference: '' };
let cityFrame = 0;
let cityName = 'paris';

function theme(next) {
  document.documentElement.dataset.huntTheme = next;
  $('#theme-toggle').textContent = next === 'dark' ? 'Light' : 'Dark';
  $('#theme-toggle').setAttribute('aria-label', `Switch to ${next === 'dark' ? 'light' : 'dark'} mode`);
  updateUrl();
}

function updateUrl() {
  const url = new URL(location.href);
  for (const key of ['dept', 'category', 'shelf', 'theme']) url.searchParams.delete(key);
  url.searchParams.set('dept', state.department);
  if (state.category) url.searchParams.set('category', state.category);
  if (state.shelf) url.searchParams.set('shelf', state.shelf);
  url.searchParams.set('theme', document.documentElement.dataset.huntTheme);
  history.replaceState(null, '', url.pathname + url.search);
}

function showCity(name, immediate = false) {
  cityName = name;
  const frames = [...document.querySelectorAll('.city-frame')];
  const next = immediate ? cityFrame : 1 - cityFrame;
  frames[next].style.backgroundImage = `url("assets/hunt-cinematic-original/${name}.jpg")`;
  $('#city-label').textContent = `HUNT NIGHT · ${worldNames[name]}`;
  requestAnimationFrame(() => {
    frames[next].classList.add('is-active');
    if (!immediate) {
      frames[cityFrame].classList.remove('is-active');
      cityFrame = next;
    }
  });
}

function startCityReel() {
  showCity(cityName, true);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let timer;
  const start = () => {
    clearInterval(timer);
    timer = setInterval(() => showCity(cities[(cities.indexOf(cityName) + 1) % cities.length]), 7800);
  };
  start();
  document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(timer) : start());
}

function departmentCount(department) {
  return department.categories.reduce((sum, category) => sum + category.shelves.reduce((n, shelf) => n + (index?.byRoute.get(`${department.slug}/${shelf.slug}`)?.length || 0), 0), 0);
}

function card(product, allowPreference = false) {
  const route = product.canonical_route;
  return `<article class="card" data-route="${esc(route)}" data-product="${esc(product.item_id)}">
    <div class="card-media"><img src="${esc(product.image_url)}" loading="lazy" alt="${esc(product.title)}"></div>
    <div class="card-body"><div class="route-tag">${esc(route.toUpperCase())}</div>
      <h3>${esc(product.title)}</h3>
      <p>${esc(product.provider)} · Image QA PASS · Stock snapshot ${esc(product.inventory_snapshot)}</p>
      <p class="gate-line">Taxonomy REMAP · Profit REVIEW · Checkout OFF</p>
      ${allowPreference ? `<button class="prefer" type="button" data-prefer="${esc(product.item_id)}">Use as style preference</button>` : ''}
    </div>
  </article>`;
}

function renderNavigation(selection) {
  $('#department-nav').innerHTML = DEPARTMENTS.map(d =>
    `<button type="button" data-dept="${d.slug}" class="${d === selection.department ? 'active' : ''}" aria-pressed="${d === selection.department}">${esc(d.title)}</button>`
  ).join('');
  $('#drawer-department').textContent = selection.department.title;
  $('#drawer-count').textContent = `${selection.department.categories.length} categories`;
  $('#category-buttons').innerHTML = selection.department.categories.map(c => {
    const count = c.shelves.reduce((sum, s) => sum + (index?.byRoute.get(`${selection.department.slug}/${s.slug}`)?.length || 0), 0);
    return `<button type="button" data-category="${c.id}" class="${c === selection.category ? 'active' : ''}" aria-pressed="${c === selection.category}">${esc(c.title)}<span>${count}</span></button>`;
  }).join('');
  $('#shelf-drawer').hidden = !selection.category;
  $('#shelf-buttons').innerHTML = selection.category ? selection.category.shelves.map(s => {
    const count = index?.byRoute.get(`${selection.department.slug}/${s.slug}`)?.length || 0;
    return `<button type="button" data-shelf="${s.slug}" class="${s === selection.shelf ? 'active' : ''}" aria-pressed="${s === selection.shelf}">${esc(s.label)}<span>${count}</span></button>`;
  }).join('') : '';
}

function renderHero(selection, products) {
  const d = selection.department;
  document.documentElement.dataset.huntWorld = d.slug;
  $('#scene-title').textContent = selection.shelf?.label || d.title;
  $('#scene-lede').textContent = selection.shelf
    ? `${d.title} → ${selection.category.title} → ${selection.shelf.label}. One exact shelf, with no products borrowed from another route.`
    : `Explore ${d.title} categories. A category opens only its own exact subcategory and products.`;
  $('#path').innerHTML = `<strong>${esc(d.title)}</strong>${selection.category ? `<span class="divider">/</span><strong>${esc(selection.category.title)}</strong>` : ''}${selection.shelf ? `<span class="divider">/</span><strong>${esc(selection.shelf.label)}</strong>` : ''}`;
  const hero = products[0];
  $('#hero').classList.toggle('world-only', !hero);
  $('#hero-image').src = hero?.image_url || `assets/hunt-cinematic-original/${d.city}.jpg`;
  $('#hero-image').alt = hero ? hero.title : '';
  $('#hero-kicker').textContent = hero ? selection.route.toUpperCase() : `HUNT WORLD · ${worldNames[d.city]}`;
  $('#hero-title').textContent = hero?.title || (selection.shelf ? 'This shelf is being filled' : 'Choose an exact shelf');
  $('#hero-status').textContent = hero
    ? 'Taxonomy V2 · Image QA PASS · Inventory snapshot · Profit REVIEW · Shadow only'
    : (selection.shelf ? 'No clean image QA PASS candidates in this exact route.' : `${d.title} categories only · Shadow preview`);
}

function renderExact(selection, products) {
  $('#exact-section').hidden = false;
  $('#exact-title').textContent = `${selection.department.title} / ${selection.shelf.label}`;
  $('#exact-subtitle').textContent = `${selection.route} · ${products.length} gated Shadow candidates · No final profit or live price claim`;
  $('#empty-state').hidden = products.length !== 0;
  $('#exact-grid').innerHTML = products.slice(0, state.visible).map(p => card(p, true)).join('');
  $('#load-more').hidden = state.visible >= products.length;
  $('#load-more').textContent = `More from ${selection.department.title} / ${selection.shelf.label}`;
}

function renderRelated(selection) {
  const d = selection.department;
  const siblings = selection.category.shelves.filter(s => s !== selection.shelf);
  const other = d.categories.filter(c => c !== selection.category).flatMap(c => c.shelves.map(s => ({ ...s, categoryId: c.id, categoryTitle: c.title })));
  const items = [
    ...siblings.map(s => ({ ...s, categoryId: selection.category.id, categoryTitle: selection.category.title })),
    ...other.sort((a, b) => (index.byRoute.get(`${d.slug}/${b.slug}`)?.length || 0) - (index.byRoute.get(`${d.slug}/${a.slug}`)?.length || 0)).slice(0, 8)
  ];
  $('#related-section').hidden = items.length === 0;
  $('#related-title').textContent = `More in ${d.title}`;
  $('#related-list').innerHTML = items.map(s => {
    const count = index.byRoute.get(`${d.slug}/${s.slug}`)?.length || 0;
    return `<button type="button" data-related-category="${esc(s.categoryId)}" data-related-shelf="${esc(s.slug)}">${esc(s.label)}<small>${esc(s.categoryTitle)} · ${count || 'Being filled'}</small></button>`;
  }).join('');
}

function renderBoom(selection, products) {
  $('#boom-section').hidden = false;
  const terms = state.preference ? state.preference.split(/\s+/).filter(x => x.length > 3).slice(0, 5) : [];
  const ranked = rankWithinRoute(products, terms);
  $('#boom-title').textContent = `BOOM order · ${selection.shelf.label}`;
  $('#boom-copy').textContent = products.length
    ? `Local preview order from ${selection.route} only. ${state.preference ? 'Your chosen style shifts ordering within this shelf.' : 'Choose a style on a card to see this shelf reorder.'} No account data or live BOOM model is used.`
    : `Waiting for gated products in ${selection.route}. Ranking cannot create or reclassify products.`;
  $('#boom-rail').innerHTML = ranked.slice(0, 4).map(p => card(p)).join('');
}

function renderWorlds(selection) {
  const candidates = relatedWorlds[selection.department.slug] || ['women', 'home'];
  $('#worlds-section').hidden = false;
  $('#worlds-list').innerHTML = candidates.filter(slug => slug !== selection.department.slug).map(slug => {
    const d = DEPARTMENTS.find(x => x.slug === slug);
    return `<button type="button" data-world="${d.slug}">${esc(d.title)} · separate world</button>`;
  }).join('');
}

function render() {
  const selection = resolveSelection(state.department, state.category, state.shelf);
  state.department = selection.department.slug;
  state.category = selection.category?.id || null;
  state.shelf = selection.shelf?.slug || null;
  const products = selection.route ? index?.byRoute.get(selection.route) || [] : [];
  renderNavigation(selection);
  renderHero(selection, products);
  for (const id of ['exact-section', 'related-section', 'boom-section', 'worlds-section']) $("#" + id).hidden = !selection.route;
  if (selection.route && index) {
    renderExact(selection, products);
    renderRelated(selection);
    renderBoom(selection, products);
    renderWorlds(selection);
  }
  updateUrl();
}

function selectDepartment(slug) {
  if (!DEPARTMENTS.some(d => d.slug === slug)) return;
  state = { department: slug, category: null, shelf: null, visible: 8, preference: '' };
  showCity(DEPARTMENTS.find(d => d.slug === slug).city);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectShelf(categoryId, shelfSlug) {
  const selection = resolveSelection(state.department, categoryId, shelfSlug);
  if (!selection.category || !selection.shelf) return;
  state.category = selection.category.id;
  state.shelf = selection.shelf.slug;
  state.visible = 8;
  state.preference = '';
  render();
  $('#exact-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

$('#department-nav').addEventListener('click', event => {
  const button = event.target.closest('button[data-dept]');
  if (button) selectDepartment(button.dataset.dept);
});
$('#category-buttons').addEventListener('click', event => {
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
$('#load-more').addEventListener('click', () => { state.visible += 8; render(); });
$('#exact-grid').addEventListener('click', event => {
  const button = event.target.closest('button[data-prefer]');
  if (!button) return;
  const selection = resolveSelection(state.department, state.category, state.shelf);
  const product = index.byRoute.get(selection.route)?.find(p => String(p.item_id) === button.dataset.prefer);
  if (!product) return;
  state.preference = product.title;
  renderBoom(selection, index.byRoute.get(selection.route));
  $('#boom-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#theme-toggle').addEventListener('click', () => theme(document.documentElement.dataset.huntTheme === 'dark' ? 'light' : 'dark'));

const query = new URLSearchParams(location.search);
const request = resolveSelection(query.get('dept'), query.get('category'), query.get('shelf'));
state.department = request.department.slug;
state.category = request.category?.id || null;
state.shelf = request.shelf?.slug || null;
theme(query.get('theme') === 'light' ? 'light' : 'dark');
cityName = request.department.city;
startCityReel();
render();

fetch(SOURCE, { credentials: 'omit', cache: 'no-store' }).then(response => {
  if (!response.ok) throw new Error(`Taxonomy V2 source returned ${response.status}`);
  return response.json();
}).then(data => {
  index = buildIndex(data);
  render();
}).catch(error => {
  $('#drawer-count').textContent = 'Data unavailable';
  $('#category-buttons').innerHTML = '';
  $('#scene-lede').textContent = 'The clean Taxonomy Gate V2 dataset could not be loaded. Shelves are closed until it is available.';
  $('#hero-status').textContent = error.message;
  for (const id of ['exact-section', 'related-section', 'boom-section', 'worlds-section']) $('#' + id).hidden = true;
});
