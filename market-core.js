(() => {
  const functionsBase = "https://zszlnahjqmwozwubetkm.supabase.co/functions/v1";
  const publishableKey = "sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
  const cartKey = "hunt_deal_cart_v1";
  const signalKey = "hunt_deal_boom_signals_v1";
  const blocked = [
    "gun","firearm","ammunition","ammo","weapon","switchblade","taser",
    "cannabis","marijuana","thc","cocaine","heroin","meth","steroid",
    "vape","cigarette","nicotine","beer","wine","vodka","casino",
    "sportsbook","betting","porn","sex toy","spyware"
  ];

  const categoryDefs = {
    women: {title:"Women's Fashion", query:"women fashion deals", icon:"👗", description:"Dresses, tops, sets, hoodies and everyday fashion."},
    perfume: {title:"Perfume & Fragrance", query:"women perfume fragrance", icon:"✦", description:"Fragrance and gift sets from approved feeds when available."},
    jewelry: {title:"Jewelry & Accessories", query:"women jewelry necklace bracelet earrings", icon:"◇", description:"Jewelry, accessories and finishing pieces."},
    bags: {title:"Bags", query:"women handbags shoulder bags purses", icon:"👜", description:"Handbags, crossbody bags, totes and everyday bags."},
    shoes: {title:"Shoes", query:"women shoes sneakers heels", icon:"◒", description:"Sneakers, canvas shoes, slides and seasonal styles."},
    beauty: {title:"Beauty & Skincare", query:"beauty skincare makeup", icon:"✧", description:"Beauty and skincare from approved product feeds."},
    sunglasses: {title:"Sunglasses", query:"women sunglasses accessories", icon:"◉", description:"Eyewear and fashion accessories."},
    watches: {title:"Watches", query:"women watches", icon:"⌚", description:"Classic and smart watch discovery."},
    hair: {title:"Hair", query:"hair beauty tools", icon:"≈", description:"Hair care and styling tools from verified suppliers."},
    accessories: {title:"Accessories", query:"women wallets belts accessories", icon:"▣", description:"Wallets, belts, hats, cases and everyday accessories."},
    home: {title:"Home", query:"home decor deals", icon:"⌂", description:"Decor, rugs, pillows and useful home finds."},
    kitchen: {title:"Kitchen", query:"kitchen home deals", icon:"◫", description:"Kitchen and dining products."},
    tech: {title:"Phone & Tech", query:"phone accessories electronics", icon:"⌁", description:"Cases, charging and connected accessories."},
    travel: {title:"Travel", query:"travel accessories luggage", icon:"✈", description:"Luggage, organizers, bags and travel essentials."},
    fitness: {title:"Fitness", query:"fitness accessories", icon:"△", description:"Athletic apparel and useful fitness accessories."},
    gifts: {title:"Gifts", query:"gifts for women", icon:"♥", description:"Gift ideas from live approved catalogs."}
  };

  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money = (value, currency="USD") => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
    try { return new Intl.NumberFormat(document.documentElement.lang || "en", {style:"currency",currency}).format(Number(value)); }
    catch { return String(value); }
  };
  const safeQuery = query => {
    const q = String(query || "").trim().slice(0,120);
    const lower = q.toLowerCase();
    if (!q || blocked.some(term => lower.includes(term))) return "";
    return q;
  };

  function inferCategory(value) {
    const t = String(value?.title || value || "").toLowerCase();
    if (/(perfume|fragrance)/.test(t)) return "perfume";
    if (/(beauty|skincare|makeup|cosmetic|serum|cream)/.test(t)) return "beauty";
    if (/(jewelry|jewellery|necklace|bracelet|earring|ring)/.test(t)) return "jewelry";
    if (/(handbag|purse|crossbody|tote|backpack|bag)/.test(t)) return "bags";
    if (/(shoe|sneaker|canvas shoe|slide|heel)/.test(t)) return "shoes";
    if (/(sunglass|eyewear)/.test(t)) return "sunglasses";
    if (/(watch)/.test(t)) return "watches";
    if (/(hair)/.test(t)) return "hair";
    if (/(wallet|belt|accessor|hat|cap|case|tag)/.test(t)) return "accessories";
    if (/(travel|luggage|suitcase|duffle|passport)/.test(t)) return "travel";
    if (/(fitness|athletic|gym|yoga|legging|shorts)/.test(t)) return "fitness";
    if (/(kitchen|mug|coffee|cookware)/.test(t)) return "kitchen";
    if (/(home|rug|pillow|blanket|decor|coaster)/.test(t)) return "home";
    if (/(phone|iphone|samsung|airpods|magsafe|tech|electronics)/.test(t)) return "tech";
    if (/(dress|shirt|hoodie|jacket|apparel|fashion|top|skirt|pants|women)/.test(t)) return "women";
    return "gifts";
  }

  function slugFromQuery(query) {
    const q = String(query || "").toLowerCase();
    if (/perfume|fragrance/.test(q)) return "perfume";
    if (/jewel|necklace|bracelet|earring|ring/.test(q)) return "jewelry";
    if (/handbag|purse|bag/.test(q)) return "bags";
    if (/shoe|sneaker|heel/.test(q)) return "shoes";
    if (/beauty|skincare|makeup/.test(q)) return "beauty";
    if (/sunglass/.test(q)) return "sunglasses";
    if (/watch/.test(q)) return "watches";
    if (/hair/.test(q)) return "hair";
    if (/wallet|belt|accessor/.test(q)) return "accessories";
    if (/kitchen/.test(q)) return "kitchen";
    if (/home|decor/.test(q)) return "home";
    if (/phone|tech|electronic/.test(q)) return "tech";
    if (/travel|luggage/.test(q)) return "travel";
    if (/fitness|gym|athletic/.test(q)) return "fitness";
    if (/gift/.test(q)) return "gifts";
    return "women";
  }

  const readJson = (key, fallback) => {
    try { const value = JSON.parse(localStorage.getItem(key) || "null"); return value ?? fallback; }
    catch { return fallback; }
  };
  const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const signals = () => readJson(signalKey, {});
  function recordSignal(category, action="view") {
    const slug = categoryDefs[category] ? category : inferCategory(category);
    const weights = {search:1, category:2, view:3, cart:6};
    const state = signals();
    state[slug] = Math.min(100, Math.max(0, Number(state[slug] || 0) + Number(weights[action] || 1)));
    writeJson(signalKey, state);
    return state[slug];
  }
  function personalScore(product) {
    const category = inferCategory(product);
    return Number(signals()[category] || 0);
  }
  function personalReason(product) {
    const category = inferCategory(product);
    const score = personalScore(product);
    return score > 0 ? `Matches your recent ${categoryDefs[category]?.title || category} activity on this device.` : "BOOM is still learning from your views and cart actions.";
  }

  const cart = () => readJson(cartKey, []);
  const saveCart = value => writeJson(cartKey, Array.isArray(value) ? value : []);
  function addCart(product, variant=null, qty=1) {
    const items = cart();
    const variantId = String(variant?.variant_id || "base");
    const key = `${product.provider}:${product.item_id}:${variantId}`;
    const existing = items.find(x => x.key === key);
    const amount = variant?.price_amount ?? product.price_amount ?? null;
    const row = {
      key,
      provider: String(product.provider || ""),
      item_id: String(product.item_id || ""),
      variant_id: variantId === "base" ? null : variantId,
      variant_label: [variant?.color, variant?.size].filter(Boolean).join(" / ") || null,
      title: String(product.title || "Product"),
      image_url: String(variant?.image_url || product.image_url || "") || null,
      price_amount: amount == null ? null : Number(amount),
      currency: String(variant?.currency || product.currency || "USD"),
      price_basis: String(product.price_basis || "SUPPLIER_BASE"),
      qty: Math.max(1, Math.min(20, Number(qty) || 1))
    };
    if (existing) existing.qty = Math.min(20, Number(existing.qty || 1) + row.qty);
    else items.push(row);
    saveCart(items);
    recordSignal(product, "cart");
    return items;
  }
  function cartCount() { return cart().reduce((sum,x)=>sum+Math.max(1,Number(x.qty)||1),0); }
  function updateCartBadges() { document.querySelectorAll("[data-cart-count]").forEach(el=>el.textContent=String(cartCount())); }

  async function storefront(params={}) {
    const url = new URL(functionsBase + "/hunt-storefront");
    Object.entries(params).forEach(([k,v])=>{ if(v!==undefined && v!==null && v!=="") url.searchParams.set(k,String(v)); });
    const res = await fetch(url,{cache:"no-store",headers:{apikey:publishableKey}});
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Storefront unavailable");
    return data;
  }
  async function search(query, limit=20) {
    const clean = safeQuery(query);
    if (!clean) throw new Error("This search is not available.");
    recordSignal(slugFromQuery(clean), "search");
    const res = await fetch(functionsBase + "/hunt-deals-hunt", {
      method:"POST",
      headers:{apikey:publishableKey,"Content-Type":"application/json"},
      body:JSON.stringify({query:clean,limit:Math.max(1,Math.min(24,Number(limit)||20))})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Live search unavailable");
    return data;
  }

  const productUrl = product => `product.html?provider=${encodeURIComponent(product?.provider || "Printful")}&id=${encodeURIComponent(product?.item_id || "")}`;
  const categoryUrl = slug => `category.html?c=${encodeURIComponent(categoryDefs[slug] ? slug : "women")}`;

  window.HuntCore = {
    functionsBase,publishableKey,cartKey,signalKey,categoryDefs,esc,money,safeQuery,
    inferCategory,slugFromQuery,recordSignal,personalScore,personalReason,signals,
    cart,saveCart,addCart,cartCount,updateCartBadges,storefront,search,productUrl,categoryUrl
  };
})();
