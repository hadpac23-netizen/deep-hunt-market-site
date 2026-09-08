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
    women: {title:"Women's Fashion", query:"women", icon:"W", description:"Women's apparel, everyday fashion and seasonal styles."},
    men: {title:"Men's Fashion", query:"men", icon:"M", description:"Men's and unisex shirts, hoodies, jackets and everyday apparel."},
    dresses: {title:"Dresses & Skirts", query:"dresses", icon:"D", description:"Dresses and skirts from the connected live catalog."},
    tops: {title:"Tops & T-Shirts", query:"tops", icon:"T", description:"T-shirts, tops, tanks and polos."},
    hoodies: {title:"Hoodies & Sweatshirts", query:"hoodies", icon:"H", description:"Hoodies, sweatshirts and warm layers."},
    jackets: {title:"Jackets & Outerwear", query:"jackets", icon:"J", description:"Jackets, windbreakers and outerwear."},
    activewear: {title:"Activewear", query:"activewear", icon:"A", description:"Athletic apparel, leggings, shorts and performance wear."},
    bags: {title:"Bags", query:"bags", icon:"B", description:"Crossbody bags, totes, backpacks and everyday bags."},
    shoes: {title:"Shoes", query:"shoes", icon:"S", description:"Sneakers, canvas shoes and slides."},
    accessories: {title:"Accessories", query:"accessories", icon:"X", description:"Hats, caps, tags and everyday accessories."},
    home: {title:"Home", query:"home", icon:"O", description:"Rugs, pillows, blankets and useful home finds."},
    tech: {title:"Phone & Tech", query:"tech", icon:"P", description:"Phone cases and connected accessories."},
    travel: {title:"Travel", query:"travel", icon:"R", description:"Travel bags, tags, bottles and useful travel items."},
    gifts: {title:"Gifts", query:"gifts", icon:"G", description:"Gift ideas from live approved catalogs."},
    perfume: {title:"Perfume & Fragrance", query:"women perfume fragrance", icon:"F", description:"Waiting for an approved fragrance supplier feed."},
    beauty: {title:"Beauty & Skincare", query:"beauty skincare makeup", icon:"Y", description:"Waiting for an approved beauty supplier feed."},
    jewelry: {title:"Jewelry", query:"women jewelry necklace bracelet earrings", icon:"Q", description:"Waiting for an approved jewelry supplier feed."}
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
    if (/\b(dress|dresses|skirt|skirts)\b/.test(t)) return "dresses";
    if (/\b(hoodie|hoodies|sweatshirt|sweatshirts)\b/.test(t)) return "hoodies";
    if (/\b(jacket|jackets|windbreaker|bomber|letterman)\b/.test(t)) return "jackets";
    if (/\b(athletic|performance|legging|leggings|sports bra|shorts|yoga|rash guard|joggers|track pants)\b/.test(t)) return "activewear";
    if (/(handbag|purse|crossbody|tote|backpack|\bbag\b)/.test(t)) return "bags";
    if (/(shoe|sneaker|slide|heel)/.test(t)) return "shoes";
    if (/(hat|cap|wallet|belt|accessor|beanie|\btag\b)/.test(t)) return "accessories";
    if (/(travel|luggage|suitcase|duffle|weekender)/.test(t)) return "travel";
    if (/(home|rug|pillow|blanket|decor|coaster|poster|canvas)/.test(t)) return "home";
    if (/(phone|iphone|samsung|airpods|magsafe|tech|electronics)/.test(t)) return "tech";
    if (/\b(men(?:'s|s)?|unisex)\b/.test(t)) return "men";
    if (/\bwomen(?:'s|s)?\b/.test(t)) return "women";
    if (/\b(shirt|shirts|tee|tees|t-shirt|top|tops|tank|polo)\b/.test(t)) return "tops";
    return "gifts";
  }

  function slugFromQuery(query) {
    const q = String(query || "").toLowerCase();
    if (/perfume|fragrance/.test(q)) return "perfume";
    if (/jewel|necklace|bracelet|earring|ring/.test(q)) return "jewelry";
    if (/beauty|skincare|makeup/.test(q)) return "beauty";
    if (/dress|skirt/.test(q)) return "dresses";
    if (/hoodie|sweatshirt/.test(q)) return "hoodies";
    if (/jacket|outerwear|windbreaker|bomber/.test(q)) return "jackets";
    if (/activewear|fitness|gym|athletic|legging|yoga|performance/.test(q)) return "activewear";
    if (/handbag|purse|crossbody|backpack|\bbag/.test(q)) return "bags";
    if (/shoe|sneaker|heel|slide/.test(q)) return "shoes";
    if (/hat|cap|wallet|belt|accessor|beanie/.test(q)) return "accessories";
    if (/travel|luggage|duffle|weekender/.test(q)) return "travel";
    if (/home|decor|rug|pillow|blanket/.test(q)) return "home";
    if (/phone|tech|electronic|airpods|magsafe/.test(q)) return "tech";
    if (/\bmen\b|men's|mens/.test(q)) return "men";
    if (/\bwomen\b|women's|womens/.test(q)) return "women";
    if (/shirt|t-shirt|tops|tank|polo/.test(q)) return "tops";
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
