const ALLOWED_CATEGORIES = new Set([
  "women","men","kids","beauty","perfume","dresses","tops","bottoms","hoodies","jackets","knitwear",
  "activewear","swimwear","bags","shoes","accessories","jewelry","hats","socks","home","kitchen","storage",
  "bedding","bath","lighting","cleaning","tech","phoneaccessories","gaming","sports","outdoors","travel",
  "toys","pets","crafts","party","gifts","office","stationery","pillows","blankets","wallart","drinkware","ornaments"
]);

const BLOCKED_TERMS = [
  "gun","firearm","ammunition","ammo","weapon","switchblade","taser","knife","dagger","sword","machete",
  "pepper spray","mace","brass knuckle","firework","explosive","detonator","poison","pesticide",
  "cannabis","marijuana","thc","cbd","cocaine","heroin","meth","steroid","vape","cigarette","nicotine",
  "beer","wine","vodka","whiskey","whisky","rum","tequila","casino","sportsbook","betting","porn","sex toy",
  "spyware","diet pill","laxative"
];

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
const safeTitle = (title: string) => {
  const lower = title.toLowerCase();
  return title.length >= 3 && !BLOCKED_TERMS.some(term => lower.includes(term));
};
export async function catalogWarehouseShelves(db: any) {
  if (!db) return {};
  const {data,error} = await db.from("hunt_catalog_products")
    .select("provider,item_id,category,title,image_url,price_amount,currency,price_basis,availability_verified,source_fresh_at,brand,ean,supplier_sku,product_line,volume_ml,concentration,gender,stock_quantity,source_region,authenticity_status,last_stock_check_at")
    .order("source_fresh_at",{ascending:false})
    .limit(2500);
  if (error || !Array.isArray(data)) return {};

  const out: Record<string,any[]> = {};
  for (const raw of data) {
    const category = clean(raw?.category).toLowerCase();
    const title = clean(raw?.title);
    if (!ALLOWED_CATEGORIES.has(category) || !safeTitle(title)) continue;
    if (!out[category]) out[category] = [];
    if (out[category].length >= 240) continue;
    const price = Number(raw?.price_amount);
    const stock = Number(raw?.stock_quantity);
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
      source_fresh_at:raw?.source_fresh_at || null,
      last_stock_check_at:raw?.last_stock_check_at || null,
      merchant_product:true
    });
  }
  return out;
}
