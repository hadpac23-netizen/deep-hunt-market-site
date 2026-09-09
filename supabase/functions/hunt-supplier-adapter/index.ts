import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";

const BLOCKED_TERMS = [
  "gun","firearm","ammunition","ammo","weapon","switchblade","taser","knife","dagger","sword","machete",
  "pepper spray","mace","brass knuckle","firework","explosive","detonator","poison","pesticide",
  "cannabis","marijuana","thc","cbd","cocaine","heroin","meth","steroid","vape","cigarette","nicotine",
  "beer","wine","vodka","whiskey","whisky","rum","tequila","casino","sportsbook","betting","porn","sex toy",
  "spyware","diet pill","laxative"
];

const env = (name: string) => (Deno.env.get(name) || "").trim();
const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
const isSafeTitle = (title: string) => {
  const lower = title.toLowerCase();
  return title.length >= 3 && !BLOCKED_TERMS.some(term => lower.includes(term));
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {"Content-Type":"application/json","Cache-Control":"no-store"}
  });
}
function secretKey() {
  try {
    const keys = JSON.parse(env("SUPABASE_SECRET_KEYS") || "{}");
    return clean(keys?.default) || env("SUPABASE_SERVICE_ROLE_KEY");
  } catch {
    return env("SUPABASE_SERVICE_ROLE_KEY");
  }
}

function authorized(req: Request) {
  const expected = env("HUNT_SUPPLIER_INTERNAL_TOKEN");
  const supplied = clean(req.headers.get("x-hunt-internal-token"));
  return Boolean(expected) && supplied === expected;
}

function providerStatus() {
  return {
    orpe: {
      status: env("ORPE_FEED_URL") ? "configured" : "credentials_required",
      feed_url: Boolean(env("ORPE_FEED_URL")),
      feed_format: env("ORPE_FEED_FORMAT") || "csv",
      authorization: Boolean(env("ORPE_FEED_AUTHORIZATION"))
    },
    perfumes_wholesale: {
      status: env("PERFUMES_WHOLESALE_USERNAME") && env("PERFUMES_WHOLESALE_PASSWORD")
        ? "credentials_present_api_driver_pending" : "credentials_required",
      api_base: "https://api2.perfumes-wholesale.eu"
    }
  };
}
function parseCsv(text: string, delimiter: string): Record<string,string>[] {
  const rows: string[][] = [];
  const sep = delimiter === "\t" ? "\t" : (delimiter || ",").slice(0,1);
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === sep && !quoted) {
      row.push(cell); cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some(x => x.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  const header = (rows.shift() || []).map((x,i) => (i===0 ? x.replace(/^\uFEFF/,"") : x).trim());
  return rows.map(values => Object.fromEntries(header.map((key,i)=>[key,clean(values[i])])));
}
function parseFeed(text: string, format: string): Record<string,unknown>[] {
  if (format === "json") {
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    for (const key of ["products","items","rows","data"]) {
      if (Array.isArray(data?.[key])) return data[key];
    }
    return [];
  }
  if (format === "csv") return parseCsv(text,env("ORPE_CSV_DELIMITER") || ",");
  throw new Error("Unsupported feed format. Use csv or json.");
}

function field(raw: Record<string,unknown>, map: Record<string,string>, name: string, candidates: string[]) {
  const mapped = clean(map?.[name]);
  if (mapped && raw[mapped] !== undefined) return raw[mapped];
  for (const key of candidates) if (raw[key] !== undefined) return raw[key];
  return null;
}

function numberValue(value: unknown) {
  let raw = String(value ?? "").trim().replace(/\s+/g,"").replace(/[^0-9,.-]/g,"");
  if (raw.includes(",") && !raw.includes(".")) raw = raw.replace(",", ".");
  else raw = raw.replace(/,/g,"");
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
function inferCategory(title: string, rawType: string) {
  const text = (title + " " + rawType).toLowerCase();
  if (/perfume|fragrance|parfum|eau de|cologne|aftershave/.test(text)) return "perfume";
  if (/beauty|cosmetic|skincare|makeup|serum|cream|shampoo|conditioner/.test(text)) return "beauty";
  return "";
}

function normalizeOrpe(raw: Record<string,unknown>, map: Record<string,string>) {
  const itemId = clean(field(raw,map,"item_id",["id","item_id","product_id","sku","code"]));
  const title = clean(field(raw,map,"title",["title","name","product_name","product"]));
  const rawType = clean(field(raw,map,"type",["type","category","category_name","product_type"]));
  const category = inferCategory(title,rawType);
  if (!itemId || !title || !category || !isSafeTitle(title)) return null;

  const price = numberValue(field(raw,map,"price",["price","wholesale_price","net_price","price_amount"]));
  const stock = numberValue(field(raw,map,"stock",["stock","quantity","qty","inventory","stock_quantity"]));
  const volume = numberValue(field(raw,map,"volume_ml",["volume_ml","volume","size_ml"]));
  const image = clean(field(raw,map,"image_url",["image_url","image","photo","main_image"]));
  return {
    provider:"ORPE",
    item_id:itemId,
    category,
    title,
    image_url:image.startsWith("https://") ? image : null,
    price_amount:price && price > 0 ? price : null,
    currency:clean(field(raw,map,"currency",["currency","currency_code"])) || "EUR",
    price_basis:"SUPPLIER_BASE",
    availability_verified:stock !== null && stock > 0,
    stock_quantity:stock === null ? null : Math.max(0,Math.trunc(stock)),
    brand:clean(field(raw,map,"brand",["brand","manufacturer","brand_name"])) || null,
    ean:clean(field(raw,map,"ean",["ean","ean13","barcode","gtin"])) || null,
    supplier_sku:clean(field(raw,map,"supplier_sku",["sku","supplier_sku","code"])) || itemId,
    product_line:clean(field(raw,map,"product_line",["line","product_line","collection"])) || null,
    volume_ml:volume && volume > 0 ? volume : null,
    concentration:clean(field(raw,map,"concentration",["concentration","fragrance_type"])) || null,
    gender:clean(field(raw,map,"gender",["gender","sex"])) || null,
    source_region:"EU",
    authenticity_status:"unverified",
    source_fresh_at:new Date().toISOString(),
    last_stock_check_at:stock === null ? null : new Date().toISOString(),
    updated_at:new Date().toISOString()
  };
}
async function loadOrpeFeed() {
  const url = env("ORPE_FEED_URL");
  if (!url) throw new Error("ORPE_FEED_URL is not configured.");
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("ORPE feed must use HTTPS.");
  const headers: Record<string,string> = {"Accept":"text/csv,application/json;q=0.9,*/*;q=0.1"};
  const auth = env("ORPE_FEED_AUTHORIZATION");
  if (auth) headers["Authorization"] = auth;
  const res = await fetch(parsed,{headers,redirect:"follow"});
  if (!res.ok) throw new Error("ORPE feed returned HTTP " + res.status);
  const length = Number(res.headers.get("content-length") || 0);
  if (length > 15_000_000) throw new Error("ORPE feed is larger than the 15 MB safety limit.");
  const text = await res.text();
  if (text.length > 15_000_000) throw new Error("ORPE feed exceeds the 15 MB safety limit.");
  const format = (env("ORPE_FEED_FORMAT") || "csv").toLowerCase();
  const map = (() => { try { return JSON.parse(env("ORPE_FEED_FIELD_MAP") || "{}"); } catch { return {}; } })();
  return parseFeed(text,format).map(row=>normalizeOrpe(row,map)).filter(Boolean);
}
async function upsertProducts(products: Record<string,unknown>[]) {
  const key = secretKey();
  const url = env("SUPABASE_URL");
  if (!key || !url) throw new Error("Supabase secret environment is unavailable.");
  const client = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const batches = [];
  for (let i=0;i<products.length;i+=250) batches.push(products.slice(i,i+250));
  let written = 0;
  for (const batch of batches) {
    const {error} = await client.from("hunt_catalog_products")
      .upsert(batch,{onConflict:"provider,item_id,category",ignoreDuplicates:false});
    if (error) throw new Error(error.message);
    written += batch.length;
  }
  return written;
}

Deno.serve(async(req: Request) => {
  if (req.method !== "POST") return json({error:"POST required"},405);
  if (!authorized(req)) return json({error:"unauthorized"},401);
  let body: any = {};
  try { body = await req.json(); } catch {}
  if (body?.action === "status") {
    return json({ok:true,providers:providerStatus()});
  }
  if (body?.action !== "import" || body?.provider !== "orpe") {
    return json({error:"supported action: import, provider: orpe"},400);
  }

  try {
    const products = await loadOrpeFeed();
    const dryRun = body?.dry_run !== false;
    if (dryRun) {
      return json({
        ok:true,dry_run:true,provider:"ORPE",
        normalized_count:products.length,
        sample:products.slice(0,5)
      });
    }
    const written = await upsertProducts(products as Record<string,unknown>[]);
    return json({ok:true,dry_run:false,provider:"ORPE",written});
  } catch (error) {
    return json({error:error instanceof Error ? error.message : "supplier import failed"},502);
  }
});
