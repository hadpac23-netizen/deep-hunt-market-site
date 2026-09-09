(() => {
  const functionsBase = "https://zszlnahjqmwozwubetkm.supabase.co/functions/v1";
  const publishableKey = "sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
  const cartKey = "hunt_deal_cart_v1";
  const signalKey = "hunt_deal_boom_signals_v1";
  const preferenceKey = "hunt_shopping_preferences_v1";
  const blocked = [
    "gun","firearm","ammunition","ammo","weapon","switchblade","taser",
    "cannabis","marijuana","thc","cocaine","heroin","meth","steroid",
    "vape","cigarette","nicotine","beer","wine","vodka","casino",
    "sportsbook","betting","porn","sex toy","spyware"
  ];

  const categoryDefs = {
    women: {title:"Women's Fashion", query:"women", icon:"W", description:"Women's apparel, everyday fashion and seasonal styles."},
    men: {title:"Men's Fashion", query:"men", icon:"M", description:"Men's apparel only: shirts, hoodies, jackets, bottoms and everyday styles."},
    dresses: {title:"Dresses & Skirts", query:"dresses", icon:"D", description:"Dresses and skirts from the connected live catalog."},
    tops: {title:"Tops & T-Shirts", query:"tops", icon:"T", description:"T-shirts, tops, tanks, polos and blouses."},
    bottoms: {title:"Bottoms", query:"bottoms pants shorts jeans", icon:"B", description:"Pants, shorts, jeans, joggers and leggings."},
    hoodies: {title:"Hoodies & Sweatshirts", query:"hoodies", icon:"H", description:"Hoodies, sweatshirts and warm layers."},
    knitwear: {title:"Knitwear", query:"sweaters cardigans knitwear", icon:"N", description:"Sweaters, cardigans and knit layers."},
    jackets: {title:"Jackets & Outerwear", query:"jackets", icon:"J", description:"Jackets, windbreakers and outerwear."},
    activewear: {title:"Activewear", query:"activewear", icon:"A", description:"Athletic apparel, leggings, shorts and performance wear."},
    bags: {title:"Bags", query:"bags", icon:"B", description:"Crossbody bags, totes, backpacks and everyday bags."},
    shoes: {title:"Shoes", query:"shoes", icon:"S", description:"Sneakers, canvas shoes and slides."},
    accessories: {title:"Accessories", query:"accessories", icon:"X", description:"Hats, caps, tags and everyday accessories."},
    home: {title:"Home", query:"home", icon:"O", description:"Decor, useful home finds and everyday living products."},
    storage: {title:"Storage & Organization", query:"storage organizer", icon:"S", description:"Closet, kitchen and home storage solutions."},
    bedding: {title:"Bedding", query:"bedding sheets duvet comforter", icon:"D", description:"Bedding, blankets, pillowcases and soft home essentials."},
    cleaning: {title:"Cleaning & Laundry", query:"cleaning laundry", icon:"C", description:"Household cleaning and laundry accessories."},
    tech: {title:"Phone & Tech", query:"tech", icon:"P", description:"Phones, electronics and connected accessories from live supplier feeds."},
    phoneaccessories: {title:"Phone Accessories", query:"phone accessories", icon:"A", description:"Cases, stands, charging cables and phone accessories."},
    gaming: {title:"Gaming Accessories", query:"gaming accessories", icon:"G", description:"Gaming accessories and desk-ready gear from connected supplier feeds."},
    sports: {title:"Sports & Fitness", query:"sports fitness", icon:"F", description:"Sports, fitness and active-lifestyle accessories."},
    outdoors: {title:"Outdoor & Garden", query:"outdoor garden picnic", icon:"G", description:"Outdoor, garden and picnic products."},
    kitchen: {title:"Kitchen", query:"kitchen", icon:"K", description:"Kitchen organizers, cookware accessories and useful everyday finds."},
    lighting: {title:"Lighting", query:"lighting", icon:"L", description:"Decorative lighting, desk lights and home lighting accessories."},
    bath: {title:"Bath & Bathroom", query:"bathroom bath", icon:"B", description:"Bathroom organizers and bath accessories."},
    toys: {title:"Toys & Play", query:"kids toys", icon:"T", description:"Selected toys, puzzles and creative play products."},
    crafts: {title:"Arts & Crafts", query:"crafts sewing painting", icon:"C", description:"Crafting, sewing, drawing and hobby supplies."},
    party: {title:"Party & Celebration", query:"party decorations gift wrap", icon:"P", description:"Party decorations, gift wrap and celebration supplies."},
    travel: {title:"Travel", query:"travel", icon:"R", description:"Travel bags, tags, bottles and useful travel items."},
    gifts: {title:"Gifts", query:"gifts", icon:"G", description:"Gift ideas from live approved catalogs."},
    kids: {title:"Kids & Youth", query:"kids", icon:"K", description:"Kids and youth apparel from the connected live catalog."},
    hats: {title:"Hats & Caps", query:"hats", icon:"C", description:"Caps, hats, beanies and headwear."},
    drinkware: {title:"Drinkware", query:"drinkware", icon:"U", description:"Mugs, bottles and tumblers."},
    wallart: {title:"Wall Art", query:"wallart", icon:"L", description:"Posters, canvas and wall decor."},
    blankets: {title:"Blankets & Towels", query:"blankets", icon:"N", description:"Blankets, towels and soft home essentials."},
    stickers: {title:"Stickers", query:"stickers", icon:"I", description:"Sticker sheets and decorative stickers."},
    stationery: {title:"Stationery", query:"stationery", icon:"E", description:"Notebooks, journals and calendars."},
    pets: {title:"Pets", query:"pets", icon:"V", description:"Pet accessories and selected pet products."},
    socks: {title:"Socks", query:"socks", icon:"Z", description:"Printed and embroidered socks."},
    swimwear: {title:"Swimwear", query:"swimwear", icon:"S", description:"Swimwear and swim-focused apparel."},
    office: {title:"Office & Desk", query:"office", icon:"D", description:"Desk mats, calendars, mouse pads and notebooks."},
    pillows: {title:"Pillows", query:"pillows", icon:"P", description:"Decorative pillows and pillow products."},
    ornaments: {title:"Ornaments", query:"ornaments", icon:"R", description:"Seasonal and decorative ornaments."},
    perfume: {title:"Perfume & Fragrance", query:"women perfume fragrance", icon:"F", description:"Live when matched from connected approved supplier feeds."},
    beauty: {title:"Beauty & Skincare", query:"beauty skincare makeup", icon:"Y", description:"Beauty and skincare products matched from connected approved supplier feeds."},
    jewelry: {title:"Jewelry", query:"women jewelry necklace bracelet earrings", icon:"Q", description:"Jewelry and accessories matched from connected approved supplier feeds."}
  };

  const categoryGroups = [
    {title:"Women & Men", items:["women","men","dresses","tops","bottoms","hoodies","jackets","knitwear","activewear","swimwear","socks"]},
    {title:"Beauty & Style", items:["bags","shoes","hats","accessories","jewelry","beauty","perfume"]},
    {title:"Home & Living", items:["home","kitchen","storage","bedding","bath","lighting","cleaning","pillows","blankets","wallart","drinkware"]},
    {title:"Tech & Gaming", items:["tech","phoneaccessories","gaming"]},
    {title:"Sports & Outdoors", items:["sports","outdoors","travel"]},
    {title:"Kids & Pets", items:["kids","toys","pets"]},
    {title:"Gifts, Crafts & Office", items:["gifts","party","crafts","ornaments","stickers","stationery","office"]}
  ];


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
    if (/\b(pet|dog|cat)\b/.test(t)) return "pets";
    if (/\b(toy|toys|puzzle|plush|building block|craft kit|slime)\b/.test(t)) return "toys";
    if (/\b(kids?|youth|toddler|baby|newborn|child|children|boys?|girls?|infant)\b/.test(t)) return "kids";
    if (/(perfume|fragrance|eau de|parfum|toilette spray)/.test(t)) return "perfume";
    if (/(beauty|skincare|makeup|cosmetic|serum|cream)/.test(t)) return "beauty";
    if (/(jewelry|jewellery|necklace|bracelet|earring|ring)/.test(t)) return "jewelry";
    if (/\b(swim|swimsuit|bikini|swim trunks)\b/.test(t)) return "swimwear";
    if (/\b(sock|socks)\b/.test(t)) return "socks";
    if (/\b(sticker|stickers)\b/.test(t)) return "stickers";
    if (/\b(ornament|ornaments)\b/.test(t)) return "ornaments";
    if (/\b(notebook|journal|calendar)\b/.test(t)) return "stationery";
    if (/\b(desk mat|desk calendar)\b/.test(t)) return "office";
    if (/\b(pillow|pillows)\b/.test(t)) return "pillows";
    if (/\b(blanket|blankets|towel|towels)\b/.test(t)) return "blankets";
    if (/\b(poster|posters|canvas|wall art|flag|framed)\b/.test(t)) return "wallart";
    if (/\b(mug|mugs|bottle|bottles|tumbler|tumblers|cup|cups)\b/.test(t)) return "drinkware";
    if (/\b(hat|hats|cap|caps|beanie|bucket hat)\b/.test(t)) return "hats";
    if (/\b(dress|dresses|skirt|skirts)\b/.test(t)) return "dresses";
    if (/\b(hoodie|hoodies|sweatshirt|sweatshirts)\b/.test(t)) return "hoodies";
    if (/\b(jacket|jackets|windbreaker|bomber|letterman)\b/.test(t)) return "jackets";
    if (/\b(athletic|performance|legging|leggings|sports bra|shorts|yoga|rash guard|joggers|track pants)\b/.test(t)) return "activewear";
    if (/(handbag|purse|crossbody|tote|backpack|\bbag\b)/.test(t)) return "bags";
    if (/(shoe|sneaker|slide|heel)/.test(t)) return "shoes";
    if (/(hat|cap|wallet|belt|accessor|beanie|\btag\b)/.test(t)) return "accessories";
    if (/(phone case|mobile case|screen protector|phone stand|charging cable)/.test(t)) return "phoneaccessories";
    if (/(gaming|gamer|gamepad|controller|headset stand|mouse ?pads?)/.test(t)) return "gaming";
    if (/(storage|organizer|closet|rack|shelf)/.test(t)) return "storage";
    if (/(bedding|bed sheet|duvet|comforter|pillowcase)/.test(t)) return "bedding";
    if (/(cleaning|laundry|mop|squeegee|dust)/.test(t)) return "cleaning";
    if (/(kitchen|cookware|utensil|bakeware|lunch box|food storage)/.test(t)) return "kitchen";
    if (/(lamp|lighting|night light|desk light)/.test(t)) return "lighting";
    if (/(bathroom|bath mat|shower|soap dispenser)/.test(t)) return "bath";
    if (/(craft|sewing|knitting|crochet|painting|drawing|scrapbook|beading)/.test(t)) return "crafts";
    if (/(party|birthday|gift wrap|balloon)/.test(t)) return "party";
    if (/(sports|fitness|running|cycling|yoga)/.test(t)) return "sports";
    if (/(outdoor|camping|picnic|hiking|garden)/.test(t)) return "outdoors";
    if (/(travel|luggage|suitcase|duffle|weekender)/.test(t)) return "travel";
    if (/(home|rug|pillow|blanket|decor|coaster|poster|canvas)/.test(t)) return "home";
    if (/(phone|iphone|samsung|airpods|magsafe|tech|electronics)/.test(t)) return "tech";
    if (/\bmen(?:'s|s)?\b/.test(t)) return "men";
    if (/\bwomen(?:'s|s)?\b/.test(t)) return "women";
    if (/\b(shirt|shirts|tee|tees|t-shirt|top|tops|tank|polo)\b/.test(t)) return "tops";
    return "gifts";
  }

  const searchAliases = {
    women:["women","woman","ladies","נשים","אופנת נשים","نساء","نسائي","mujeres","femmes"],
    men:["men","mens","גברים","אופנת גברים","رجال","رجالي","hombres","hommes"],
    perfume:["perfume","fragrance","בשמים","בושם","عطور","عطر","parfum"],
    beauty:["beauty","skincare","makeup","יופי","טיפוח","איפור","تجميل","عناية بالبشرة","مكياج","belleza","beauté"],
    jewelry:["jewelry","jewellery","תכשיטים","שרשרת","צמיד","مجوهرات","قلادة","سوار","joyería","bijoux"],
    shoes:["shoes","sneakers","נעליים","נעל","أحذية","حذاء","zapatos","chaussures"],
    bags:["bags","handbags","purse","תיקים","תיק","حقائب","حقيبة","bolsos","sacs"],
    tech:["tech","electronics","phone","טכנולוגיה","אלקטרוניקה","טלפון","تقنية","إلكترونيات","هاتف","tecnología","électronique"],
    home:["home","decor","בית","עיצוב לבית","منزل","ديكور","hogar","maison"],
    kitchen:["kitchen","מטבח","مطبخ","cocina","cuisine"],
    kids:["kids","children","ילדים","ילד","أطفال","طفل","niños","enfants"],
    toys:["toys","toy","צעצועים","צעצוע","ألعاب","لعبة","juguetes","jouets"],
    sports:["sports","fitness","ספורט","כושר","رياضة","لياقة","deportes","sport"],
    travel:["travel","luggage","נסיעות","מזוודות","سفر","حقائب سفر","viaje","voyage"],
    gifts:["gifts","gift","מתנות","מתנה","هدايا","هدية","regalos","cadeaux"],
    accessories:["accessories","אביזרים","אקססוריז","إكسسوارات","اكسسوارات","accesorios","accessoires"]
  };
  const brandAliases = {
    "dior":["דיור","ديور"],
    "chanel":["שאנל","شانيل"],
    "tom ford":["טום פורד","توم فورد"],
    "armani":["ארמני","ارماني","أرماني"],
    "versace":["ורסאצ'ה","ורסאצה","فيرساتشي"],
    "ysl":["איב סן לורן","سان لوران","ايف سان لوران"],
    "gucci":["גוצ'י","גוצי","غوتشي"],
    "hugo boss":["הוגו בוס","هوجو بوس"],
    "creed":["קריד","كريد"],
    "lancome":["לנקום","لانكوم"],
    "givenchy":["ז'יבנשי","זיבנשי","جيفنشي"],
    "rabanne":["רבאן","رابان"],
    "carolina herrera":["קרולינה הררה","كارولينا هيريرا"],
    "burberry":["ברברי","بربري"],
    "hermes":["הרמס","هيرمس"],
    "prada":["פראדה","برادا"],
    "valentino":["ולנטינו","فالنتينو"]
  };

  const foldSearch = value => String(value || "").toLowerCase().replace(/[’']/g,"").replace(/\s+/g," ").trim();

  function normalizeSearchQuery(query) {
    const original=String(query||"").trim().slice(0,120);
    if(!original)return "";
    let q=foldSearch(original);
    for(const [canonical,aliases] of Object.entries(brandAliases)){
      for(const alias of aliases){
        const a=foldSearch(alias);
        if(q.includes(a))q=q.split(a).join(canonical);
      }
    }
    for(const [slug,aliases] of Object.entries(searchAliases)){
      for(const alias of aliases){
        const a=foldSearch(alias);
        if(q===a)return categoryDefs[slug]?.query||slug;
        if(q.includes(a)){
          const canonical=categoryDefs[slug]?.query?.split(" ")[0]||slug;
          q=q.split(a).join(canonical);
        }
      }
    }
    return q.replace(/\s+/g," ").trim();
  }

  function resolveSearchIntent(query) {
    const original=String(query||"").trim().slice(0,120);
    if(!original)return {kind:"empty",query:"",slug:null};
    const folded=foldSearch(original);
    for(const [slug,aliases] of Object.entries(searchAliases)){
      if(aliases.some(alias=>foldSearch(alias)===folded)){
        return {kind:"category",slug,query:categoryDefs[slug]?.query||slug,original};
      }
    }
    const normalized=normalizeSearchQuery(original);
    const inferred=slugFromQuery(normalized);
    const womenFallback=inferred==="women" && !/\bwomen\b|women's|womens|dress|skirt|shirt|t-shirt|tops|tank|polo/.test(normalized);
    return {kind:"search",slug:womenFallback?null:inferred,query:normalized||original,original};
  }

  function detectBrand(value) {
    const explicit=typeof value==="object" ? String(value?.brand||"").trim() : "";
    if(explicit && explicit.length<=80)return explicit;
    const text=typeof value==="object" ? String(value?.title||"") : String(value||"");
    const normalized=normalizeSearchQuery(text);
    const names=Object.keys(brandAliases).sort((a,b)=>b.length-a.length);
    return names.find(name=>normalized.includes(name)) || "";
  }

  function slugFromQuery(query) {
    const q = String(query || "").toLowerCase();
    if (/perfume|fragrance/.test(q)) return "perfume";
    if (/jewel|necklace|bracelet|earring|ring/.test(q)) return "jewelry";
    if (/beauty|skincare|makeup/.test(q)) return "beauty";
    if (/kids?|youth|toddler|baby|child|children|boys?|girls?|infant/.test(q)) return "kids";
    if (/swimwear|swimsuit|bikini|swim trunks/.test(q)) return "swimwear";
    if (/\bsocks?\b/.test(q)) return "socks";
    if (/stickers?/.test(q)) return "stickers";
    if (/\bpets?\b|dog|cat/.test(q)) return "pets";
    if (/ornaments?/.test(q)) return "ornaments";
    if (/stationery|notebook|journal|calendar/.test(q)) return "stationery";
    if (/\boffice\b|desk mat|mouse pad/.test(q)) return "office";
    if (/pillows?/.test(q)) return "pillows";
    if (/blankets?|towels?/.test(q)) return "blankets";
    if (/wallart|wall art|poster|canvas|framed/.test(q)) return "wallart";
    if (/drinkware|mug|bottle|tumbler/.test(q)) return "drinkware";
    if (/\bhats?\b|\bcaps?\b|beanie/.test(q)) return "hats";
    if (/dress|skirt/.test(q)) return "dresses";
    if (/hoodie|sweatshirt/.test(q)) return "hoodies";
    if (/jacket|outerwear|windbreaker|bomber/.test(q)) return "jackets";
    if (/activewear|fitness|gym|athletic|legging|yoga|performance/.test(q)) return "activewear";
    if (/handbag|purse|crossbody|backpack|\bbag/.test(q)) return "bags";
    if (/shoe|sneaker|heel|slide/.test(q)) return "shoes";
    if (/hat|cap|wallet|belt|accessor|beanie/.test(q)) return "accessories";
    if (/phone accessories|phone case|screen protector|phone stand|charging cable/.test(q)) return "phoneaccessories";
    if (/gaming|gamepad|controller/.test(q)) return "gaming";
    if (/storage|organizer|closet|rack|shelf/.test(q)) return "storage";
    if (/bedding|bed sheet|duvet|comforter|pillowcase/.test(q)) return "bedding";
    if (/cleaning|laundry|mop|squeegee/.test(q)) return "cleaning";
    if (/kitchen|cookware|utensil|bakeware/.test(q)) return "kitchen";
    if (/lighting|lamp|night light|desk light/.test(q)) return "lighting";
    if (/bathroom|bath|shower|soap dispenser/.test(q)) return "bath";
    if (/crafts?|sewing|painting|drawing|scrapbook/.test(q)) return "crafts";
    if (/party|birthday|gift wrap|balloon/.test(q)) return "party";
    if (/toys?|puzzle|plush|building block/.test(q)) return "toys";
    if (/sports|fitness|running|cycling|yoga/.test(q)) return "sports";
    if (/outdoor|camping|picnic|hiking|garden/.test(q)) return "outdoors";
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
    const weights = {search:1, category:2, view:3, like:5, cart:6, save:8, survey:12};
    const state = signals();
    state[slug] = Math.min(100, Math.max(0, Number(state[slug] || 0) + Number(weights[action] || 1)));
    writeJson(signalKey, state);
    return state[slug];
  }
  const shoppingPreferences = () => readJson(preferenceKey, {categories:[],price_band:"any",priorities:[],discovery_modes:[]});
  function saveShoppingPreferences(value, applySignals=true) {
    const safe = {
      categories:Array.isArray(value?.categories)?value.categories.filter(x=>categoryDefs[x]).slice(0,40):[],
      price_band:["any","under25","25to50","50to100","100plus"].includes(value?.price_band)?value.price_band:"any",
      priorities:Array.isArray(value?.priorities)?value.priorities.map(String).slice(0,10):[],
      discovery_modes:Array.isArray(value?.discovery_modes)?value.discovery_modes.map(String).slice(0,10):[]
    };
    writeJson(preferenceKey,safe);
    if(applySignals) safe.categories.forEach(slug=>recordSignal(slug,"survey"));
    return safe;
  }
  function personalScore(product) {
    const category = inferCategory(product);
    const preferenceBoost = shoppingPreferences().categories.includes(category) ? 20 : 0;
    return Number(signals()[category] || 0) + preferenceBoost;
  }
  function personalReason(product) {
    const category = inferCategory(product);
    const preferred = shoppingPreferences().categories.includes(category);
    const score = personalScore(product);
    if (preferred) return `Matches a shopping category you selected in your HUNT survey.`;
    return score > 0 ? `Matches your recent ${categoryDefs[category]?.title || category} activity on this device.` : "BOOM is still learning from your views, likes, saves and shopping survey.";
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
    window.HuntAnalytics?.addToCart(row, product);
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
    window.HuntAnalytics?.search({
      category: slugFromQuery(clean),
      resultCount: Array.isArray(data.results) ? data.results.length : 0
    });
    return data;
  }

  const productUrl = product => `product.html?provider=${encodeURIComponent(product?.provider || "Printful")}&id=${encodeURIComponent(product?.item_id || "")}`;
  const categoryUrl = slug => `category.html?c=${encodeURIComponent(categoryDefs[slug] ? slug : "women")}`;

  window.HuntCore = {
    functionsBase,publishableKey,cartKey,signalKey,preferenceKey,categoryDefs,categoryGroups,esc,money,safeQuery,
    inferCategory,slugFromQuery,normalizeSearchQuery,resolveSearchIntent,detectBrand,recordSignal,personalScore,personalReason,signals,shoppingPreferences,saveShoppingPreferences,
    cart,saveCart,addCart,cartCount,updateCartBadges,storefront,search,productUrl,categoryUrl
  };
})();
