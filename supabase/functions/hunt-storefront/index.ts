import { createClient } from "jsr:@supabase/supabase-js@2";

const PUBLIC_KEY = "sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";

const ALLOWED_ORIGINS = new Set([
  "https://hadpac23-netizen.github.io",
  "https://deep-hunt-market.netlify.app",
  "http://127.0.0.1:8767",
  "http://localhost:8767",
]);

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const netlifyPreview = /^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  return {
    "Access-Control-Allow-Origin": (ALLOWED_ORIGINS.has(origin) || netlifyPreview)
      ? origin
      : "https://hadpac23-netizen.github.io",
    "Access-Control-Allow-Headers": "apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
}

function authorized(req: Request): boolean {
  return (req.headers.get("apikey") || "") === PUBLIC_KEY;
}

function env(name: string): string {
  return (Deno.env.get(name) || "").trim();
}

function enabled(name: string): boolean {
  return ["1", "true", "yes", "on"].includes(env(name).toLowerCase());
}

const BLOCKED_TERMS = [
  "gun", "firearm", "ammunition", "ammo", "weapon", "switchblade", "taser",
  "knife", "dagger", "sword", "machete", "pepper spray", "mace", "brass knuckle",
  "firework", "explosive", "detonator", "poison", "pesticide",
  "cannabis", "marijuana", "thc", "cbd", "cocaine", "heroin", "meth", "steroid",
  "vape", "cigarette", "nicotine", "beer", "wine", "vodka", "whiskey", "whisky",
  "rum", "tequila", "casino", "sportsbook", "betting", "porn", "sex toy",
  "spyware", "diet pill", "laxative"
];

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function allowedTitle(title: string): boolean {
  const lower = title.toLowerCase();
  if (BLOCKED_TERMS.some(term => lower.includes(term))) return false;
  if (/\b(temu\s*&\s*tk|tmeu|tk\s*only|supports?\s+pickup|self[- ]?pickup|shipment\s+from\s+walmart|logistics\s+only)\b/.test(lower)) return false;
  return true;
}

function catalogHaystack(raw: any): string {
  return [
    cleanText(raw?.title),
    cleanText(raw?.type_name),
    cleanText(raw?.description),
  ].join(" ").toLowerCase();
}

function pickCatalogProducts(products: any[], limit: number): any[] {
  const buckets = [
    { pattern: /women|woman|female/, take: 8 },
    { pattern: /bag|tote|crossbody|backpack|access|hat|cap/, take: 5 },
    { pattern: /shoe|canvas shoe|slide/, take: 3 },
    { pattern: /travel|luggage|duffle|tag|bottle/, take: 3 },
    { pattern: /rug|pillow|blanket|coaster|home|decor/, take: 3 },
    { pattern: /iphone|samsung|airpods|magsafe|phone case/, take: 2 },
  ];
  const chosen: any[] = [];
  const seen = new Set<string>();

  const add = (raw: any) => {
    const id = String(raw?.id || "").trim();
    if (!id || seen.has(id) || raw?.is_discontinued) return false;
    if (!allowedTitle(cleanText(raw?.title))) return false;
    seen.add(id);
    chosen.push(raw);
    return true;
  };

  for (const bucket of buckets) {
    let count = 0;
    for (const raw of products) {
      if (count >= bucket.take || chosen.length >= limit) break;
      if (bucket.pattern.test(catalogHaystack(raw)) && add(raw)) count += 1;
    }
  }
  for (const raw of products) {
    if (chosen.length >= limit) break;
    add(raw);
  }
  return chosen.slice(0, limit);
}

function plainText(value: unknown): string {
  return cleanText(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function printfulProductDetail(productId: string) {
  const id = productId.replace(/[^0-9]/g, "").slice(0, 20);
  if (!id) return null;
  const detailRes = await fetch("https://api.printful.com/products/" + encodeURIComponent(id), {
    headers: {"Accept": "application/json"}
  });
  if (!detailRes.ok) return null;
  const detailData = await detailRes.json();
  const product = detailData?.result?.product;
  const variants = Array.isArray(detailData?.result?.variants) ? detailData.result.variants : [];
  if (!product || !allowedTitle(cleanText(product?.title))) return null;

  const safeVariants = variants
    .filter((v: any) => v?.in_stock === true)
    .map((v: any) => {
      const amount = Number(v?.price);
      return {
        variant_id: String(v?.id || ""),
        name: cleanText(v?.name),
        size: cleanText(v?.size) || null,
        color: cleanText(v?.color) || null,
        color_code: cleanText(v?.color_code) || null,
        image_url: cleanText(v?.image) || null,
        price_amount: Number.isFinite(amount) && amount > 0 ? amount : null,
        currency: cleanText(product?.currency) || "USD",
        availability_verified: true,
      };
    })
    .filter((v: any) => v.variant_id && v.price_amount);

  const imageSet = new Set<string>();
  const mainImage = cleanText(product?.image);
  if (mainImage.startsWith("https://")) imageSet.add(mainImage);
  for (const variant of safeVariants) {
    if (variant.image_url?.startsWith("https://")) imageSet.add(variant.image_url);
    if (imageSet.size >= 24) break;
  }

  const priced = safeVariants
    .map((v: any) => Number(v.price_amount))
    .filter((x: number) => Number.isFinite(x) && x > 0);

  return {
    provider: "Printful",
    item_id: id,
    title: cleanText(product?.title),
    description: plainText(product?.description),
    brand: cleanText(product?.brand) || null,
    model: cleanText(product?.model) || null,
    type_name: cleanText(product?.type_name) || null,
    origin_country: cleanText(product?.origin_country) || null,
    avg_fulfillment_time: cleanText(product?.avg_fulfillment_time) || null,
    image_url: mainImage || safeVariants[0]?.image_url || null,
    gallery: [...imageSet],
    price_amount: priced.length ? Math.min(...priced) : null,
    price_basis: "SUPPLIER_BASE",
    currency: cleanText(product?.currency) || "USD",
    availability_verified: safeVariants.length > 0,
    merchant_product: true,
    variants: safeVariants,
    variant_count: safeVariants.length,
    options: Array.isArray(product?.options) ? product.options : [],
    gaps: [
      "Retail price and margin are not configured yet.",
      "Printful store/API token is required for fulfillment.",
      "HUNT DEAL payment activation is required before purchase."
    ]
  };
}

function primaryCatalogTitle(raw: any): string {
  return cleanText(raw?.title).toLowerCase().split("|")[0].trim();
}

let cjTokenCache = { token: "", expiresAt: 0 };
let cjShelfCache: { value: Record<string, any[]> | null; expiresAt: number } = { value: null, expiresAt: 0 };

async function cjAccessToken(): Promise<string> {
  const direct = env("CJ_ACCESS_TOKEN");
  if (direct) return direct;
  const apiKey = env("CJ_API_KEY");
  if (!apiKey) return "";
  if (cjTokenCache.token && cjTokenCache.expiresAt > Date.now()) return cjTokenCache.token;
  const authRes = await fetch(
    "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",
    {
      method: "POST",
      headers: {"Content-Type": "application/json", "Accept": "application/json"},
      body: JSON.stringify({apiKey})
    }
  );
  if (!authRes.ok) return "";
  const authData = await authRes.json();
  const token = cleanText(authData?.data?.accessToken);
  if (!token) return "";
  cjTokenCache = { token, expiresAt: Date.now() + 12 * 60 * 60 * 1000 };
  await new Promise(resolve => setTimeout(resolve, 1100));
  return token;
}

function cjRetailPrice(sourceCost: number) {
  const cost = Number(sourceCost);
  if (!Number.isFinite(cost) || cost <= 0) return null;
  const minProfit = Math.max(0, Number(env("HUNT_CJ_MIN_PROFIT_USD") || "4"));
  const paymentReserve = Math.min(0.15, Math.max(0, Number(env("HUNT_CJ_PAYMENT_RESERVE_RATE") || "0.04")));
  const refundReserve = Math.min(0.20, Math.max(0, Number(env("HUNT_CJ_REFUND_RESERVE_RATE") || "0.05")));
  const targetMargin = Math.min(0.75, Math.max(0.10, Number(env("HUNT_CJ_TARGET_PRODUCT_MARGIN") || "0.35")));
  const reserveDenominator = Math.max(0.50, 1 - paymentReserve - refundReserve);
  const contributionFloor = (cost + minProfit) / reserveDenominator;
  const marginFloor = cost / Math.max(0.20, 1 - targetMargin);
  const raw = Math.max(contributionFloor, marginFloor);
  const retail = Math.max(0.99, Math.ceil(raw) - 0.01);
  const projectedProfit = retail * reserveDenominator - cost;
  const projectedMargin = retail > 0 ? projectedProfit / retail : 0;
  return {
    retail_price_amount: Number(retail.toFixed(2)),
    retail_currency: "USD",
    retail_price_verified: true,
    profit_gate_status: projectedProfit >= minProfit && projectedMargin >= Math.min(targetMargin, 0.35) ? "PASS" : "REVIEW",
    projected_product_profit: Number(projectedProfit.toFixed(2)),
    projected_product_margin: Number(projectedMargin.toFixed(4)),
    shipping_priced_separately: true
  };
}

async function cjProductDetail(productId: string) {
  const token = await cjAccessToken();
  if (!token) return null;

  const url = new URL("https://developers.cjdropshipping.com/api2.0/v1/product/query");
  url.searchParams.set("pid", productId);
  const res = await fetch(url, {
    headers: {"CJ-Access-Token": token, "Accept": "application/json"}
  });
  if (!res.ok) return null;
  const body = await res.json();
  if (Number(body?.code || 200) !== 200 || !body?.data) return null;
  const raw = body.data;

  const title = cleanText(raw?.productNameEn);
  if (!title || !allowedTitle(title + " " + cleanText(raw?.categoryName))) return null;

  const gallery = [
    cleanText(raw?.bigImage),
    ...(Array.isArray(raw?.productImageSet) ? raw.productImageSet.map(cleanText) : [])
  ].filter((x, i, arr) => x.startsWith("https://") && arr.indexOf(x) === i);

  const variantsRaw = Array.isArray(raw?.variants) ? raw.variants : [];
  const variants = variantsRaw.map((v: any) => {
    const key = cleanText(v?.variantKey);
    const parts = key.split("-").map((x: string) => x.trim()).filter(Boolean);
    const price = Number(v?.variantSellPrice);
    const retail = cjRetailPrice(price);
    const inventories = Array.isArray(v?.inventories) ? v.inventories : [];
    const stockTotal = inventories.reduce(
      (sum: number, inv: any) => sum + Math.max(0, Number(inv?.totalInventory || 0)),
      0
    );
    return {
      variant_id: cleanText(v?.vid),
      sku: cleanText(v?.variantSku),
      title: cleanText(v?.variantNameEn) || key || title,
      color: parts.length > 1 ? parts[0] : "",
      size: parts.length > 1 ? parts.slice(1).join(" / ") : (parts[0] || ""),
      image_url: cleanText(v?.variantImage) || gallery[0] || "",
      price_amount: Number.isFinite(price) && price > 0 ? price : null,
      currency: "USD",
      ...(retail || {}),
      stock_quantity: stockTotal,
      availability_verified: stockTotal > 0
    };
  }).filter((v: any) => v.variant_id);

  const basePrice = Number(raw?.sellPrice);
  const description = cleanText(raw?.description)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 1800);

  const retail = cjRetailPrice(basePrice);
  return {
    provider: "CJdropshipping",
    item_id: cleanText(raw?.pid) || productId,
    title,
    description,
    image_url: gallery[0] || "",
    gallery,
    category: cleanText(raw?.categoryName),
    type_name: cleanText(raw?.productType),
    model: cleanText(raw?.productSku),
    brand: cleanText(raw?.supplierName),
    price_amount: Number.isFinite(basePrice) && basePrice > 0 ? basePrice : null,
    currency: "USD",
    price_basis: "SUPPLIER_BASE",
    ...(retail || {}),
    variants,
    variant_count: variants.length,
    availability_verified: variants.some((v: any) => v.availability_verified),
    avg_fulfillment_time: null,
    gaps: [
      "Final shipping cost depends on destination and selected variant.",
      "Final sell price and availability must be rechecked before a live order."
    ]
  };
}

async function cjMarketShelves() {
  if (cjShelfCache.value && cjShelfCache.expiresAt > Date.now()) return cjShelfCache.value;

  const token = await cjAccessToken();
  if (!token) return {};

  const products: any[] = [];
  for (let page = 1; page <= 1; page += 1) {
    const url = new URL("https://developers.cjdropshipping.com/api2.0/v1/product/listV2");
    url.searchParams.set("page", String(page));
    url.searchParams.set("size", "100");
    url.searchParams.set("features", "enable_category");
    const res = await fetch(url, {
      headers: {"CJ-Access-Token": token, "Accept": "application/json"}
    });
    if (!res.ok) break;
    const data = await res.json();
    const content = Array.isArray(data?.data?.content) ? data.data.content : [];
    const rows = content.flatMap((entry: any) =>
      Array.isArray(entry?.productList) ? entry.productList : []
    );
    products.push(...rows);
    if (rows.length < 100) break;
  }

  const definitions: Record<string, RegExp> = {
    women: /\b(women(?:'s)?|woman|female|ladies)\b/i,
    men: /\b(men(?:'s)?|man|male|gentlemen)\b/i,
    dresses: /\b(dress|dresses|skirt|skirts)\b/i,
    tops: /\b(shirt|shirts|tee|tees|t-shirt|top|tops|tank|polo|blouse)\b/i,
    bottoms: /\b(pants|trousers|shorts|jeans|joggers|leggings|bottoms)\b/i,
    hoodies: /\b(hoodie|hoodies|sweatshirt|sweatshirts)\b/i,
    jackets: /\b(jacket|jackets|coat|coats|windbreaker|outerwear|blazer)\b/i,
    knitwear: /\b(sweater|sweaters|cardigan|cardigans|knitwear|knit)\b/i,
    activewear: /\b(fitness|sport|sports|athletic|legging|leggings|yoga|gym|running)\b/i,
    bags: /\b(bag|bags|tote|crossbody|backpack|purse|handbag|luggage)\b/i,
    shoes: /\b(shoe|shoes|sneaker|sneakers|slipper|slippers|sandal|sandals|boots)\b/i,
    accessories: /\b(accessory|accessories|wallet|belt|scarf|hat|cap|sunglasses)\b/i,
    jewelry: /\b(jewelry|jewellery|necklace|bracelet|earring|earrings|pendant|ring|rings)\b/i,
    beauty: /\b(beauty|skincare|makeup|cosmetic|serum|cream|hair care|beauty tool|mirror)\b/i,
    perfume: /\b(perfume|fragrance|cologne)\b/i,
    home: /\b(home|decor|living room|household)\b/i,
    kitchen: /\b(kitchen|cookware|utensil|bakeware|lunch box|food storage|dining)\b/i,
    storage: /\b(storage|organizer|organisation|organizer bin|rack|shelf|closet)\b/i,
    bedding: /\b(bedding|bed sheet|bedsheet|duvet|comforter|blanket|pillowcase)\b/i,
    bath: /\b(bathroom|bath|shower|soap dispenser|bath mat|towel)\b/i,
    lighting: /\b(lamp|lighting|night light|desk light|led light)\b/i,
    cleaning: /\b(cleaning|cleaner|mop|brush|squeegee|dust|laundry)\b/i,
    tech: /\b(phone|tablet|computer|electronic|electronics|charging|charger|audio|earbuds|speaker)\b/i,
    phoneaccessories: /\b(phone case|iphone case|mobile case|screen protector|phone stand|charging cable|charger)\b/i,
    gaming: /\b(gaming|gamepad|controller|keyboard|mouse pad|headset stand)\b/i,
    travel: /\b(travel|luggage|organizer|suitcase|passport holder|weekender|duffle)\b/i,
    sports: /\b(sports|fitness|running|cycling|yoga|outdoor sport)\b/i,
    outdoors: /\b(outdoor|camping|picnic|hiking|garden)\b/i,
    toys: /\b(toy|toys|puzzle|plush|building block|craft kit|educational game)\b/i,
    kids: /\b(kid|kids|child|children|baby|toddler|youth|girl|boy)\b/i,
    pets: /\b(pet|pets|dog|dogs|cat|cats)\b/i,
    crafts: /\b(craft|crafts|sewing|knitting|crochet|painting|drawing|scrapbook|beading)\b/i,
    party: /\b(party|birthday|decoration|decorations|gift wrap|balloon)\b/i,
    gifts: /\b(gift|gifts|decor|mug|ornament)\b/i,
    hats: /\b(hat|hats|cap|caps|beanie)\b/i,
    drinkware: /\b(mug|mugs|cup|cups|bottle|bottles|tumbler|tumblers)\b/i,
    wallart: /\b(wall art|poster|posters|canvas|framed art)\b/i,
    blankets: /\b(blanket|blankets|throw blanket|towel|towels)\b/i,
    stationery: /\b(notebook|journal|pen|stationery|calendar|planner)\b/i,
    socks: /\b(sock|socks)\b/i,
    swimwear: /\b(swimwear|swimsuit|swimsuits|bikini|swim trunks)\b/i,
    office: /\b(office|desk|mouse pad|notebook|planner|file organizer)\b/i,
    pillows: /\b(pillow|pillows|cushion|cushions)\b/i,
    ornaments: /\b(ornament|ornaments|decoration|decorations)\b/i
  };

  const out: Record<string, any[]> = {};
  for (const slug of Object.keys(definitions)) out[slug] = [];

  const detectGender = (text: string) => {
    const women = /\b(women(?:'s)?|woman|female|ladies|girl)\b/i.test(text);
    const men = /\b(men(?:'s)?|man|male|gentlemen|boy)\b/i.test(text);
    if (women && !men) return "women";
    if (men && !women) return "men";
    return "general";
  };

  for (const raw of products) {
    const id = cleanText(raw?.id);
    const title = cleanText(raw?.nameEn);
    const image = cleanText(raw?.bigImage);
    const categoryName = [
      cleanText(raw?.oneCategoryName),
      cleanText(raw?.twoCategoryName),
      cleanText(raw?.threeCategoryName)
    ].filter(Boolean).join(" / ");
    const candidatePrices = [raw?.nowPrice, raw?.discountPrice, raw?.sellPrice]
      .map((value: any) => Number(value))
      .filter((value: number) => Number.isFinite(value) && value > 0);
    const price = candidatePrices.length ? Math.min(...candidatePrices) : NaN;
    const retail = cjRetailPrice(price);
    const verifiedInventory = Math.max(
      0,
      Number(raw?.totalVerifiedInventory || 0),
      Number(raw?.warehouseInventoryNum || 0)
    );
    if (!id || !title || !image.startsWith("https://")) continue;
    const haystack = (title + " " + categoryName).toLowerCase();
    if (!allowedTitle(haystack)) continue;
    const gender = detectGender(haystack);

    for (const [slug, pattern] of Object.entries(definitions)) {
      if (out[slug].length >= 260 || !pattern.test(haystack)) continue;
      if (slug === "men" && (gender !== "men" || /\bunisex\b/i.test(haystack))) continue;
      if (slug === "women" && (gender !== "women" || /\bunisex\b/i.test(haystack))) continue;
      out[slug].push({
        provider: "CJdropshipping",
        item_id: id,
        title,
        image_url: image,
        category: slug,
        gender,
        merchant_product: true,
        price_amount: Number.isFinite(price) && price > 0 ? price : null,
        currency: "USD",
        price_basis: "SUPPLIER_BASE",
        ...(retail || {}),
        availability_verified: verifiedInventory > 0,
        stock_quantity: verifiedInventory,
        supplier_delivery_cycle: cleanText(raw?.deliveryCycle) || null
      });
    }
  }

  cjShelfCache = { value: out, expiresAt: Date.now() + 20 * 60 * 1000 };
  return out;
}

let gootenCatalogCache: { items: any[]; expiresAt: number } = { items: [], expiresAt: 0 };
let gootenDebugState = { rows: 0, safe: 0, rootType: "", error: "" };

async function gootenCatalogProducts() {
  if (gootenCatalogCache.items.length && gootenCatalogCache.expiresAt > Date.now()) {
    return gootenCatalogCache.items;
  }
  const res = await fetch("https://gtnadminassets.blob.core.windows.net/productdatav3/catalog.json", {
    headers: {"Accept":"application/json","Accept-Encoding":"gzip"}
  });
  if (!res.ok) return [];
  const rawBody = new Uint8Array(await res.arrayBuffer());
  let jsonText = "";
  if (rawBody.length > 2 && rawBody[0] === 0x1f && rawBody[1] === 0x8b) {
    const decompressed = new Blob([rawBody]).stream().pipeThrough(new DecompressionStream("gzip"));
    jsonText = await new Response(decompressed).text();
  } else {
    jsonText = new TextDecoder().decode(rawBody);
  }
  const data = JSON.parse(jsonText);
  const rows: any[] = [];
  const walk = (node: any, path = "") => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item, path);
      return;
    }
    if (!node || typeof node !== "object") return;
    const nextPath = node?.name ? (path ? path + " / " + cleanText(node.name) : cleanText(node.name)) : path;
    if (node?.type === "product" && node?.product_id) {
      rows.push({...node, _path: path});
    }
    if (node?.items) walk(node.items, nextPath);
  };
  gootenDebugState.rootType = Array.isArray(data?.["product-catalog"]) ? "array" : typeof data?.["product-catalog"];
  walk(data?.["product-catalog"] || []);
  gootenDebugState.rows = rows.length;
  const seen = new Set<string>();
  const safe = rows.filter((raw:any)=>{
    const id=String(raw?.product_id ?? "").trim();
    const title=cleanText(raw?.name);
    const path=cleanText(raw?._path);
    const image=cleanText(raw?.url);
    if(!id || !title || !image.startsWith("https://") || raw?.deprecated || raw?.out_of_stock) return false;
    if(!allowedTitle(title + " " + path)) return false;
    if(seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  gootenDebugState.safe = safe.length;
  gootenCatalogCache = { items: safe, expiresAt: Date.now() + 60 * 60 * 1000 };
  return safe;
}

function gootenPrice(value: unknown) {
  const n = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function gootenMarketShelves() {
  const products = await gootenCatalogProducts();
  const definitions: Record<string, RegExp> = {
    tops:/\b(t-shirt|shirt|tank|polo|top)\b/i,
    hoodies:/\b(hoodie|sweatshirt)\b/i,
    bottoms:/\b(leggings|shorts|pants|joggers)\b/i,
    bags:/\b(bag|tote|pouch|backpack)\b/i,
    shoes:/\b(shoe|flip flop|sandal)\b/i,
    accessories:/\b(accessor|bandana|scarf|hat|cap)\b/i,
    home:/\b(home|decor|pillow|blanket|throw|cover)\b/i,
    storage:/\b(storage|organizer)\b/i,
    bedding:/\b(blanket|pillow|bedding)\b/i,
    kitchen:/\b(kitchen|placemat|coaster|tray)\b/i,
    bath:/\b(towel|bath|shower)\b/i,
    drinkware:/\b(mug|tumbler|bottle|cup|glass)\b/i,
    wallart:/\b(canvas wrap|canvas print|poster|wall art|framed print|acrylic print|metal print)\b/i,
    stationery:/\b(notepad|journal|calendar|greeting card|postcard|stationery|sticker)\b/i,
    office:/\b(desk|calendar|notepad|journal|mouse pad|mousepad)\b/i,
    phoneaccessories:/\b(phone case|phone cases|mobile case)\b/i,
    gaming:/\b(gamer|gaming|mousepad|mouse pad)\b/i,
    travel:/\b(travel|luggage|pouch|bag|passport)\b/i,
    sports:/\b(yoga|sport|fitness|legging)\b/i,
    toys:/\b(puzzle|toy|game)\b/i,
    pets:/\b(pet|dog|cat)\b/i,
    gifts:/\b(gift|ornament|card|calendar|mug)\b/i,
    ornaments:/\b(ornament|decoration)\b/i
  };
  const out: Record<string, any[]> = {};
  for (const slug of Object.keys(definitions)) out[slug]=[];
  for (const raw of products) {
    const id=String(raw?.product_id ?? "").trim();
    const title=cleanText(raw?.name);
    const path=cleanText(raw?._path);
    const image=cleanText(raw?.url);
    const titleText=title.toLowerCase();
    const haystack=(title+" "+path).toLowerCase();
    for (const [slug,pattern] of Object.entries(definitions)) {
      const matchText = ["stationery","wallart","phoneaccessories","gaming"].includes(slug) ? titleText : haystack;
      if(out[slug].length>=120 || !pattern.test(matchText)) continue;
      out[slug].push({
        provider:"Gooten",
        item_id:id,
        title,
        image_url:image,
        category:slug,
        merchant_product:true,
        price_amount:gootenPrice(raw?.cheapest_price),
        currency:"USD",
        price_basis:"SUPPLIER_BASE",
        availability_verified:true
      });
    }
  }
  return out;
}

async function gootenProductDetail(productId: string) {
  const products=await gootenCatalogProducts();
  const raw=products.find((x:any)=>String(x?.product_id ?? "").trim()===String(productId ?? "").trim());
  if(!raw) return null;
  const title=cleanText(raw?.name);
  const image=cleanText(raw?.url);
  return {
    provider:"Gooten",
    item_id:String(raw?.product_id ?? "").trim(),
    title,
    description:plainText(raw?.meta_description || ""),
    image_url:image,
    gallery:image ? [image] : [],
    category:cleanText(raw?._path),
    type_name:"Print-on-demand catalog",
    price_amount:gootenPrice(raw?.cheapest_price),
    currency:"USD",
    price_basis:"SUPPLIER_BASE",
    variants:[],
    variant_count:0,
    availability_verified:!raw?.out_of_stock && !raw?.deprecated,
    gaps:[
      "Variants and production options require Gooten API credentials.",
      "Final shipping quote and order submission remain disabled until HUNT order integration is approved."
    ]
  };
}

async function merchantDb() {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth:{persistSession:false,autoRefreshToken:false} });
}

async function merchantMarketShelves() {
  const db = await merchantDb();
  if (!db) return {};
  const { data, error } = await db.from("merchant_products")
    .select("id,store_id,external_id,title,description,category,image_urls,product_url,price_amount,currency,compare_at_amount,inventory_quantity,availability_verified,status,safety_status,merchant_stores!inner(id,name,status,affiliate_network)")
    .eq("status","approved")
    .eq("safety_status","passed")
    .eq("merchant_stores.status","approved")
    .order("updated_at",{ascending:false})
    .limit(1500);
  if (error || !Array.isArray(data)) return {};

  const out: Record<string, any[]> = {};
  for (const raw of data) {
    const slug = cleanText(raw?.category).toLowerCase();
    const title = cleanText(raw?.title);
    const images = Array.isArray(raw?.image_urls) ? raw.image_urls.filter((x:any)=>typeof x==="string" && x.startsWith("https://")).slice(0,12) : [];
    const destination = cleanText(raw?.product_url);
    if (!slug || !title || !allowedTitle(title+" "+plainText(raw?.description)) || !destination.startsWith("https://")) continue;
    if (!out[slug]) out[slug]=[];
    if (out[slug].length>=160) continue;
    const price=Number(raw?.price_amount);
    const compareAt=Number(raw?.compare_at_amount);
    out[slug].push({
      provider:"HUNT Merchant",
      merchant_name:cleanText(raw?.merchant_stores?.name),
      item_id:String(raw.id),
      external_id:cleanText(raw?.external_id),
      title,
      image_url:images[0]||null,
      image_urls:images,
      category:slug,
      merchant_product:true,
      price_amount:Number.isFinite(price)&&price>=0?price:null,
      compare_at_amount:Number.isFinite(compareAt)&&compareAt>0&&(!Number.isFinite(price)||compareAt>=price)?compareAt:null,
      currency:cleanText(raw?.currency)||"USD",
      price_basis:"MERCHANT_RETAIL",
      availability_verified:raw?.availability_verified===true || Number(raw?.inventory_quantity)>0,
      external_redirect:true,
      source_store_id:String(raw?.store_id)
    });
  }
  return out;
}

async function merchantProductDetail(productId:string) {
  const db=await merchantDb();
  if(!db) return null;
  const {data,error}=await db.from("merchant_products")
    .select("id,store_id,external_id,sku,title,description,category,image_urls,product_url,price_amount,currency,compare_at_amount,inventory_quantity,availability_verified,status,safety_status,merchant_stores!inner(id,name,status,affiliate_network)")
    .eq("id",productId)
    .eq("status","approved")
    .eq("safety_status","passed")
    .eq("merchant_stores.status","approved")
    .maybeSingle();
  if(error||!data||!allowedTitle(cleanText(data.title)+" "+plainText(data.description))) return null;
  const gallery=Array.isArray(data.image_urls)?data.image_urls.filter((x:any)=>typeof x==="string"&&x.startsWith("https://")).slice(0,12):[];
  const price=Number(data.price_amount);
  const compareAt=Number(data.compare_at_amount);
  const base=Deno.env.get("SUPABASE_URL")||"";
  const publicBase=(Deno.env.get("HUNT_PUBLIC_URL")||"https://deep-hunt-market.netlify.app").replace(/\/$/,"");
  const encodedProductId=encodeURIComponent(String(data.id));
  const partnerHandoffUrl=base+"/functions/v1/hunt-go?product_id="+encodedProductId;
  const handoffUrl=publicBase+"/checkout-handoff.html?provider=merchant&id="+encodedProductId;
  return {
    provider:"HUNT Merchant",
    item_id:String(data.id),
    external_id:cleanText(data.external_id),
    sku:cleanText(data.sku)||null,
    title:cleanText(data.title),
    description:plainText(data.description),
    image_url:gallery[0]||null,
    gallery,
    category:cleanText(data.category),
    store:{id:String(data.store_id),name:cleanText(data.merchant_stores?.name)},
    price_amount:Number.isFinite(price)&&price>=0?price:null,
    compare_at_amount:Number.isFinite(compareAt)&&compareAt>0&&(!Number.isFinite(price)||compareAt>=price)?compareAt:null,
    currency:cleanText(data.currency)||"USD",
    price_basis:"MERCHANT_RETAIL",
    variants:[],
    variant_count:0,
    availability_verified:data.availability_verified===true||Number(data.inventory_quantity)>0,
    external_visit_url:handoffUrl,
    partner_handoff_url:partnerHandoffUrl,
    checkout_handoff:true,
    checkout_status:"PARTNER_HANDOFF",
    checkout_disclosure:"Payment and order submission are completed by the approved partner store.",
    affiliate_disclosure:data.merchant_stores?.affiliate_network ? "HUNT may earn a commission from qualifying purchases at this partner store." : null,
    gaps:["HUNT presents the product and secure handoff. Final price, shipping, taxes, returns and payment are confirmed by the partner store."]
  };
}

async function withProviderTimeout<T>(promise: Promise<T>, fallback: T, ms = 9000): Promise<T> {
  let timer: number | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms) as unknown as number;
      })
    ]);
  } catch {
    return fallback;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function mergeMarketShelves(...sources: Record<string, any[]>[]) {
  const merged: Record<string, any[]> = {};
  for (const source of sources) {
    for (const [slug, rows] of Object.entries(source || {})) {
      if (!merged[slug]) merged[slug] = [];
      const seen = new Set(merged[slug].map(x => String(x?.provider) + ":" + String(x?.item_id)));
      for (const row of Array.isArray(rows) ? rows : []) {
        const key = String(row?.provider) + ":" + String(row?.item_id);
        if (!row?.item_id || seen.has(key) || merged[slug].length >= 300) continue;
        seen.add(key);
        merged[slug].push(row);
      }
    }
  }
  return merged;
}

async function printfulMarketShelves() {
  const listRes = await fetch("https://api.printful.com/products", {
    headers: {"Accept": "application/json"}
  });
  if (!listRes.ok) return {};
  const listData = await listRes.json();
  const products = (Array.isArray(listData?.result) ? listData.result : [])
    .filter((raw: any) => !raw?.is_discontinued && allowedTitle(cleanText(raw?.title)));

  const definitions: Record<string, RegExp> = {
    women: /\bwomen(?:'s|s)?\b/i,
    men: /\bmen(?:\'s|s)?\b/i,
    dresses: /\b(dress|dresses|skirt|skirts)\b/i,
    tops: /\b(shirt|shirts|tee|tees|t-shirt|t-shirts|top|tops|tank|polo)\b/i,
    hoodies: /\b(hoodie|hoodies|sweatshirt|sweatshirts)\b/i,
    jackets: /\b(jacket|jackets|windbreaker|bomber|letterman)\b/i,
    activewear: /\b(athletic|performance|legging|leggings|sports bra|shorts|yoga|rash guard|track pants|joggers)\b/i,
    bags: /\b(bag|bags|tote|crossbody|backpack|purse|purses|duffle)\b/i,
    shoes: /\b(shoe|shoes|slide|slides|sneaker|sneakers)\b/i,
    accessories: /\b(hat|hats|cap|caps|wallet|belt|tag|beanie|bucket hat|accessory|accessories)\b/i,
    travel: /\b(luggage|duffle|weekender|travel|bottle|towel|tag|bag|bags|suitcase)\b/i,
    home: /\b(rug|pillow|blanket|coaster|poster|canvas|wall art|home|decor)\b/i,
    tech: /\b(phone|iphone|samsung|airpods|magsafe)\b/i,
    gifts: /\b(mug|ornament|blanket|poster|canvas|tumbler|bottle|coaster|gift)\b/i,
    kids: /\b(kids?|youth|toddler|baby)\b/i,
    hats: /\b(hat|hats|cap|caps|beanie|bucket hat)\b/i,
    drinkware: /\b(mug|mugs|bottle|bottles|tumbler|tumblers|cup|cups)\b/i,
    wallart: /\b(poster|posters|canvas|wall art|flag|framed)\b/i,
    blankets: /\b(blanket|blankets|towel|towels)\b/i,
    stickers: /\b(sticker|stickers)\b/i,
    stationery: /\b(notebook|notebooks|journal|journals|calendar|calendars)\b/i,
    pets: /\b(pet|dog|cat)\b/i,
    socks: /\b(sock|socks)\b/i,
    swimwear: /\b(swim|swimsuit|swimsuits|bikini|bikinis|swim trunks)\b/i,
    office: /\b(desk mat|desk calendar|desktop calendar|mouse pad|notebook|journal)\b/i,
    pillows: /\b(pillow|pillows)\b/i,
    ornaments: /\b(ornament|ornaments)\b/i,
  };

  const used = new Set<string>();
  const out: Record<string, any[]> = {};
  for (const [slug, pattern] of Object.entries(definitions)) {
    const items: any[] = [];
    for (const raw of products) {
      if (items.length >= 60) break;
      const id = String(raw?.id || "").trim();
      const title = cleanText(raw?.title);
      const primaryTitle = primaryCatalogTitle(raw);
      if (!id || used.has(slug + ":" + id) || !pattern.test(primaryTitle)) continue;
      if (slug === "men" && /\bunisex\b/i.test(primaryTitle)) continue;
      if (slug === "activewear" && /\bkids?\b/i.test(primaryTitle)) continue;
      used.add(slug + ":" + id);
      items.push({
        provider: "Printful",
        item_id: id,
        title,
        image_url: cleanText(raw?.image) || null,
        category: slug,
        merchant_product: true,
        price_basis: "DETAIL_REQUIRED",
        availability_verified: false,
      });
    }
    out[slug] = items;
  }
  return out;
}

async function printfulCatalog(limit = 24) {
  const listRes = await fetch("https://api.printful.com/products", {
    headers: {"Accept": "application/json"}
  });
  if (!listRes.ok) return [];
  const listData = await listRes.json();
  const products = Array.isArray(listData?.result) ? listData.result : [];
  const selected = pickCatalogProducts(products, Math.max(1, Math.min(limit, 24)));

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
      if (!amount || !inStock.length) return null;
      return {
        provider: "Printful",
        item_id: id,
        title: cleanText(product?.title),
        source_url: "https://api.printful.com/products/" + encodeURIComponent(id),
        affiliate_url: null,
        image_url: cleanText(product?.image) || cleanText(variants?.[0]?.image) || null,
        price_amount: amount,
        price_basis: "SUPPLIER_BASE",
        currency: cleanText(product?.currency) || "USD",
        availability_verified: true,
        merchant_product: true,
        verdict: "CATALOG",
        readiness_score: 45,
        gaps: [
          "Retail price and margin are not configured yet.",
          "Printful store/API token is required for fulfillment.",
          "HUNT DEAL payment activation is required before purchase."
        ]
      };
    } catch {
      return null;
    }
  }));

  return details.filter((x: any) => x && x.title && allowedTitle(x.title));
}


const EBAY_FASHION_MANUAL_REVIEW_BRANDS = [
  "prada","coach","longchamp","gucci","chanel","louis vuitton","lv ","dior","ysl","saint laurent",
  "hermes","hermès","michael kors","tory burch","kate spade","balenciaga","burberry","fendi","versace"
];


function ebayShelfTitleAllowed(slug: string, rawTitle: string) {
  const t = cleanText(rawTitle).toLowerCase();
  const has = (re: RegExp) => re.test(t);
  const apparel = has(/\b(dress|shirt|top|blouse|pants|trousers|jeans|shorts|skirt|jacket|coat|sweater|cardigan|hoodie|clothing|apparel|wear|leggings|bra|briefs?|boxers?|suit|blazer|pajamas?|pyjamas?)\b/);
  if (slug === "womenunderwear") return has(/\b(women(?:'s|s)?|woman|ladies|female)\b/) && has(/\b(underwear|briefs?|panties|bra|bras|bralette|camisole|intimates?)\b/);
  if (slug === "menunderwear") return has(/\b(men(?:'s|s)?|man|male)\b/) && has(/\b(underwear|briefs?|boxer briefs?|boxers?|underpants|undershirt|base layer)\b/);
  if (slug === "kidsunderwear") return has(/\b(kids?|children|child|boys?|youth|toddler)\b/) && has(/\b(underwear|briefs?|boxers?|underpants|undershirt|base layer)\b/);
  if (slug === "sleepwear") return apparel && has(/\b(pajamas?|pyjamas?|sleepwear|nightwear|nightgown|sleep set)\b/);
  if (slug === "loungewear") return apparel && has(/\b(loungewear|lounge set|lounge pants|lounge top)\b/);
  if (slug === "plussize") return apparel && has(/\b(plus size|big & tall|big and tall)\b/);
  if (slug === "petite") return apparel && has(/\bpetite\b/);
  if (slug === "maternity") return apparel && has(/\b(maternity|pregnancy|pregnant)\b/);
  if (slug === "sets") return apparel && has(/\b(co-?ord|matching set|2 piece|two piece|2pc|two-piece)\b/);
  if (slug === "suits") return apparel && has(/\b(suit|suits|tuxedo|formal jacket|formalwear|business suit|blazer set)\b/) && !has(/\b(pet|dog|cat|recovery|swim|wetsuit)\b/);
  if (slug === "gaming") return has(/\b(gaming headset|gaming headphones|game controller|gaming controller|gamepad|mechanical gaming keyboard|gaming keyboard|gaming mouse)\b/)
    && !has(/\b(chair|desk|table|sticker|skin only|case only)\b/);
  if (slug === "tech") return has(/\b(usb[- ]?c charger|wall charger|wireless charger|power bank|usb[- ]?c hub|usb hub|wireless earbuds|earphones|headphones|lavalier microphone|lapel microphone|wireless microphone|webcam|portable monitor|smartwatch|smart watch)\b/)
    && !has(/\b(case only|cover only|holder only|stand only|replacement shell)\b/);
  if (slug === "lighting") return has(/\b(under[- ]?cabinet light|desk lamp|table lamp|reading lamp|rechargeable lamp|led strip light|led strip)\b/)
    && !has(/\b(aquarium|car interior|vehicle interior)\b/);
  return true;
}

const ebayShelfCaches = new Map<string, { value: Record<string, any[]>; expiresAt: number }>();
const ebayShelfDiagnostics = new Map<string, { queries: number; adapter_ok: number; raw_items: number; title_gate_pass: number; quality_pass: number }>();


async function ebayAdapter(body: any) {
  const token = env("HUNT_EBAY_INTERNAL_TOKEN");
  const base = env("SUPABASE_URL").replace(/\/$/, "");
  if (!token || !base || !env("EBAY_CLIENT_ID") || !env("EBAY_CLIENT_SECRET")) return null;
  try {
    const res = await fetch(base + "/functions/v1/hunt-ebay-browse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hunt-ebay-token": token,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.ok === true ? data : null;
  } catch {
    return null;
  }
}

async function ebayMarketShelves(focusSlug = "") {
  const cacheKey = focusSlug || "*";
  const cached = ebayShelfCaches.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const specs = [
    ["women", "women fashion clothing", 36],
    ["women", "women brown jeans", 20],
    ["jackets", "women suede jacket", 24],
    ["jackets", "women peplum jacket", 20],
    ["knitwear", "women roll neck sweater", 20],
    ["dresses", "women dresses", 30],
    ["shoes", "women satin ballet flats", 24],
    ["bags", "women handbags", 30],
    ["bags", "women olive green shoulder bag", 20],
    ["bags", "women burgundy shoulder bag", 20],
    ["bags", "women leather crossbody bag", 24],
    ["bags", "women drawstring pouch bag suede leather", 24],
    ["bags", "women animal print shoulder bag", 20],
    ["shoes", "women shoes", 30],
    ["jewelry", "women 316L stainless steel jewelry", 30],
    ["jewelry", "women PVD gold plated jewelry", 24],
    ["jewelry", "women stainless steel charm necklace", 28],
    ["jewelry", "women freshwater pearl earrings", 24],
    ["accessories", "women acetate hair claw clip", 30],
    ["accessories", "women premium hair accessories", 24],
    ["accessories", "women polarized sunglasses", 30],
    ["accessories", "women wraparound sunglasses UV400", 24],
    ["accessories", "women 100 percent silk scarf", 24],
    ["accessories", "women floral brooch", 24],
    ["accessories", "women western leather belt", 20],
    ["womenunderwear", "women cotton underwear multipack", 30],
    ["womenunderwear", "women everyday bra bralette", 24],
    ["menunderwear", "men cotton boxer briefs multipack", 30],
    ["menunderwear", "men underwear briefs multipack", 24],
    ["menunderwear", "men boxer briefs cotton pack", 30],
    ["menunderwear", "men undershirt multipack", 24],
    ["kidsunderwear", "kids cotton underwear multipack", 30],
    ["kidsunderwear", "boys underwear multipack", 24],
    ["kidsunderwear", "boys boxer briefs pack", 24],
    ["kidsunderwear", "kids undershirt multipack", 20],
    ["sleepwear", "women pajamas sleepwear set", 24],
    ["sleepwear", "women cotton pajamas set", 24],
    ["sleepwear", "men pajamas sleepwear set", 24],
    ["sleepwear", "men cotton pajamas set", 24],
    ["sleepwear", "kids pajamas sleepwear set", 20],
    ["sleepwear", "boys pajamas set", 20],
    ["loungewear", "women loungewear set", 24],
    ["loungewear", "women lounge pants set", 24],
    ["loungewear", "men loungewear set", 24],
    ["loungewear", "men lounge pants set", 24],
    ["plussize", "women plus size clothing", 30],
    ["plussize", "women plus size dress", 28],
    ["plussize", "women plus size blouse", 24],
    ["plussize", "men plus size clothing", 24],
    ["plussize", "men big tall shirt", 24],
    ["petite", "women petite clothing", 24],
    ["petite", "petite women trousers", 24],
    ["petite", "petite women jeans", 24],
    ["petite", "petite women dress", 24],
    ["maternity", "women maternity clothing", 24],
    ["maternity", "women maternity top", 24],
    ["maternity", "women maternity dress", 24],
    ["maternity", "women maternity leggings", 24],
    ["sets", "women 2 piece matching set", 24],
    ["sets", "women matching pants set", 24],
    ["sets", "men co ord matching set", 20],
    ["sets", "men matching tracksuit set", 20],
    ["gaming", "gaming headset", 30],
    ["gaming", "game controller", 30],
    ["gaming", "mechanical gaming keyboard", 24],
    ["gaming", "gaming mouse", 24],
    ["tech", "usb c charger 65w", 30],
    ["tech", "usb c hub", 30],
    ["tech", "wireless lapel microphone", 30],
    ["tech", "wireless earbuds", 30],
    ["tech", "portable monitor", 24],
    ["lighting", "under cabinet light rechargeable", 24],
    ["lighting", "desk lamp rechargeable", 24],
    ["men", "men fashion clothing", 30],
    ["men", "men polo shirt", 28],
    ["men", "men knit polo shirt", 24],
    ["men", "men linen shirt", 28],
    ["men", "men chino pants", 28],
    ["men", "men straight jeans", 28],
    ["suits", "men suits", 24],
    ["phoneaccessories", "iPhone 18 Pro case MagSafe", 36],
    ["phoneaccessories", "iPhone 18 Pro Max case MagSafe", 36],
    ["phoneaccessories", "iPhone 18 Pro crossbody case strap", 30],
    ["phoneaccessories", "iPhone 18 Pro wrist strap case", 24],
    ["phoneaccessories", "Samsung Galaxy S26 Ultra case", 36],
    ["phoneaccessories", "Samsung Galaxy S26 Ultra magnetic case kickstand", 30],
    ["phoneaccessories", "Samsung Galaxy Z Fold 8 case", 30],
    ["phoneaccessories", "Samsung Galaxy Z Flip 8 case", 30],
  ] as const;
  const selectedSpecs = focusSlug ? specs.filter(([slug]) => slug === focusSlug) : specs;
  const results = await Promise.all(selectedSpecs.map(([slug, q, limit]) =>
    withProviderTimeout(ebayAdapter({ action: "search", q, limit }), null, focusSlug ? 6000 : 4500)
      .then(data => ({ slug, data }))
  ));
  const out: Record<string, any[]> = {};
  const diag = { queries: selectedSpecs.length, adapter_ok: 0, raw_items: 0, title_gate_pass: 0, quality_pass: 0 };
  for (const {slug, data} of results) {
    if (!out[slug]) out[slug] = [];
    if (data) diag.adapter_ok += 1;
    diag.raw_items += Array.isArray(data?.items) ? data.items.length : 0;
    const seen = new Set(out[slug].map(x => String(x?.provider) + ":" + String(x?.item_id)));
    for (const item of Array.isArray(data?.items) ? data.items : []) {
      const key = String(item?.provider) + ":" + String(item?.item_id);
      if (!item?.item_id || seen.has(key) || !cleanText(item?.image_url).startsWith("https://")) continue;
      if (!allowedTitle(cleanText(item?.title))) continue;
      if (!ebayShelfTitleAllowed(slug, cleanText(item?.title))) continue;
      diag.title_gate_pass += 1;
      const titleLower = cleanText(item?.title).toLowerCase();
      if (["bags","jewelry","accessories"].includes(slug) &&
          EBAY_FASHION_MANUAL_REVIEW_BRANDS.some(brand => titleLower.includes(brand))) continue;
      const feedback = Number(item?.seller?.feedback_percentage);
      if (Number.isFinite(feedback) && feedback < 97) continue;
      const price = Number(item?.price_amount);
      if (!Number.isFinite(price) || price <= 0) continue;
      seen.add(key);
      diag.quality_pass += 1;
      out[slug].push({ ...item, category: slug });
      const shelfCap = slug === "phoneaccessories" ? 220
        : slug === "accessories" ? 160
        : slug === "men" ? 180
        : ["womenunderwear","menunderwear","kidsunderwear","sleepwear","loungewear"].includes(slug) ? 100
        : 120;
      if (out[slug].length >= shelfCap) break;
    }
  }
  ebayShelfDiagnostics.set(cacheKey, diag);
  ebayShelfCaches.set(cacheKey, { value: out, expiresAt: Date.now() + 10 * 60 * 1000 });
  return out;
}

async function ebayProductDetail(productId: string) {
  const data = await ebayAdapter({ action: "item", item_id: productId });
  return data?.product || null;
}

function providerState() {
  return [
    {
      provider: "eBay",
      state:
        env("EBAY_CLIENT_ID") && env("EBAY_CLIENT_SECRET")
          ? "CATALOG_LIVE"
          : "AUTH_REQUIRED",
      connector_stage:
        env("EBAY_CLIENT_ID") && env("EBAY_CLIENT_SECRET")
          ? (env("EBAY_EPN_CAMPAIGN_ID") ? "BROWSE_LIVE_EPN_READY" : "BROWSE_LIVE_EPN_PENDING")
          : "STAGED",
    },
    {
      provider: "Amazon",
      state:
        env("AMAZON_CREATORS_CLIENT_ID") &&
        env("AMAZON_CREATORS_CLIENT_SECRET") &&
        env("AMAZON_PARTNER_TAG")
          ? "READY"
          : "AUTH_REQUIRED",
    },
    {
      provider: "impact.com",
      state:
        env("IMPACT_ACCOUNT_SID") && env("IMPACT_AUTH_TOKEN")
          ? "READY"
          : "AUTH_REQUIRED",
    },
    {
      provider: "Printful",
      state: "CATALOG_LIVE",
    },
    {
      provider: "CJdropshipping",
      state: env("CJ_API_KEY") || env("CJ_ACCESS_TOKEN")
        ? "CATALOG_LIVE"
        : "AUTH_REQUIRED",
      connector_stage: env("CJ_API_KEY") || env("CJ_ACCESS_TOKEN")
        ? "CATALOG_AND_DETAIL_LIVE"
        : "STAGED",
    },
    {
      provider: "Gelato",
      state: env("GELATO_API_KEY") ? "CREDENTIALS_PRESENT" : "AUTH_REQUIRED",
      connector_stage: "STAGED",
    },
    {
      provider: "Prodigi",
      state: env("PRODIGI_API_KEY") ? "CREDENTIALS_PRESENT" : "AUTH_REQUIRED",
      connector_stage: "STAGED",
    },
    {
      provider: "Gooten",
      state: "CATALOG_LIVE",
      connector_stage: env("GOOTEN_API_KEY") ? "PUBLIC_CATALOG_LIVE_CREDENTIALS_PRESENT" : "PUBLIC_CATALOG_LIVE",
    },
    {
      provider: "BigBuy",
      state: env("BIGBUY_API_KEY") ? "CREDENTIALS_PRESENT" : "AUTH_REQUIRED",
      connector_stage: "STAGED",
    },
    {
      provider: "Doba",
      state: env("DOBA_API_KEY") ? "CREDENTIALS_PRESENT" : "AUTH_REQUIRED",
      connector_stage: "STAGED",
    },
    {
      provider: "Printify",
      state: env("PRINTIFY_API_TOKEN") ? "CREDENTIALS_PRESENT" : "AUTH_REQUIRED",
      connector_stage: "STAGED",
    },
    {
      provider: "KakaClo",
      state: env("KAKACLO_ACCESS_TOKEN") ? "CREDENTIALS_PRESENT" : "AUTH_REQUIRED",
      connector_stage: env("KAKACLO_ACCESS_TOKEN") ? "API_READY_FOR_CATALOG_VALIDATION" : "STAGED",
    },
    {
      provider: "Etsy",
      state:
        env("ETSY_API_KEYSTRING") && env("ETSY_SHARED_SECRET")
          ? "READY"
          : "AUTH_REQUIRED",
    },
    {
      provider: "SHEIN",
      state: "MANUAL_PROGRAM",
      affiliate_program: "OFFICIAL",
      seller_openapi: "SELLER_SCOPED_APPROVAL_REQUIRED",
      global_product_search: false,
    },
    {
      provider: "Rakuten Advertising",
      state:
        env("RAKUTEN_CLIENT_ID") &&
        env("RAKUTEN_CLIENT_SECRET") &&
        env("RAKUTEN_ACCOUNT_ID")
          ? "READY"
          : "AUTH_REQUIRED",
    },
    ...[
      "Temu",
      "Walmart",
      "TikTok Shop",
    ].map((provider) => ({ provider, state: "MANUAL_PROGRAM" })),
    { provider: "AliExpress", state: "VERIFYING" },
    {
      provider: "WooCommerce",
      state:
        env("WOOCOMMERCE_BASE_URL") &&
        env("WOOCOMMERCE_CONSUMER_KEY") &&
        env("WOOCOMMERCE_CONSUMER_SECRET")
          ? "CONFIGURED"
          : "AUTH_REQUIRED",
    },
    {
      provider: "Adobe Commerce / Magento",
      state:
        env("ADOBE_COMMERCE_BASE_URL") &&
        env("ADOBE_COMMERCE_BEARER_TOKEN")
          ? "CONFIGURED"
          : "AUTH_REQUIRED",
    },
    {
      provider: "Commerce Layer",
      state:
        env("COMMERCE_LAYER_BASE_URL") &&
        env("COMMERCE_LAYER_CLIENT_ID") &&
        env("COMMERCE_LAYER_CLIENT_SECRET") &&
        env("COMMERCE_LAYER_SCOPE")
          ? "CONFIGURED"
          : "AUTH_REQUIRED",
    },
  ];
}

function checkoutMap() {
  const ebayActive = Boolean(
    env("EBAY_CLIENT_ID") &&
      env("EBAY_CLIENT_SECRET") &&
      enabled("EBAY_ORDER_API_APPROVED")
  );
  const wooActive = Boolean(
    env("WOOCOMMERCE_BASE_URL") &&
      env("WOOCOMMERCE_CONSUMER_KEY") &&
      env("WOOCOMMERCE_CONSUMER_SECRET") &&
      enabled("WOOCOMMERCE_ORDER_API_APPROVED") &&
      enabled("WOOCOMMERCE_PAYMENT_APPROVED")
  );
  const adobeActive = Boolean(
    env("ADOBE_COMMERCE_BASE_URL") &&
      env("ADOBE_COMMERCE_BEARER_TOKEN") &&
      enabled("ADOBE_COMMERCE_ORDER_API_APPROVED") &&
      enabled("ADOBE_COMMERCE_PAYMENT_APPROVED")
  );
  const commerceLayerActive = Boolean(
    env("COMMERCE_LAYER_BASE_URL") &&
      env("COMMERCE_LAYER_CLIENT_ID") &&
      env("COMMERCE_LAYER_CLIENT_SECRET") &&
      env("COMMERCE_LAYER_SCOPE") &&
      enabled("COMMERCE_LAYER_ORDER_API_APPROVED") &&
      enabled("COMMERCE_LAYER_PAYMENT_APPROVED")
  );
  const printfulActive = Boolean(
    env("PRINTFUL_API_TOKEN") &&
      env("PRINTFUL_STORE_ID") &&
      enabled("PRINTFUL_FULFILLMENT_APPROVED") &&
      enabled("HUNT_PAYMENT_PROVIDER_APPROVED")
  );

  return {
    eBay: { mode: ebayActive ? "ONSITE_CAPABLE" : "APPROVAL_REQUIRED" },
    Amazon: { mode: "DISCOVERY_ONLY" },
    "impact.com": { mode: "DISCOVERY_ONLY" },
    Printful: {
      mode: printfulActive ? "ONSITE_CAPABLE" : "APPROVAL_REQUIRED",
      note: printfulActive
        ? "Printful fulfillment is active for HUNT DEAL."
        : "Live catalog is available now; fulfillment token/store and HUNT payment approval are still required."
    },
    CJdropshipping: {
      mode: "APPROVAL_REQUIRED",
      note: "Live catalog and product details are connected. Order fulfillment and payment activation remain approval-required."
    },
    KakaClo: {
      mode: "APPROVAL_REQUIRED",
      note: "Official API supports catalog, stock, logistics and orders after Access-Token authentication. HUNT keeps orders and payment disabled until catalog and fulfillment validation pass."
    },
    Gelato: {
      mode: "APPROVAL_REQUIRED",
      note: "Public catalog is live in HUNT. Variants, shipping quotes and order fulfillment still require verified Gooten API credentials."
    },
    Prodigi: {
      mode: "APPROVAL_REQUIRED",
      note: "Connector is staged; live catalog and fulfillment activation wait for verified API credentials."
    },
    Gooten: {
      mode: "APPROVAL_REQUIRED",
      note: "Connector is staged; live catalog and fulfillment activation wait for verified API credentials."
    },
    BigBuy: {
      mode: "APPROVAL_REQUIRED",
      note: "Connector is staged; live catalog and order activation wait for verified API credentials."
    },
    Doba: {
      mode: "APPROVAL_REQUIRED",
      note: "Connector is staged; live catalog and order activation wait for verified API credentials."
    },
    Printify: {
      mode: "APPROVAL_REQUIRED",
      note: "Connector is staged; live catalog and fulfillment activation wait for verified API credentials."
    },
    WooCommerce: {
      mode: wooActive ? "ONSITE_CAPABLE" : "APPROVAL_REQUIRED",
    },
    "Adobe Commerce / Magento": {
      mode: adobeActive ? "ONSITE_CAPABLE" : "APPROVAL_REQUIRED",
    },
    "Commerce Layer": {
      mode: commerceLayerActive ? "ONSITE_CAPABLE" : "APPROVAL_REQUIRED",
    },
  };
}

Deno.serve(async (req: Request) => {
  const headers = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers,
    });
  }
  if (!authorized(req)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers,
    });
  }

  const providers = providerState();
  const provider_checkout = checkoutMap();
  const url = new URL(req.url);
  const productProvider = cleanText(url.searchParams.get("provider") || "");
  const productId = cleanText(url.searchParams.get("product_id") || "");
  const rawShelf = cleanText(url.searchParams.get("shelf") || "").toLowerCase();
  const focusShelf = /^[a-z0-9]+$/.test(rawShelf) ? rawShelf : "";

  if (url.searchParams.get("shelves") === "1") {
    const [merchantShelves, printfulShelves, cjShelves, gootenShelves, ebayShelves] = await Promise.all([
      withProviderTimeout(merchantMarketShelves(), {}, 3500),
      withProviderTimeout(printfulMarketShelves(), {}, 8000),
      withProviderTimeout(cjMarketShelves(), {}, 9000),
      withProviderTimeout(gootenMarketShelves(), {}, 8000),
      withProviderTimeout(ebayMarketShelves(focusShelf), {}, focusShelf ? 7000 : 10000)
    ]);
    const mergedShelves = mergeMarketShelves(merchantShelves, printfulShelves, gootenShelves, cjShelves, ebayShelves);
    const shelves = focusShelf ? { [focusShelf]: mergedShelves[focusShelf] || [] } : mergedShelves;
    const visibleEntries = Object.values(shelves).reduce(
      (sum: number, items: any) => sum + (Array.isArray(items) ? items.length : 0),
      0
    );
    const uniqueKeys = new Set<string>();
    for (const items of Object.values(shelves)) {
      for (const item of Array.isArray(items) ? items : []) {
        if (item?.item_id) uniqueKeys.add(String(item?.provider || "") + ":" + String(item.item_id));
      }
    }
    const uniqueProducts = uniqueKeys.size;
    return new Response(JSON.stringify({
      shelves,
      visible_product_count: uniqueProducts,
      shelf_entry_count: visibleEntries,
      provider_entry_counts: Object.fromEntries(
        Array.from(
          Object.values(shelves).flatMap((items:any)=>Array.isArray(items)?items:[])
            .reduce((m:Map<string,number>, item:any)=>{
              const key=String(item?.provider || "Unknown");
              m.set(key,(m.get(key)||0)+1);
              return m;
            },new Map<string,number>())
        )
      ),
      source: [
        "HUNT approved merchants",
        "Printful public catalog",
        env("CJ_API_KEY") || env("CJ_ACCESS_TOKEN") ? "CJdropshipping API" : null,
        "Gooten public catalog",
        env("EBAY_CLIENT_ID") && env("EBAY_CLIENT_SECRET") ? "eBay Browse Production" : null,
      ].filter(Boolean).join(" + "),
      price_note:
        "Shelf cards intentionally defer price to the product detail view so the homepage stays fast and never invents a price.",
      truth_note:
        "Only products matched to their shelf category are shown. Empty unsupported categories remain empty until a verified supplier feed is connected.",
      focused_shelf_diagnostics: focusShelf ? (ebayShelfDiagnostics.get(focusShelf) || null) : undefined,
    }), { headers });
  }

  if (productId) {
    const providerLower = productProvider.toLowerCase();
    if (providerLower === "hunt merchant" || providerLower === "merchant") {
      const product = await merchantProductDetail(productId);
      if (!product) {
        return new Response(JSON.stringify({ error: "product not found" }), { status:404, headers });
      }
      return new Response(JSON.stringify({
        product,
        provider_checkout,
        checkout:{
          mode:"EXTERNAL_PARTNER",
          external_purchase_links_enabled:true,
          public_checkout_enabled:false
        },
        truth_note:"This approved merchant product is discovered on HUNT, but checkout is completed by the partner store."
      }),{headers});
    }
    if (providerLower === "ebay") {
      const product = await ebayProductDetail(productId);
      if (!product) {
        return new Response(JSON.stringify({ error: "product not found" }), { status: 404, headers });
      }
      return new Response(JSON.stringify({
        product,
        provider_checkout,
        checkout: {
          mode: "ONSITE_FIRST",
          external_purchase_links_enabled: false,
          public_checkout_enabled: false,
        },
        truth_note:
          "eBay product, price and availability are live marketplace data. Onsite purchase stays disabled until eBay Order API production approval is active.",
      }), { headers });
    }
    if (providerLower === "cjdropshipping" || providerLower === "cj") {
      const product = await cjProductDetail(productId);
      if (!product) {
        return new Response(JSON.stringify({ error: "product not found" }), {
          status: 404,
          headers,
        });
      }
      return new Response(JSON.stringify({
        product,
        provider_checkout,
        checkout: {
          mode: "ONSITE_FIRST",
          external_purchase_links_enabled: false,
          public_checkout_enabled: false,
        },
        truth_note:
          "CJ supplier prices and variants are live provider data. Shipping and final availability are rechecked before order activation.",
      }), { headers });
    }
    if (providerLower === "gooten") {
      const product = await gootenProductDetail(productId);
      if (!product) {
        return new Response(JSON.stringify({ error: "product not found" }), {
          status: 404,
          headers,
        });
      }
      return new Response(JSON.stringify({
        product,
        provider_checkout,
        checkout: {
          mode: "ONSITE_FIRST",
          external_purchase_links_enabled: false,
          public_checkout_enabled: false,
        },
        truth_note:
          "Gooten public catalog data is live. Variants, shipping quotes and orders remain disabled until API credentials are verified.",
      }), { headers });
    }
    if (productProvider && providerLower !== "printful") {
      return new Response(JSON.stringify({
        error: "product detail provider is not live yet",
        provider: productProvider,
      }), { status: 404, headers });
    }
    const product = await printfulProductDetail(productId);
    if (!product) {
      return new Response(JSON.stringify({ error: "product not found" }), {
        status: 404,
        headers,
      });
    }
    return new Response(JSON.stringify({
      product,
      provider_checkout,
      checkout: {
        mode: "ONSITE_FIRST",
        external_purchase_links_enabled: false,
        public_checkout_enabled: Object.values(provider_checkout).some(
          (item: { mode: string }) => item.mode === "ONSITE_CAPABLE"
        ),
      },
      truth_note:
        "Variant prices are supplier base costs from the connected catalog, not final customer retail prices.",
    }), { headers });
  }

  const merchant_products = await printfulCatalog(24);
  const publicCheckoutEnabled = Object.values(provider_checkout).some(
    (item: { mode: string }) => item.mode === "ONSITE_CAPABLE"
  );

  return new Response(
    JSON.stringify({
      deals: [],
      merchant_products,
      commerce: {
        candidate_count: 0,
        public_test_sell_count: 0,
        live_catalog_count: merchant_products.length,
        outbound_clicks: 0,
        conversions: 0,
        confirmed_commission_usd: 0,
        reversed_commission_usd: 0,
        net_confirmed_commission_usd: 0,
      },
      providers,
      provider_checkout,
      checkout: {
        mode: "ONSITE_FIRST",
        external_purchase_links_enabled: false,
        public_checkout_enabled: publicCheckoutEnabled,
      },
      live_search_enabled: true,
      truth_note:
        "Live search can show discovery results. Smart Deal Picks remain empty until evidence qualifies a candidate.",
    }),
    { headers }
  );
});