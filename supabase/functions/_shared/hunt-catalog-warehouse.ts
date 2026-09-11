const ALLOWED_CATEGORIES = new Set([
  "women","men","kids","beauty","perfume","dresses","tops","bottoms","hoodies","jackets","knitwear",
  "activewear","suits","underwear","womenunderwear","menunderwear","kidsunderwear","sleepwear","loungewear","plussize","petite","maternity","sets","swimwear","bags","shoes","accessories","jewelry","hats","socks","home","kitchen","storage",
  "bedding","bath","lighting","cleaning","tech","phoneaccessories","gaming","sports","outdoors","travel",
  "toys","pets","crafts","party","gifts","office","stationery","pillows","blankets","wallart","drinkware","ornaments"
]);

const BLOCKED_TERMS = [
  "gun","firearm","ammunition","ammo","weapon","switchblade","taser","knife","dagger","sword","machete",
  "pepper spray","mace","brass knuckle","firework","explosive","detonator","poison","pesticide",
  "cannabis","marijuana","thc","cbd","cocaine","heroin","meth","steroid","vape","cigarette","nicotine",
  "beer","wine","vodka","whiskey","whisky","rum","tequila","casino","sportsbook","betting","porn","sex toy",
  "adult toy","vibrator","dildo","masturbator","bdsm","cock ring","butt plug","spyware","diet pill","laxative"
];

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
const MAX_SOURCE_AGE_MS = 6 * 60 * 60 * 1000;
const PUBLISHABLE_ELIGIBILITY = new Set(["eligible","unrestricted","global"]);
const PUBLISHABLE_AUTHENTICITY = new Set(["supplier_claimed_original","verified","authorized"]);
const freshEnough = (value: unknown) => {
  const ts = Date.parse(clean(value));
  return Number.isFinite(ts) && Date.now() - ts <= MAX_SOURCE_AGE_MS;
};
const safeTitle = (title: string) => {
  const lower = title.toLowerCase();
  if (title.length < 3 || BLOCKED_TERMS.some(term => lower.includes(term))) return false;
  if (/\b(temu\s*&\s*tk|tmeu|tk\s*only|supports?\s+pickup|self[- ]?pickup|shipment\s+from\s+walmart|logistics\s+only)\b/.test(lower)) return false;
  return true;
};
export const catalogSafetyTitle = safeTitle;
export async function catalogWarehouseShelves(db: any) {
  if (!db) return {};
  const {data,error} = await db.from("hunt_catalog_products")
    .select("provider,item_id,category,title,image_url,price_amount,currency,price_basis,availability_verified,source_fresh_at,brand,ean,supplier_sku,product_line,volume_ml,concentration,gender,stock_quantity,source_region,authenticity_status,market_eligibility_status,market_restrictions,last_stock_check_at")
    .order("source_fresh_at",{ascending:false})
    .limit(2500);
  if (error || !Array.isArray(data)) return {};

  const out: Record<string,any[]> = {};
  for (const raw of data) {
    const category = clean(raw?.category).toLowerCase();
    const title = clean(raw?.title);
    const eligibility = clean(raw?.market_eligibility_status).toLowerCase();
    const authenticity = clean(raw?.authenticity_status).toLowerCase();
    const price = Number(raw?.price_amount);
    const stock = Number(raw?.stock_quantity);
    const image = clean(raw?.image_url);
    const publishable =
      ALLOWED_CATEGORIES.has(category) &&
      safeTitle(title) &&
      image.startsWith("https://") &&
      Number.isFinite(price) && price > 0 &&
      raw?.availability_verified === true &&
      Number.isFinite(stock) && stock > 0 &&
      freshEnough(raw?.source_fresh_at) &&
      PUBLISHABLE_ELIGIBILITY.has(eligibility) &&
      PUBLISHABLE_AUTHENTICITY.has(authenticity);
    if (!publishable) continue;
    if (!out[category]) out[category] = [];
    if (out[category].length >= 240) continue;
    out[category].push({
      provider:clean(raw?.provider),
      item_id:clean(raw?.item_id),
      category,
      title,
      image_url:clean(raw?.image_url) || null,
      price_amount:Number.isFinite(price) && price > 0 ? price : null,
      currency:clean(raw?.currency) || "EUR",
      price_basis:clean(raw?.price_basis) || "SUPPLIER_BASE",
      availability_verified:raw?.availability_verified === true,
      stock_quantity:Number.isFinite(stock) ? Math.max(0,Math.trunc(stock)) : null,
      brand:clean(raw?.brand) || null,
      ean:clean(raw?.ean) || null,
      supplier_sku:clean(raw?.supplier_sku) || null,
      product_line:clean(raw?.product_line) || null,
      volume_ml:raw?.volume_ml == null ? null : Number(raw.volume_ml),
      concentration:clean(raw?.concentration) || null,
      gender:clean(raw?.gender) || null,
      source_region:clean(raw?.source_region) || null,
      authenticity_status:clean(raw?.authenticity_status) || "unverified",
      market_eligibility_status:clean(raw?.market_eligibility_status) || "unknown",
      market_restrictions:raw?.market_restrictions ?? null,
      source_fresh_at:raw?.source_fresh_at || null,
      last_stock_check_at:raw?.last_stock_check_at || null,
      merchant_product:true
    });
  }
  return out;
}

const WAREHOUSE_DETAIL_PROVIDERS = new Set(["brandsdistribution","orpe"]);

export async function catalogWarehouseProductDetail(db:any, provider:string, itemId:string) {
  if (!db) return null;
  const providerKey = clean(provider).toLowerCase();
  const safeId = clean(itemId).slice(0,160);
  if (!WAREHOUSE_DETAIL_PROVIDERS.has(providerKey) || !safeId) return null;
  const canonicalProvider = providerKey === "orpe" ? "ORPE" : "Brandsdistribution";
  const {data,error} = await db.from("hunt_catalog_products")
    .select("provider,item_id,category,title,image_url,price_amount,currency,price_basis,availability_verified,source_fresh_at,brand,ean,supplier_sku,product_line,volume_ml,concentration,gender,stock_quantity,source_region,authenticity_status,market_eligibility_status,market_restrictions,last_stock_check_at,updated_at")
    .eq("provider",canonicalProvider)
    .eq("item_id",safeId)
    .order("updated_at",{ascending:false})
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const title = clean(data.title);
  const category = clean(data.category).toLowerCase();
  const price = Number(data.price_amount);
  const stock = Number(data.stock_quantity);
  const image = clean(data.image_url);
  const eligibility = clean(data.market_eligibility_status).toLowerCase();
  const authenticity = clean(data.authenticity_status).toLowerCase();
  const publishable = ALLOWED_CATEGORIES.has(category) && safeTitle(title) && image.startsWith("https://") &&
    Number.isFinite(price) && price > 0 && data.availability_verified === true && Number.isFinite(stock) && stock > 0 &&
    freshEnough(data.source_fresh_at) && PUBLISHABLE_ELIGIBILITY.has(eligibility) && PUBLISHABLE_AUTHENTICITY.has(authenticity);
  if (!publishable) return null;
  return {
    provider:canonicalProvider,item_id:safeId,category,title,image_url:image,gallery:[image],brand:clean(data.brand)||null,
    ean:clean(data.ean)||null,supplier_sku:clean(data.supplier_sku)||null,product_line:clean(data.product_line)||null,
    volume_ml:data.volume_ml==null?null:Number(data.volume_ml),concentration:clean(data.concentration)||null,gender:clean(data.gender)||null,
    price_amount:price,currency:clean(data.currency)||"EUR",price_basis:clean(data.price_basis)||"SUPPLIER_BASE",
    stock_quantity:Math.trunc(stock),availability_verified:true,source_region:clean(data.source_region)||null,
    authenticity_status:authenticity,market_eligibility_status:eligibility,market_restrictions:data.market_restrictions??null,
    source_fresh_at:data.source_fresh_at,last_stock_check_at:data.last_stock_check_at,
    variants:[],variant_count:0,merchant_product:true,
    gaps:["Supplier price is a base cost, not the final HUNT retail price.","Variant-level fulfillment data is not active yet.","Checkout remains disabled until shipping, tax, retail pricing and supplier order execution are verified."]
  };
}
