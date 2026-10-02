(() => {
  const H = window.HuntCore;
  if (!H?.categoryDefs || !Array.isArray(H.categoryGroups)) return;

  const def = (title, parent, icon="·") => ({
    title,
    query: title.toLowerCase(),
    icon,
    parent,
    canonical: true,
    description: `${title} from HUNT's canonical storefront taxonomy.`
  });

  const canonicalDefs = {
    "women-dresses": def("Women's Dresses", "women", "D"),
    "women-tops": def("Women's Tops", "women", "T"),
    "women-bottoms": def("Women's Bottoms", "women", "B"),
    "women-jumpsuits": def("Jumpsuits & Playsuits", "women", "J"),
    "women-loungewear": def("Women's Loungewear", "women", "L"),
    "women-maternity": def("Maternity & Nursing", "women", "M"),
    "women-nightwear": def("Women's Nightwear", "women", "N"),
    "women-occasionwear": def("Women's Occasionwear", "women", "O"),
    "women-tailoring": def("Women's Tailoring", "women", "S"),
    "women-underwear": def("Women's Underwear", "women", "U"),

    "men-tops": def("Men's Tops", "men", "T"),
    "men-shirts": def("Men's Shirts", "men", "S"),
    "men-bottoms": def("Men's Bottoms", "men", "B"),
    "men-jeans": def("Men's Jeans", "men", "J"),
    "men-shorts": def("Men's Shorts", "men", "S"),
    "men-loungewear": def("Men's Loungewear", "men", "L"),
    "men-nightwear": def("Men's Nightwear", "men", "N"),
    "men-swimwear": def("Men's Swimwear", "men", "W"),
    "men-tailoring": def("Men's Tailoring", "men", "S"),
    "men-underwear": def("Men's Underwear", "men", "U"),

    "kids-underwear": def("Kids' Underwear", "kids", "U"),
    "kids-nightwear": def("Kids' Nightwear", "kids", "N"),
    "kids-occasionwear": def("Kids' Occasionwear", "kids", "O"),
    "kids-schoolwear": def("Kids' Schoolwear", "kids", "S"),
    "kids-swimwear": def("Kids' Swimwear", "kids", "W"),
    "boys": def("Boys' Clothing", "kids", "B"),
    "girls": def("Girls' Clothing", "kids", "G"),

    "baby": def("Baby", "baby", "B"),
    "baby-bedding": def("Baby Bedding", "baby", "D"),
    "baby-bodysuits": def("Baby Bodysuits", "baby", "B"),
    "baby-sets": def("Baby Sets", "baby", "S"),
    "baby-sleepsuits": def("Baby Sleepsuits", "baby", "N"),
    "newborn": def("Newborn", "baby", "N"),
    "nursery": def("Nursery", "baby", "R"),

    "curtains-blinds": def("Curtains & Blinds", "home", "C"),
    "cushions-throws": def("Cushions & Throws", "home", "C"),
    "dinnerware": def("Dinnerware", "home", "D"),
    "furniture": def("Furniture", "home", "F"),
    "garden": def("Garden", "home", "G"),
    "glassware": def("Glassware", "home", "G"),
    "home-decor": def("Home Decor", "home", "H"),
    "laundry": def("Laundry", "home", "L"),
    "mirrors": def("Mirrors", "home", "M"),
    "rugs-runners": def("Rugs & Runners", "home", "R"),
    "tableware": def("Tableware", "home", "T"),
    "towels": def("Towels & Bathmats", "home", "T"),
    "wall-art": def("Wall Art & Canvases", "home", "W"),

    "sports-outdoor": def("Sports & Outdoor", "sports", "S"),
    "tech-accessories": def("Tech Accessories", "tech", "T"),
    "wallets-small-accessories": def("Wallets & Small Accessories", "accessories", "W")
  };

  Object.assign(H.categoryDefs, canonicalDefs);

  const page = new URL(location.href);
  const requested = String(page.searchParams.get("c") || "women").toLowerCase();
  const requestedSub = String(page.searchParams.get("sub") || "").toLowerCase();
  const requestedDef = H.categoryDefs[requested];
  const requestedSubDef = H.categoryDefs[requestedSub];
  const parent = requestedSubDef?.parent === requested ? requested : (requestedDef?.parent || requested);

  const groupFor = {
    women: ["women-dresses","women-tops","women-bottoms","women-jumpsuits","women-loungewear","women-nightwear","women-occasionwear","women-tailoring","women-maternity","women-underwear","hoodies","jackets","knitwear","swimwear","shoes","accessories"],
    men: ["men-tops","men-shirts","men-bottoms","men-jeans","men-shorts","men-loungewear","men-nightwear","men-tailoring","men-swimwear","men-underwear","hoodies","jackets","knitwear","shoes","accessories"],
    kids: ["boys","girls","kids-underwear","kids-nightwear","kids-occasionwear","kids-schoolwear","kids-swimwear","shoes","accessories"],
    baby: ["baby","newborn","baby-bodysuits","baby-sets","baby-sleepsuits","baby-bedding","nursery","shoes"],
    home: ["home-decor","furniture","storage","bedding","cushions-throws","curtains-blinds","rugs-runners","mirrors","lighting","bath","towels","laundry","kitchen","dinnerware","tableware","glassware","garden","wall-art"],
    tech: ["tech","tech-accessories","phonecases","phoneaccessories","gaming"],
    sports: ["sports","sports-outdoor","outdoors","travel"],
    accessories: ["accessories","wallets-small-accessories","bags","hats","hairaccessories","jewelry"]
  };
  const canonicalSourceAliases = Object.freeze({
    "women-dresses":"dresses",
    "women-tops":"tops",
    "women-bottoms":"bottoms",
    "women-loungewear":"loungewear",
    "women-maternity":"maternity",
    "women-nightwear":"sleepwear",
    "women-underwear":"womenunderwear",
    "men-loungewear":"loungewear",
    "men-nightwear":"mensleepwear",
    "men-swimwear":"swimwear",
    "men-tailoring":"suits",
    "men-underwear":"menunderwear",
    "kids-underwear":"kidsunderwear",
    "wall-art":"wallart",
    "sports-outdoor":"outdoors"
  });
  const legacyCanonicalAliases = Object.freeze({
    dresses:"women-dresses",
    tops:"women-tops",
    bottoms:"women-bottoms",
    sleepwear:"women-nightwear",
    womenunderwear:"women-underwear",
    menunderwear:"men-underwear",
    suits:"men-tailoring",
    wallart:"wall-art"
  });

  const titleOf = item => String(item?.title || "").toLowerCase().replace(/\s+/g," ").trim();
  const explicitWomen = text => /\b(women(?:'s)?|woman|female|ladies)\b/.test(text);
  const explicitMen = text => /\b(men(?:'s)?|man|male|gentlemen)\b/.test(text);
  const childTerms = /\b(baby|newborn|toddler|kid|kids|child|children|boys?|girls?|youth)\b/;
  const nonApparel = /\b(rack|hanger|wardrobe|cabinet|organizer|storage|trash|garbage|umbrella|carport|patio|toilet|furniture|drawer|table|shelf|bungee|dispenser)\b/;
  const unsafeMarketplaceOps = /\b(temu|tiktok|self[- ]?pickup|pick[- ]?up service|shipment from walmart|logistics only)\b/;
  const patterns = Object.freeze({
    "women-dresses": /\bdress(?:es)?\b/,
    "women-tops": /\b(shirt|shirts|tee|t-shirt|top|tops|tank|polo|blouse|blouses|camisole)\b/,
    "women-bottoms": /\b(pants?|trousers?|shorts?|jeans?|joggers?|leggings?|skirts?)\b/,
    "women-jumpsuits": /\b(jumpsuit|playsuit|romper)\b/,
    "women-loungewear": /\b(lounge|loungewear|homewear|home wear)\b/,
    "women-maternity": /\b(maternity|nursing|pregnan)\b/,
    "women-nightwear": /\b(pajama|pyjama|sleepwear|nightwear|nightgown|nightdress|robe)\b/,
    "women-occasionwear": /\b(evening|gown|formal|cocktail|occasion|party dress)\b/,
    "women-tailoring": /\b(suit|blazer|tailor|waistcoat|formal jacket)\b/,
    "women-underwear": /\b(underwear|lingerie|bra|brief|panty|panties)\b/,
    "men-tops": /\b(shirt|shirts|tee|t-shirt|top|tops|tank|polo)\b/,
    "men-shirts": /\b(shirt|shirts|overshirt)\b/,
    "men-bottoms": /\b(pants?|trousers?|joggers?|chinos?)\b/,
    "men-jeans": /\b(jeans?|denim pants?)\b/,
    "men-shorts": /\bshorts?\b/,
    "men-loungewear": /\b(lounge|loungewear|homewear|home wear)\b/,
    "men-nightwear": /\b(pajama|pyjama|sleepwear|nightwear|robe)\b/,
    "men-swimwear": /\b(swim|swimsuit|board shorts?|swim shorts?|trunks?)\b/,
    "men-tailoring": /\b(suit|blazer|tuxedo|tailor|waistcoat|formal)\b/,
    "men-underwear": /\b(underwear|boxer|brief|trunk)\b/,
    "kids-underwear": /\b(underwear|brief|boxer|base layer|thermal)\b/,
    "kids-nightwear": /\b(pajama|pyjama|sleepwear|nightwear|nightgown)\b/,
    "kids-occasionwear": /\b(occasion|formal|party|ceremony|wedding)\b/,
    "kids-schoolwear": /\b(school|uniform|shirt|blouse|trouser|pants|skirt|cardigan|sweater)\b/,
    "kids-swimwear": /\b(swim|swimsuit|rash guard|bathing suit)\b/,
    "wall-art": /\b(wall art|canvas|poster|wall print|art print)\b/,
    "sports-outdoor": /\b(outdoor|camp|hiking|trek|sport)\b/
  });

  function itemMatchesShelf(slug,item) {
    const defn=canonicalDefs[slug];
    if(!defn?.canonical) return true;
    const text=titleOf(item);
    if(!text || unsafeMarketplaceOps.test(text)) return false;
    if(nonApparel.test(text) && ["women","men","kids"].includes(defn.parent)) return false;
    const gender=String(item?.gender || "").toLowerCase();
    if(defn.parent==="women") {
      if(childTerms.test(text) || explicitMen(text) || gender==="men" || gender==="kids") return false;
      if(gender && !["women","female"].includes(gender) && !explicitWomen(text)) return false;
    }
    if(defn.parent==="men") {
      if(childTerms.test(text) || explicitWomen(text) || gender==="women" || gender==="kids") return false;
      if(gender && !["men","male"].includes(gender) && !explicitMen(text)) return false;
    }
    if(defn.parent==="kids") {
      if(explicitMen(text) || explicitWomen(text)) return false;
      if(!childTerms.test(text) && gender && !["kids","boy","boys","girl","girls","child","children"].includes(gender)) return false;
    }
    if(slug==="women-dresses" && /\b(swimsuit|swimwear|bikini|rash guard|dress pants?|dress trousers?|two[- ]?piece|2[- ]?piece|dress suit|skirt suit|top and skirt|top & skirt)\b/.test(text)) return false;
    if(slug==="women-tops" && /\b(jumpsuit|romper|playsuit|outfit|two[- ]?piece|2[- ]?piece|set|dress)\b/.test(text)) return false;
    if(slug==="women-bottoms" && /\b(jumpsuit|romper|playsuit|outfit|two[- ]?piece|2[- ]?piece|set|suit)\b/.test(text)) return false;
    const pattern=patterns[slug];
    return pattern ? pattern.test(text) : true;
  }

  H.canonicalTaxonomy = Object.freeze({
    version:"canonical50-v4",
    defs:Object.freeze({...canonicalDefs}),
    groups:Object.freeze(Object.fromEntries(Object.entries(groupFor).map(([k,v])=>[k,Object.freeze([...v])]))),
    sourceAliases:canonicalSourceAliases,
    legacyAliases:legacyCanonicalAliases,
    itemMatchesShelf
  });

  const originalCategoryUrl = H.categoryUrl.bind(H);
  H.categoryUrl = slug => {
    const entry = H.categoryDefs[slug];
    if (!entry) return originalCategoryUrl(slug);
    if (entry.canonical && entry.parent && entry.parent !== slug) {
      return `category.html?c=${encodeURIComponent(entry.parent)}&sub=${encodeURIComponent(slug)}`;
    }
    return `category.html?c=${encodeURIComponent(slug)}`;
  };

  // Home and other surfaces may load this file to consume the canonical map and URL contract.
  // Category-specific group injection and storefront behavior stay scoped to category.html.
  if (!/(^|\/)category\.html$/.test(location.pathname)) return;

  const focused = groupFor[parent];
  if (focused) {
    H.categoryGroups.unshift({title:`${H.categoryDefs[parent]?.title || parent} · Exact shelves`,items:focused});
  }

  // category.js natively understands nested exact shelves only for women/men.
  // For other departments, temporarily normalize the runtime URL to the exact shelf
  // before category.js reads location.search, then restore the customer-facing hierarchy.
  if (requestedSub && requestedSubDef?.canonical && requestedSubDef.parent === requested && !["women","men"].includes(requested)) {
    const runtimeUrl = new URL(page.href);
    runtimeUrl.searchParams.set("c", requestedSub);
    runtimeUrl.searchParams.delete("sub");
    history.replaceState(history.state, "", runtimeUrl.href);
    setTimeout(() => history.replaceState(history.state, "", page.href), 0);
  } else if (requestedDef?.canonical && requestedDef.parent && requestedDef.parent !== requested) {
    const publicUrl = new URL(page.href);
    publicUrl.searchParams.set("c", requestedDef.parent);
    publicUrl.searchParams.set("sub", requested);
    setTimeout(() => history.replaceState(history.state, "", publicUrl.href), 0);
  }

  const originalStorefront = H.storefront.bind(H);
  H.storefront = async params => {
    const data = await originalStorefront(params);
    if (String(params?.shelves || "") !== "1" || !data?.shelves) return data;
    const shelves = {...data.shelves};
    for (const [shelf, rows] of Object.entries(shelves)) {
      const inferredGender = shelf.startsWith("women-") ? "women" : shelf.startsWith("men-") ? "men" : "";
      if (!inferredGender || !Array.isArray(rows)) continue;
      shelves[shelf] = rows.map(row => row?.gender ? row : {...row, gender: inferredGender});
    }
    return {...data, shelves};
  };
})();
