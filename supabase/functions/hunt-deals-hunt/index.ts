import { publicStorefrontPayload } from "../_shared/public-price-privacy.mjs";

function publicJson(payload:unknown):string { return JSON.stringify(publicStorefrontPayload(payload)); }

const PUBLIC_KEY = "sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
const ALLOWED_ORIGINS = new Set([
  "https://hadpac23-netizen.github.io",
  "https://deep-hunt-market.netlify.app",
  "http://127.0.0.1:8767",
  "http://localhost:8767"
]);

const BLOCKED_TERMS = [
  "gun", "firearm", "ammunition", "ammo", "weapon", "switchblade", "taser",
  "cannabis", "marijuana", "thc", "cocaine", "heroin", "meth", "steroid",
  "vape", "cigarette", "nicotine", "beer", "wine", "vodka", "casino",
  "sportsbook", "betting", "porn", "sex toy", "spyware"
];

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const netlifyPreview = /^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  return {
    "Access-Control-Allow-Origin": (ALLOWED_ORIGINS.has(origin) || netlifyPreview) ? origin : "https://hadpac23-netizen.github.io",
    "Access-Control-Allow-Headers": "apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json"
  };
}

function authorized(req: Request): boolean {
  return (req.headers.get("apikey") || "") === PUBLIC_KEY;
}

function env(name: string): string {
  return (Deno.env.get(name) || "").trim();
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeQuery(value: unknown): string {
  const clean = cleanText(value).replace(/\s+/g, " ").slice(0, 120);
  if (!clean) throw new Error("query is required");
  const lower = clean.toLowerCase();
  if (BLOCKED_TERMS.some(term => lower.includes(term))) {
    throw new Error("This product category is not available through HUNT DEAL.");
  }
  return clean;
}

function allowedTitle(title: string): boolean {
  const lower = title.toLowerCase();
  return !BLOCKED_TERMS.some(term => lower.includes(term));
}

function score(result: any): number {
  let value = 25;
  if (result.price_amount && result.price_amount > 0 && result.currency) value += 20;
  if (result.affiliate_url && result.affiliate_url.startsWith("https://")) value += 15;
  if (result.availability_verified) value += 10;
  return Math.min(70, value);
}

function basicAuth(user: string, pass: string): string {
  return "Basic " + btoa(user + ":" + pass);
}

async function ebaySearch(query: string, limit: number) {
  const clientId = env("EBAY_CLIENT_ID");
  const secret = env("EBAY_CLIENT_SECRET");
  const campaign = env("EBAY_EPN_CAMPAIGN_ID");
  if (!clientId || !secret || !campaign) throw new Error("AUTH_REQUIRED");

  const tokenRes = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": basicAuth(clientId, secret),
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "https://api.ebay.com/oauth/api_scope"
    })
  });
  if (!tokenRes.ok) throw new Error("eBay auth " + tokenRes.status);
  const tokenData = await tokenRes.json();
  const token = cleanText(tokenData?.access_token);
  if (!token) throw new Error("eBay token missing");

  const url = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(Math.min(limit, 20)));

  const res = await fetch(url, {
    headers: {
      "Authorization": "Bearer " + token,
      "X-EBAY-C-MARKETPLACE-ID": env("EBAY_MARKETPLACE_ID") || "EBAY_US",
      "X-EBAY-C-ENDUSERCTX": "affiliateCampaignId=" + campaign + ",affiliateReferenceId=hunt-deal"
    }
  });
  if (!res.ok) throw new Error("eBay search " + res.status);
  const data = await res.json();
  const items = Array.isArray(data?.itemSummaries) ? data.itemSummaries : [];

  return items.map((raw: any) => {
    const amount = Number(raw?.price?.value);
    const result: any = {
      provider: "eBay",
      item_id: cleanText(raw?.itemId),
      title: cleanText(raw?.title),
      source_url: cleanText(raw?.itemWebUrl),
      affiliate_url: cleanText(raw?.itemAffiliateWebUrl) || null,
      price_amount: Number.isFinite(amount) ? amount : null,
      currency: cleanText(raw?.price?.currency) || null,
      availability_verified: true,
      verdict: "HOLD",
      readiness_score: 0,
      gaps: [
        "Verified commission rate and source.",
        "Independent demand evidence.",
        "On-site checkout approval."
      ]
    };
    result.readiness_score = score(result);
    return result;
  }).filter((x: any) => x.item_id && x.title && x.source_url && allowedTitle(x.title));
}

function amazonTokenEndpoint(version: string): string {
  if (version.startsWith("3.2")) return "https://api.amazon.co.uk/auth/o2/token";
  if (version.startsWith("3.3")) return "https://api.amazon.co.jp/auth/o2/token";
  return "https://api.amazon.com/auth/o2/token";
}

async function amazonSearch(query: string, limit: number) {
  const clientId = env("AMAZON_CREATORS_CLIENT_ID");
  const secret = env("AMAZON_CREATORS_CLIENT_SECRET");
  const partnerTag = env("AMAZON_PARTNER_TAG");
  if (!clientId || !secret || !partnerTag) throw new Error("AUTH_REQUIRED");

  const tokenRes = await fetch(amazonTokenEndpoint(env("AMAZON_CREATORS_CREDENTIAL_VERSION") || "3.1"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: secret,
      scope: "creatorsapi::default"
    })
  });
  if (!tokenRes.ok) throw new Error("Amazon auth " + tokenRes.status);
  const tokenData = await tokenRes.json();
  const token = cleanText(tokenData?.access_token);
  if (!token) throw new Error("Amazon token missing");

  const marketplace = env("AMAZON_MARKETPLACE") || "www.amazon.com";
  const res = await fetch("https://creatorsapi.amazon/catalog/v1/searchItems", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      "x-marketplace": marketplace
    },
    body: JSON.stringify({
      partnerTag,
      marketplace,
      keywords: query,
      itemCount: Math.min(limit, 10),
      resources: [
        "itemInfo.title",
        "images.primary.medium",
        "offersV2.listings.price",
        "offersV2.listings.availability"
      ]
    })
  });
  if (!res.ok) throw new Error("Amazon search " + res.status);
  const data = await res.json();
  const items = Array.isArray(data?.searchResult?.items) ? data.searchResult.items : [];

  return items.map((raw: any) => {
    const listing = Array.isArray(raw?.offersV2?.listings) ? raw.offersV2.listings[0] : null;
    const amount = Number(listing?.price?.money?.amount);
    const result: any = {
      provider: "Amazon",
      item_id: cleanText(raw?.asin),
      title: cleanText(raw?.itemInfo?.title?.displayValue),
      source_url: cleanText(raw?.detailPageURL),
      affiliate_url: cleanText(raw?.detailPageURL) || null,
      price_amount: Number.isFinite(amount) ? amount : null,
      currency: cleanText(listing?.price?.money?.currency) || null,
      availability_verified: listing?.availability?.type === "IN_STOCK",
      verdict: "HOLD",
      readiness_score: 0,
      gaps: [
        "Verified commission rate and source.",
        "Independent demand evidence.",
        "On-site checkout is not supported for Amazon."
      ]
    };
    result.readiness_score = score(result);
    return result;
  }).filter((x: any) => x.item_id && x.title && x.source_url && allowedTitle(x.title));
}

async function impactSearch(query: string, limit: number) {
  const sid = env("IMPACT_ACCOUNT_SID");
  const token = env("IMPACT_AUTH_TOKEN");
  if (!sid || !token) throw new Error("AUTH_REQUIRED");

  const url = new URL("https://api.impact.com/Mediapartners/" + encodeURIComponent(sid) + "/Catalogs/ItemSearch");
  url.searchParams.set("Keyword", query);
  url.searchParams.set("PageSize", String(Math.min(limit, 50)));

  const res = await fetch(url, {
    headers: {
      "Authorization": basicAuth(sid, token),
      "Accept": "application/json"
    }
  });
  if (!res.ok) throw new Error("impact.com search " + res.status);
  const data = await res.json();
  const items = Array.isArray(data) ? data : (Array.isArray(data?.Items) ? data.Items : []);

  return items.map((raw: any) => {
    const amount = Number(raw?.CurrentPrice);
    const result: any = {
      provider: "impact.com",
      item_id: cleanText(raw?.Id || raw?.CatalogItemId),
      title: cleanText(raw?.Name),
      source_url: cleanText(raw?.Url),
      affiliate_url: null,
      price_amount: Number.isFinite(amount) ? amount : null,
      currency: cleanText(raw?.Currency) || null,
      availability_verified: ["InStock", "LimitedAvailability", "PreOrder", "BackOrder"].includes(cleanText(raw?.StockAvailability)),
      verdict: "HOLD",
      readiness_score: 0,
      gaps: [
        "Verified affiliate tracking link.",
        "Verified commission rate and source.",
        "Independent demand evidence.",
        "On-site checkout approval."
      ]
    };
    result.readiness_score = score(result);
    return result;
  }).filter((x: any) => x.item_id && x.title && x.source_url && allowedTitle(x.title));
}

async function etsySearch(query: string, limit: number) {
  const keystring = env("ETSY_API_KEYSTRING");
  const sharedSecret = env("ETSY_SHARED_SECRET");
  if (!keystring || !sharedSecret) throw new Error("AUTH_REQUIRED");

  const url = new URL("https://openapi.etsy.com/v3/application/listings/active");
  url.searchParams.set("keywords", query);
  url.searchParams.set("limit", String(Math.min(limit, 100)));
  url.searchParams.set("sort_on", "score");
  url.searchParams.set("sort_order", "desc");
  url.searchParams.set("is_safe", "true");

  const res = await fetch(url, {
    headers: {
      "x-api-key": keystring + ":" + sharedSecret,
      "Accept": "application/json"
    }
  });
  if (!res.ok) throw new Error("Etsy search " + res.status);
  const data = await res.json();
  const items = Array.isArray(data?.results) ? data.results : [];

  return items.map((raw: any) => {
    const amount = Number(raw?.price?.amount);
    const divisor = Number(raw?.price?.divisor);
    const result: any = {
      provider: "Etsy",
      item_id: String(raw?.listing_id || "").trim(),
      title: cleanText(raw?.title),
      source_url: cleanText(raw?.url),
      affiliate_url: null,
      price_amount:
        Number.isFinite(amount) && Number.isFinite(divisor) && divisor > 0
          ? amount / divisor
          : null,
      currency: cleanText(raw?.price?.currency_code) || null,
      availability_verified:
        cleanText(raw?.state).toLowerCase() === "active" &&
        (!Number.isFinite(Number(raw?.quantity)) || Number(raw?.quantity) > 0),
      verdict: "HOLD",
      readiness_score: 0,
      gaps: [
        "Verified affiliate attribution.",
        "Verified commission rate and source.",
        "Independent demand evidence.",
        "On-site checkout is not supported for Etsy."
      ]
    };
    result.readiness_score = score(result);
    return result;
  }).filter((x: any) => x.item_id && x.title && x.source_url && allowedTitle(x.title));
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function xmlText(block: string, tag: string): string {
  const match = block.match(new RegExp("<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + tag + ">", "i"));
  return match ? decodeXml(match[1].trim()) : "";
}

function xmlMoney(block: string, tag: string): { amount: number | null; currency: string | null } {
  const match = block.match(new RegExp("<" + tag + "\\s+currency=[\"']([^\"']+)[\"'][^>]*>([\\s\\S]*?)<\\/" + tag + ">", "i"));
  if (!match) return { amount: null, currency: null };
  const amount = Number(decodeXml(match[2].trim()));
  return {
    amount: Number.isFinite(amount) ? amount : null,
    currency: cleanText(match[1]).toUpperCase() || null
  };
}

async function rakutenSearch(query: string, limit: number) {
  const clientId = env("RAKUTEN_CLIENT_ID");
  const clientSecret = env("RAKUTEN_CLIENT_SECRET");
  const accountId = env("RAKUTEN_ACCOUNT_ID");
  if (!clientId || !clientSecret || !accountId) throw new Error("AUTH_REQUIRED");

  const tokenKey = btoa(clientId + ":" + clientSecret);
  const tokenRes = await fetch("https://api.linksynergy.com/token", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + tokenKey,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: new URLSearchParams({ scope: accountId })
  });
  if (!tokenRes.ok) throw new Error("Rakuten auth " + tokenRes.status);
  const tokenData = await tokenRes.json();
  const token = cleanText(tokenData?.access_token);
  if (!token) throw new Error("Rakuten token missing");

  const url = new URL("https://api.linksynergy.com/productsearch/1.0");
  url.searchParams.set("keyword", query);
  url.searchParams.set("max", String(Math.min(limit, 100)));

  const res = await fetch(url, {
    headers: {
      "Authorization": "Bearer " + token,
      "Accept": "application/xml"
    }
  });
  if (!res.ok) throw new Error("Rakuten search " + res.status);
  const xml = await res.text();
  const itemBlocks = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)).map(match => match[1]);

  return itemBlocks.map((block: string) => {
    const regular = xmlMoney(block, "price");
    const sale = xmlMoney(block, "saleprice");
    const price = sale.amount !== null ? sale : regular;
    const linkUrl = xmlText(block, "linkurl");
    const result: any = {
      provider: "Rakuten Advertising",
      item_id: xmlText(block, "linkid") || xmlText(block, "sku"),
      title: xmlText(block, "productname"),
      source_url: linkUrl,
      affiliate_url: linkUrl || null,
      price_amount: price.amount,
      currency: price.currency,
      availability_verified: false,
      verdict: "HOLD",
      readiness_score: 0,
      gaps: [
        "Verified commission rate and source from the Offers API.",
        "Independent demand evidence.",
        "On-site checkout is not supported for Rakuten Advertising."
      ]
    };
    result.readiness_score = score(result);
    return result;
  }).filter((x: any) =>
    x.item_id && x.title && x.source_url.startsWith("https://") && allowedTitle(x.title)
  );
}

function printfulQueryTerms(query: string): string[] {
  const generic = new Set(["deal", "deals", "best", "sale", "discount", "shop", "shopping"]);
  const aliases: Record<string, string[]> = {
    fashion: ["dress", "shirt", "top", "hoodie", "legging", "jacket", "skirt", "pants", "apparel"],
    handbags: ["bag", "tote", "crossbody", "backpack", "purse"],
    handbag: ["bag", "tote", "crossbody", "backpack", "purse"],
    purses: ["bag", "tote", "crossbody", "purse"],
    purse: ["bag", "tote", "crossbody", "purse"],
    bags: ["bag", "tote", "crossbody", "backpack"],
    shoes: ["shoe", "canvas", "slide", "sneaker"],
    sneakers: ["shoe", "canvas", "sneaker"],
    accessories: ["access", "bag", "tote", "hat", "cap", "case", "tag"],
    accessory: ["access", "bag", "tote", "hat", "cap", "case", "tag"],
    travel: ["travel", "luggage", "duffle", "tag", "bag", "bottle"],
    gifts: ["gift", "mug", "ornament", "blanket", "poster", "canvas"],
    home: ["home", "rug", "pillow", "blanket", "coaster", "decor"],
    tech: ["case", "phone", "airpods", "magsafe"],
    phone: ["phone", "iphone", "samsung", "case", "magsafe"],
    women: ["women", "woman", "women's", "womens", "female"],
    men: ["men", "man's", "men's", "mens", "male", "unisex"],
    dresses: ["dress", "dresses", "skirt", "skirts"],
    dress: ["dress", "dresses", "skirt", "skirts"],
    tops: ["shirt", "tee", "top", "tank", "polo"],
    hoodies: ["hoodie", "sweatshirt"],
    hoodie: ["hoodie", "sweatshirt"],
    jackets: ["jacket", "windbreaker", "bomber", "letterman"],
    jacket: ["jacket", "windbreaker", "bomber", "letterman"],
    activewear: ["athletic", "performance", "legging", "shorts", "yoga", "rash", "joggers"],
    kids: ["kids", "kid", "youth", "toddler", "baby"],
    hats: ["hat", "cap", "beanie", "bucket"],
    drinkware: ["mug", "bottle", "tumbler", "cup"],
    wallart: ["poster", "canvas", "flag", "framed"],
    blankets: ["blanket", "towel"],
    stickers: ["sticker"],
    stationery: ["notebook", "journal", "calendar"],
    pets: ["pet", "dog", "cat"],
    socks: ["sock"],
    swimwear: ["swim", "swimsuit", "bikini", "trunks"],
    office: ["desk", "mouse", "notebook", "journal", "calendar"],
    pillows: ["pillow"],
    ornaments: ["ornament"],
    fitness: ["fitness", "athletic", "gym", "legging", "shorts", "yoga"],
  };
  const raw = query
    .toLowerCase()
    .replace(/[^a-z0-9' ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((term) => !generic.has(term));

  const expanded = new Set<string>();
  for (const term of raw) {
    expanded.add(term);
    for (const alias of aliases[term] || []) expanded.add(alias);
  }
  return [...expanded];
}

function printfulRelevance(raw: any, query: string): number {
  if (raw?.is_discontinued) return -1;
  const title = cleanText(raw?.title);
  if (!title || !allowedTitle(title)) return -1;
  const haystack = [
    title,
    cleanText(raw?.type_name),
    cleanText(raw?.description)
  ].join(" ").toLowerCase();

  const directQueryTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9' ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const strict = directQueryTerms.filter((term) =>
    ["perfume", "fragrance", "beauty", "skincare", "makeup", "jewelry", "jewellery", "necklace", "bracelet", "earring", "earrings", "ring", "rings"].includes(term)
  );
  const titleLower = title.toLowerCase();
  const primaryTitle = titleLower.split("|")[0].trim();
  if (strict.length && !strict.some((term) => primaryTitle.includes(term))) return 0;

  const categoryRules = [
    {
      triggers: ["handbag", "handbags", "purse", "purses", "bags"],
      pattern: /\b(bag|bags|tote|crossbody|backpack|purse|purses)\b/i,
    },
    {
      triggers: ["shoe", "shoes", "sneaker", "sneakers", "heels"],
      pattern: /\b(shoe|shoes|sneaker|sneakers|slide|slides|heel|heels)\b/i,
    },
    {
      triggers: ["travel", "luggage"],
      pattern: /\b(travel|luggage|duffle|weekender|bottle|towel|blanket|tag|bag|bags)\b/i,
    },
    {
      triggers: ["phone", "electronics", "tech"],
      pattern: /\b(phone|iphone|samsung|airpods|magsafe|case|cases)\b/i,
    },
    {
      triggers: ["fitness", "gym", "activewear"],
      pattern: /\b(fitness|athletic|performance|gym|legging|leggings|shorts|yoga|sports|tank|rash guard|joggers|track pants)\b/i,
    },
    {
      triggers: ["dress", "dresses"],
      pattern: /\b(dress|dresses|skirt|skirts)\b/i,
    },
    {
      triggers: ["hoodie", "hoodies", "sweatshirt", "sweatshirts"],
      pattern: /\b(hoodie|hoodies|sweatshirt|sweatshirts)\b/i,
    },
    {
      triggers: ["jacket", "jackets", "outerwear"],
      pattern: /\b(jacket|jackets|windbreaker|bomber|letterman)\b/i,
    },
    {
      triggers: ["tops", "top", "shirts", "shirt"],
      pattern: /\b(shirt|shirts|tee|tees|t-shirt|t-shirts|top|tops|tank|polo)\b/i,
    },
    {
      triggers: ["kids", "kid", "youth", "toddler", "baby"],
      pattern: /\b(kids?|youth|toddler|baby)\b/i,
    },
    {
      triggers: ["hats", "hat", "caps", "cap", "beanie"],
      pattern: /\b(hat|hats|cap|caps|beanie|bucket hat)\b/i,
    },
    {
      triggers: ["drinkware", "mugs", "mug", "bottles", "bottle", "tumblers", "tumbler"],
      pattern: /\b(mug|mugs|bottle|bottles|tumbler|tumblers|cup|cups)\b/i,
    },
    {
      triggers: ["wallart", "posters", "poster", "canvas"],
      pattern: /\b(poster|posters|canvas|wall art|flag|framed)\b/i,
    },
    {
      triggers: ["blankets", "blanket", "towels", "towel"],
      pattern: /\b(blanket|blankets|towel|towels)\b/i,
    },
    {
      triggers: ["stickers", "sticker"],
      pattern: /\b(sticker|stickers)\b/i,
    },
    {
      triggers: ["stationery", "notebooks", "notebook", "journals", "journal", "calendars", "calendar"],
      pattern: /\b(notebook|notebooks|journal|journals|calendar|calendars)\b/i,
    },
    {
      triggers: ["pets", "pet"],
      pattern: /\b(pet|dog|cat)\b/i,
    },
    {
      triggers: ["socks", "sock"],
      pattern: /\b(sock|socks)\b/i,
    },
    {
      triggers: ["swimwear", "swimsuit", "swimsuits", "bikini", "bikinis"],
      pattern: /\b(swim|swimsuit|swimsuits|bikini|bikinis|swim trunks)\b/i,
    },
    {
      triggers: ["office"],
      pattern: /\b(desk mat|desk calendar|desktop calendar|mouse pad|notebook|journal)\b/i,
    },
    {
      triggers: ["pillows", "pillow"],
      pattern: /\b(pillow|pillows)\b/i,
    },
    {
      triggers: ["ornaments", "ornament"],
      pattern: /\b(ornament|ornaments)\b/i,
    },
  ];
  for (const rule of categoryRules) {
    if (
      directQueryTerms.some((term) => rule.triggers.includes(term)) &&
      !rule.pattern.test(primaryTitle)
    ) return 0;
  }

  const womenOnly = directQueryTerms.includes("women");
  if (womenOnly && !/\b(women(?:'s|s)?|unisex)\b/i.test(primaryTitle)) return 0;

  const menOnly = directQueryTerms.includes("men");
  if (menOnly && !/\b(men(?:'s|s)?|unisex)\b/i.test(primaryTitle)) return 0;

  const dressOnly = directQueryTerms.some((term) => ["dress", "dresses"].includes(term));
  if (dressOnly && /\btree skirt\b/i.test(primaryTitle)) return 0;

  const womenShoes = directQueryTerms.includes("women") &&
    directQueryTerms.some((term) => ["shoe", "shoes", "sneaker", "sneakers", "heels"].includes(term));
  if (womenShoes && !/\bwomen(?:'s|s)?\b/i.test(primaryTitle)) return 0;

  const womenFashion = directQueryTerms.includes("women") &&
    directQueryTerms.some((term) => ["fashion", "dress", "dresses", "tops", "clothing"].includes(term));
  if (womenFashion && !/\b(women(?:'s|s)?|unisex)\b/i.test(primaryTitle)) return 0;

  const menFashion = directQueryTerms.includes("men") &&
    directQueryTerms.some((term) => ["fashion", "shirt", "shirts", "hoodie", "hoodies", "jacket", "jackets", "clothing"].includes(term));
  if (menFashion && !/\b(men(?:'s|s)?|unisex)\b/i.test(primaryTitle)) return 0;

  const terms = printfulQueryTerms(query);
  if (!terms.length) return 0;
  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) score += title.toLowerCase().includes(term) ? 4 : 2;
  }
  return score;
}

async function printfulSearch(query: string, limit: number) {
  const listRes = await fetch("https://api.printful.com/products", {
    headers: {"Accept": "application/json"}
  });
  if (!listRes.ok) throw new Error("Printful catalog " + listRes.status);
  const listData = await listRes.json();
  const products = Array.isArray(listData?.result) ? listData.result : [];

  const selected = products
    .map((raw: any) => ({ raw, relevance: printfulRelevance(raw, query) }))
    .filter((entry: any) => entry.relevance > 0)
    .sort((a: any, b: any) => b.relevance - a.relevance)
    .slice(0, Math.min(limit, 24))
    .map((entry: any) => entry.raw);

  const details = await Promise.all(selected.map(async (raw: any) => {
    const id = String(raw?.id || "").trim();
    if (!id) return null;
    try {
      const detailRes = await fetch("https://api.printful.com/products/" + encodeURIComponent(id), {
        headers: {"Accept": "application/json"}
      });
      if (!detailRes.ok) return null;
      const detailData = await detailRes.json();
      const product = detailData?.result?.product || raw;
      const variants = Array.isArray(detailData?.result?.variants) ? detailData.result.variants : [];
      const inStock = variants.filter((v: any) => v?.in_stock === true);
      const priced = (inStock.length ? inStock : variants)
        .map((v: any) => Number(v?.price))
        .filter((x: number) => Number.isFinite(x) && x > 0);
      const amount = priced.length ? Math.min(...priced) : null;
      const image = cleanText(product?.image) || cleanText(variants?.[0]?.image);
      const result: any = {
        provider: "Printful",
        item_id: id,
        title: cleanText(product?.title),
        source_url: "https://api.printful.com/products/" + encodeURIComponent(id),
        affiliate_url: null,
        image_url: image || null,
        price_amount: amount,
        currency: cleanText(product?.currency) || "USD",
        availability_verified: inStock.length > 0,
        merchant_product: true,
        verdict: "HOLD",
        readiness_score: 0,
        gaps: [
          "Retail price and margin are not configured yet.",
          "Printful store/API token is required for fulfillment.",
          "HUNT DEAL payment activation is required before purchase."
        ]
      };
      result.readiness_score = score(result);
      return result;
    } catch {
      return null;
    }
  }));

  return details.filter((x: any) => x && x.item_id && x.title && x.price_amount && x.availability_verified);
}


async function wooCommerceSearch(query: string, limit: number) {
  const baseUrl = env("WOOCOMMERCE_BASE_URL").replace(/\/+$/, "");
  const consumerKey = env("WOOCOMMERCE_CONSUMER_KEY");
  const consumerSecret = env("WOOCOMMERCE_CONSUMER_SECRET");
  const currency = env("WOOCOMMERCE_CURRENCY").toUpperCase();
  if (!baseUrl.startsWith("https://") || !consumerKey || !consumerSecret) throw new Error("AUTH_REQUIRED");

  const url = new URL(baseUrl + "/wp-json/wc/v3/products");
  url.searchParams.set("search", query);
  url.searchParams.set("per_page", String(Math.min(limit, 20)));
  url.searchParams.set("status", "publish");

  const res = await fetch(url, {
    headers: {
      "Authorization": basicAuth(consumerKey, consumerSecret),
      "Accept": "application/json"
    }
  });
  if (!res.ok) throw new Error("WooCommerce search " + res.status);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("WooCommerce products response malformed");

  return data.map((raw: any) => {
    const amount = Number(raw?.price);
    const result: any = {
      provider: "WooCommerce",
      item_id: String(raw?.id || "").trim(),
      title: cleanText(raw?.name),
      source_url: cleanText(raw?.permalink),
      affiliate_url: null,
      price_amount: Number.isFinite(amount) ? amount : null,
      currency: currency || null,
      availability_verified: cleanText(raw?.stock_status) === "instock",
      verdict: "HOLD",
      readiness_score: 0,
      gaps: [
        "Independent demand evidence.",
        "Merchant checkout activation.",
        "Approved payment integration."
      ]
    };
    result.readiness_score = score(result);
    return result;
  }).filter((x: any) =>
    x.item_id && x.title && x.source_url.startsWith("https://") && allowedTitle(x.title)
  );
}

async function adobeCommerceSearch(query: string, limit: number) {
  const baseUrl = env("ADOBE_COMMERCE_BASE_URL").replace(/\/+$/, "");
  const storeCode = env("ADOBE_COMMERCE_STORE_CODE") || "default";
  const bearer = env("ADOBE_COMMERCE_BEARER_TOKEN");
  const currency = env("ADOBE_COMMERCE_CURRENCY").toUpperCase();
  if (!baseUrl.startsWith("https://") || !bearer) throw new Error("AUTH_REQUIRED");

  const apiBase = baseUrl + "/rest/" + encodeURIComponent(storeCode);
  const url = new URL(apiBase + "/V1/products");
  url.searchParams.set("searchCriteria[filter_groups][0][filters][0][field]", "name");
  url.searchParams.set("searchCriteria[filter_groups][0][filters][0][value]", "%" + query + "%");
  url.searchParams.set("searchCriteria[filter_groups][0][filters][0][condition_type]", "like");
  url.searchParams.set("searchCriteria[pageSize]", String(Math.min(limit, 20)));
  url.searchParams.set("searchCriteria[currentPage]", "1");

  const res = await fetch(url, {
    headers: {
      "Authorization": "Bearer " + bearer,
      "Accept": "application/json"
    }
  });
  if (!res.ok) throw new Error("Adobe Commerce search " + res.status);
  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : [];

  return items.map((raw: any) => {
    const amount = Number(raw?.price);
    const stock = raw?.extension_attributes?.stock_item;
    const sku = cleanText(raw?.sku);
    const result: any = {
      provider: "Adobe Commerce / Magento",
      item_id: sku,
      title: cleanText(raw?.name),
      source_url: sku ? apiBase + "/V1/products/" + encodeURIComponent(sku) : "",
      affiliate_url: null,
      price_amount: Number.isFinite(amount) ? amount : null,
      currency: currency || null,
      availability_verified: stock?.is_in_stock === true,
      verdict: "HOLD",
      readiness_score: 0,
      gaps: [
        "Independent demand evidence.",
        "Merchant checkout activation.",
        "Approved payment integration."
      ]
    };
    result.readiness_score = score(result);
    return result;
  }).filter((x: any) =>
    x.item_id && x.title && x.source_url.startsWith("https://") && allowedTitle(x.title)
  );
}

Deno.serve(async (req: Request) => {
  const headers = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return new Response(publicJson({ error: "method not allowed" }), { status: 405, headers });
  if (!authorized(req)) return new Response(publicJson({ error: "unauthorized" }), { status: 401, headers });

  try {
    const body = await req.json();
    const query = safeQuery(body?.query);
    const limit = Math.max(1, Math.min(Number(body?.limit) || 8, 24));
    const providerDefs = [
      { name: "eBay", run: () => ebaySearch(query, limit) },
      { name: "Amazon", run: () => amazonSearch(query, limit) },
      { name: "impact.com", run: () => impactSearch(query, limit) },
      { name: "Etsy", run: () => etsySearch(query, limit) },
      { name: "Rakuten Advertising", run: () => rakutenSearch(query, limit) },
      { name: "Printful", run: () => printfulSearch(query, limit) },
      { name: "WooCommerce", run: () => wooCommerceSearch(query, limit) },
      { name: "Adobe Commerce / Magento", run: () => adobeCommerceSearch(query, limit) }
    ];

    const providers: any[] = [];
    const results: any[] = [];

    for (const provider of providerDefs) {
      try {
        const found = await provider.run();
        results.push(...found);
        providers.push({ provider: provider.name, state: "SEARCHED", result_count: found.length, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : "provider error";
        providers.push({
          provider: provider.name,
          state: message === "AUTH_REQUIRED" ? "AUTH_REQUIRED" : "ERROR",
          result_count: 0,
          error: message === "AUTH_REQUIRED" ? null : message.slice(0, 160)
        });
      }
    }

    providers.push({
      provider: "SHEIN",
      state: "MANUAL_PROGRAM",
      result_count: 0,
      error: null,
      note: "Official affiliate flow only. Seller OpenAPI is seller-scoped and is not global marketplace search."
    });

    return new Response(publicJson({
      provider: "GLOBAL",
      query,
      results,
      providers,
      truth_note: "Live search results are discovery evidence. HOLD is not a recommendation to buy and does not count as revenue."
    }), { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid request";
    return new Response(publicJson({ error: message }), { status: 400, headers });
  }
});
