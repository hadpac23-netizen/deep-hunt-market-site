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
  H.canonicalTaxonomy = Object.freeze({
    version:"canonical50-v2",
    defs:Object.freeze({...canonicalDefs}),
    groups:Object.freeze(Object.fromEntries(Object.entries(groupFor).map(([k,v])=>[k,Object.freeze([...v])])))
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
