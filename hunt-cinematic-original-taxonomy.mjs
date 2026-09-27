// Shadow preview routing. Canonical routes are never inferred from the title or BOOM order.
const category = (id, title, ...shelves) => ({ id, title, shelves: shelves.map(([slug, label]) => ({ slug, label })) });

export const DEPARTMENTS = [
  { slug: 'women', title: 'Women', city: 'paris', categories: [
    category('dresses', 'Dresses', ['women-dresses', 'Dresses']),
    category('tops', 'Tops & Layers', ['women-tops', 'Tops'], ['women-knitwear', 'Knitwear'], ['women-hoodies', 'Hoodies']),
    category('bottoms', 'Bottoms', ['women-bottoms', 'Bottoms'], ['women-skirts', 'Skirts'], ['women-jeans', 'Jeans']),
    category('outerwear', 'Outerwear', ['women-outerwear', 'Outerwear']),
    category('shoes', 'Shoes', ['women-shoes', 'Shoes']),
    category('evening', 'Evening', ['women-evening', 'Evening']),
    category('sleep', 'Sleep & Basics', ['women-sleepwear', 'Sleepwear'], ['women-underwear', 'Basics'], ['women-socks', 'Socks'])
  ] },
  { slug: 'men', title: 'Men', city: 'shenzhen', categories: [
    category('tops', 'Tops', ['men-tops', 'Tops'], ['men-shirts', 'Shirts'], ['men-knitwear', 'Knitwear'], ['men-hoodies', 'Hoodies']),
    category('bottoms', 'Bottoms', ['men-bottoms', 'Bottoms'], ['men-jeans', 'Jeans']),
    category('outerwear', 'Outerwear', ['men-outerwear', 'Outerwear']),
    category('shoes', 'Shoes', ['men-shoes', 'Shoes']),
    category('basics', 'Basics', ['men-underwear', 'Basics'], ['men-socks', 'Socks'])
  ] },
  { slug: 'kids', title: 'Kids', city: 'tokyo', categories: [
    category('baby', 'Baby', ['baby', 'Baby'], ['baby-clothing', 'Clothing'], ['baby-sets', 'Sets'], ['baby-sleepsuits', 'Sleepsuits']),
    category('clothing', 'Clothing', ['kids-clothing', 'Clothing'], ['girls', 'Girls'], ['boys', 'Boys']),
    category('shoes', 'Shoes', ['kids-shoes', 'Shoes']),
    category('bedding', 'Bedding', ['baby-bedding', 'Baby Bedding'])
  ] },
  { slug: 'accessories', title: 'Accessories', city: 'paris', categories: [
    category('bags', 'Bags', ['bags', 'Bags'], ['bag-accessories', 'Bag Accessories']),
    category('jewelry', 'Jewelry', ['jewelry', 'Jewelry'], ['jewelry-necklaces', 'Necklaces'], ['jewelry-earrings', 'Earrings'], ['jewelry-bracelets', 'Bracelets'], ['jewelry-rings', 'Rings']),
    category('watches', 'Watches', ['watches', 'Watches']),
    category('hair', 'Hair Accessories', ['hair-accessories', 'Hair Accessories']),
    category('extras', 'Finishing Touches', ['hats', 'Hats'], ['belts', 'Belts'], ['scarves', 'Scarves'], ['socks', 'Socks'], ['sunglasses', 'Sunglasses'], ['keychains', 'Keychains'])
  ] },
  { slug: 'beauty', title: 'Beauty', city: 'paris', categories: [
    category('makeup', 'Makeup', ['makeup', 'Makeup']), category('skincare', 'Skincare', ['skincare', 'Skincare']),
    category('hair', 'Hair', ['hair', 'Hair']), category('nails', 'Nails', ['nails', 'Nails']),
    category('body', 'Body Care', ['body-care', 'Body Care']), category('fragrance', 'Fragrance', ['fragrance', 'Fragrance']),
    category('tools', 'Beauty Tools', ['beauty-tools', 'Beauty Tools'])
  ] },
  { slug: 'home', title: 'Home', city: 'dubai', categories: [
    category('decor', 'Decor', ['home-decor', 'Decor'], ['mirrors', 'Mirrors'], ['cushions-throws', 'Cushions & Throws'], ['wall-art', 'Wall Art']),
    category('bedroom', 'Bedroom', ['bedding', 'Bedding']), category('bath', 'Bath', ['bath', 'Bath'], ['towels', 'Towels']),
    category('storage', 'Storage', ['storage', 'Storage'], ['entryway', 'Entryway']),
    category('windows', 'Rugs & Windows', ['rugs', 'Rugs'], ['curtains', 'Curtains'], ['curtains-blinds', 'Curtains & Blinds']),
    category('lighting', 'Lighting', ['lighting', 'Lighting']), category('laundry', 'Laundry', ['laundry', 'Laundry'])
  ] },
  { slug: 'kitchen', title: 'Kitchen', city: 'tokyo', categories: [
    category('cookware', 'Cookware', ['cookware', 'Cookware']), category('tools', 'Kitchen Tools', ['kitchen-tools', 'Kitchen Tools']),
    category('table', 'Tableware', ['tableware', 'Tableware'], ['dinnerware', 'Dinnerware']),
    category('drinkware', 'Drinkware', ['drinkware', 'Drinkware']), category('storage', 'Storage', ['kitchen-storage', 'Kitchen Storage']),
    category('bakeware', 'Bakeware', ['bakeware', 'Bakeware'])
  ] },
  { slug: 'tech', title: 'Tech', city: 'shenzhen', categories: [
    category('phone', 'Phone & Charging', ['phone-cases', 'Phone Cases'], ['chargers-cables', 'Chargers & Cables'], ['power-banks', 'Power Banks'], ['stands-holders', 'Stands']),
    category('audio', 'Audio', ['audio', 'Audio']), category('wearables', 'Wearables', ['wearables', 'Wearables'], ['wearable-accessories', 'Accessories']),
    category('gaming', 'Gaming', ['gaming', 'Gaming']), category('cameras', 'Cameras', ['cameras', 'Cameras']),
    category('computing', 'Computing', ['computers-tablets', 'Computers & Tablets'])
  ] },
  { slug: 'electrical', title: 'Electrical', city: 'shenzhen', categories: [category('appliances', 'Appliances', ['home-appliances', 'Home Appliances'])] },
  { slug: 'sports', title: 'Sports', city: 'tokyo', categories: [
    category('active', 'Activewear', ['activewear', 'Activewear'], ['active-bottoms', 'Active Bottoms']),
    category('fitness', 'Fitness', ['fitness-accessories', 'Fitness Accessories'], ['sports-gear', 'Sports Gear'])
  ] },
  { slug: 'camping', title: 'Camping', city: 'dubai', categories: [
    category('outdoors', 'Outdoors', ['outdoors', 'Outdoor Gear']),
    category('sleep', 'Camp Sleep', ['camping-sleep', 'Camp Sleep']),
    category('lighting', 'Camp Lighting', ['camping-lighting', 'Camp Lighting'])
  ] },
  { slug: 'pets', title: 'Pets', city: 'tokyo', categories: [
    category('accessories', 'Pet Accessories', ['pet-accessories', 'Accessories']), category('beds', 'Pet Beds', ['pet-beds', 'Beds']),
    category('clothing', 'Pet Clothing', ['pet-clothing', 'Clothing']), category('feeding', 'Feeding', ['pet-feeding', 'Feeding']),
    category('grooming', 'Grooming', ['pet-grooming', 'Grooming']), category('houses', 'Pet Houses', ['pet-houses', 'Houses']),
    category('toys', 'Pet Toys', ['pet-toys', 'Toys']), category('walks', 'Walks', ['pet-walk', 'Walks']),
    category('aquarium', 'Aquarium', ['aquarium', 'Aquarium'])
  ] },
  { slug: 'toys', title: 'Toys', city: 'tokyo', categories: [
    category('building', 'Building Toys', ['building-toys', 'Building Toys']),
    category('education', 'Educational Toys', ['educational-toys', 'Educational Toys'])
  ] },
  { slug: 'garden', title: 'Garden', city: 'dubai', categories: [
    category('living', 'Outdoor Living', ['outdoor-living', 'Outdoor Living']), category('planters', 'Planters', ['planters', 'Planters']),
    category('watering', 'Watering', ['watering', 'Watering']), category('tools', 'Garden Tools', ['garden-tools', 'Garden Tools'])
  ] },
  { slug: 'office', title: 'Office', city: 'shenzhen', categories: [
    category('furniture', 'Office Furniture', ['office-furniture', 'Furniture']), category('stationery', 'Stationery', ['stationery', 'Stationery'])
  ] },
  { slug: 'travel', title: 'Travel', city: 'paris', categories: [
    category('luggage', 'Luggage', ['luggage', 'Luggage']), category('essentials', 'Travel Essentials', ['travel-accessories', 'Travel Essentials'])
  ] },
  { slug: 'gifts', title: 'Gifts', city: 'dubai', categories: [
    category('decor', 'Gift Decor', ['gift-decor', 'Gift Decor']), category('party', 'Party', ['party', 'Party'])
  ] }
];

const restricted = /\b(?:weapon|firearm|ammunition|vape|nicotine|cannabis|marijuana|steroid|diet pill|pornography|sex toy)\b/i;
const accessoryIdentity = /\b(?:necklace|pendant|choker|earring|bracelet|bangle|jewelry|jewellery|handbag|purse|tote|crossbody|backpack|wallet|belt|scarf|hat|beanie|hair clip|watch)\b/i;
const alienInApparel = /\b(?:dog|cat|pet|aquarium|phone case|charger|laptop|necklace|bracelet|handbag|table lamp|dining chair|storage cabinet|garden tool)\b/i;
const configuredRoutes = new Set(DEPARTMENTS.flatMap(d => d.categories.flatMap(c => c.shelves.map(s => `${d.slug}/${s.slug}`))));

export function isEligible(route, p) {
  if (!configuredRoutes.has(route) || !p || `${p.department}/${p.category}` !== route) return false;
  if (p.taxonomy_gate_v2 !== 'REMAP' || !p.provider || !p.item_id || !p.title) return false;
  if (p.availability_verified !== true || !(Number(p.inventory_snapshot) > 0)) return false;
  if (p.production_exposure !== false || p.sell_state !== 'SHADOW_QA_PROFIT_REVIEW') return false;
  if (p.image_technical_status !== 'PASS' || !/^https:\/\//i.test(p.image_url || '')) return false;
  if (/HOLD|BLOCK|REVIEW_REQUIRED/i.test(p.candidate_status || '')) return false;
  if (p.profit_truth?.status !== 'PROFIT_REVIEW' || p.profit_truth.final_profit_verified !== false) return false;
  if (!(Number(p.profit_truth.projected_product_contribution_usd) > 0)) return false;
  if (restricted.test(p.title)) return false;
  if (route.startsWith('gifts/') && accessoryIdentity.test(p.title)) return false;
  if (/^(women|men)\//.test(route) && alienInApparel.test(p.title)) return false;
  if (route === 'beauty/nails' && /\b(?:chair|furniture|snail cream)\b/i.test(p.title)) return false;
  return true;
}

export function buildIndex(data) {
  if (data?.version !== 'HUNT-TAXONOMY-PROFIT-V2-PREVIEW-SUPPLEMENT' || data.mode !== 'SHADOW_ONLY' || data.production_effect !== false || !data.shelves) {
    throw new Error('The clean Taxonomy Gate V2 shadow dataset is unavailable.');
  }
  const byRoute = new Map();
  const seen = new Set();
  let accepted = 0, excluded = 0;
  for (const [route, products] of Object.entries(data.shelves)) {
    if (!Array.isArray(products)) throw new Error(`Invalid shelf: ${route}`);
    for (const p of products) {
      const key = `${p.provider}:${p.item_id}`;
      if (!isEligible(route, p) || seen.has(key)) { excluded++; continue; }
      seen.add(key);
      if (!byRoute.has(route)) byRoute.set(route, []);
      byRoute.get(route).push(Object.freeze({ ...p, canonical_route: route }));
      accepted++;
    }
  }
  return { byRoute, stats: { accepted, excluded, source: data.total_products, routeCount: byRoute.size } };
}

export function resolveSelection(departmentSlug, categoryId, shelfSlug) {
  const department = DEPARTMENTS.find(d => d.slug === departmentSlug) || DEPARTMENTS[0];
  const selectedCategory = department.categories.find(c => c.id === categoryId) || null;
  const selectedShelf = selectedCategory?.shelves.find(s => s.slug === shelfSlug) || selectedCategory?.shelves[0] || null;
  return { department, category: selectedCategory, shelf: selectedShelf, route: selectedShelf ? `${department.slug}/${selectedShelf.slug}` : null };
}

// A BOOM ranking adapter receives only the already gated exact route.
export function rankWithinRoute(products, terms = []) {
  const words = terms.map(x => String(x).trim().toLowerCase()).filter(Boolean);
  return products.map((p, position) => ({ p, position, score: words.reduce((sum, word) => sum + (p.title.toLowerCase().includes(word) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score || a.position - b.position).map(x => x.p);
}
