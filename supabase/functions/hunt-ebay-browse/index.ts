import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { catalogSafetyTitle } from "../_shared/hunt-catalog-warehouse.ts";

const env = (name: string) => (Deno.env.get(name) || "").trim();
const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
const EBAY_SCOPE = "https://api.ebay.com/oauth/api_scope";
const EBAY_API = "https://api.ebay.com";
const EBAY_TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";

const MARKETPLACES = new Set([
  "EBAY_US","EBAY_GB","EBAY_DE","EBAY_FR","EBAY_IT","EBAY_ES","EBAY_AU","EBAY_CA"
]);

const DEPARTMENTS: Record<string,string> = {
  women: "women fashion clothing",
  women_accessories: "women fashion accessories",
  dresses: "women dresses",
  tops: "women tops shirts",
  bottoms: "women pants skirts",
  jackets: "women jackets coats",
  knitwear: "women knitwear sweaters",
  activewear: "women activewear",
  shoes: "women shoes",
  bags: "women handbags",
  jewelry: "women jewelry",
  accessories: "women fashion accessories",
  hats: "women hats",
  men: "men fashion clothing",
  suits: "men suits",
  underwear: "men underwear",
  socks: "men socks"
};

const EXTRA_BLOCKED = [
  "thong","g-string","g string","erotic","fetish","sexy lingerie",
  "weight loss","waist trainer","body shaper","slimming belt"
];

let tokenCache: {value:string; expiresAt:number} | null = null;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {"Content-Type":"application/json","Cache-Control":"no-store"}
  });
}

function authorized(req: Request) {
  const expected = env("HUNT_EBAY_INTERNAL_TOKEN");
  const supplied = clean(req.headers.get("x-hunt-ebay-token"));
  return Boolean(expected) && supplied === expected;
}

function credentials() {
  return {
    clientId: env("EBAY_CLIENT_ID"),
    clientSecret: env("EBAY_CLIENT_SECRET")
  };
}

function marketplace() {
  const configured = env("EBAY_MARKETPLACE_ID") || "EBAY_US";
  return MARKETPLACES.has(configured) ? configured : "EBAY_US";
}

function safeQuery(value: unknown) {
  const query = clean(value).replace(/\s+/g, " ").slice(0, 100);
  if (!query || !catalogSafetyTitle(query)) return "";
  const lower = query.toLowerCase();
  if (EXTRA_BLOCKED.some(term => lower.includes(term))) return "";
  return query;
}

function safeItem(item: any) {
  const title = clean(item?.title);
  if (!title || !catalogSafetyTitle(title)) return false;
  const lower = title.toLowerCase();
  if (EXTRA_BLOCKED.some(term => lower.includes(term))) return false;
  if (item?.adultOnly === true) return false;
  return true;
}

function fixedPrice(item: any) {
  return Array.isArray(item?.buyingOptions) && item.buyingOptions.includes("FIXED_PRICE");
}

function positiveMoney(value: any) {
  const amount = Number(value?.value);
  const currency = clean(value?.currency);
  return Number.isFinite(amount) && amount > 0 && /^[A-Z]{3}$/.test(currency)
    ? {amount, currency}
    : null;
}

function normalizeSummary(item: any) {
  const price = positiveMoney(item?.price);
  const image = clean(item?.image?.imageUrl);
  const shipping = Array.isArray(item?.shippingOptions)
    ? item.shippingOptions.map((x: any) => ({
        type: clean(x?.shippingCostType) || null,
        cost: positiveMoney(x?.shippingCost),
        min_estimated_delivery_date: clean(x?.minEstimatedDeliveryDate) || null,
        max_estimated_delivery_date: clean(x?.maxEstimatedDeliveryDate) || null
      }))
    : [];
  return {
    provider: "eBay",
    item_id: clean(item?.itemId),
    category: null,
    title: clean(item?.title),
    image_url: image.startsWith("https://") ? image : null,
    gallery: Array.isArray(item?.thumbnailImages)
      ? item.thumbnailImages.map((x:any)=>clean(x?.imageUrl)).filter((x:string)=>x.startsWith("https://")).slice(0,12)
      : [],
    price_amount: price?.amount ?? null,
    currency: price?.currency ?? null,
    price_basis: "MARKETPLACE_RETAIL",
    availability_verified: false,
    source_fresh_at: new Date().toISOString(),
    marketplace_id: marketplace(),
    condition: clean(item?.condition) || null,
    buying_options: Array.isArray(item?.buyingOptions) ? item.buyingOptions : [],
    seller: item?.seller ? {
      username: clean(item.seller.username) || null,
      feedback_percentage: Number.isFinite(Number(item.seller.feedbackPercentage))
        ? Number(item.seller.feedbackPercentage)
        : null,
      feedback_score: Number.isFinite(Number(item.seller.feedbackScore))
        ? Number(item.seller.feedbackScore)
        : null
    } : null,
    shipping_options: shipping,
    source_url: clean(item?.itemWebUrl) || null,
    external_visit_url: clean(item?.itemAffiliateWebUrl) || clean(item?.itemWebUrl) || null,
    item_end_date: clean(item?.itemEndDate) || null,
    catalog_discovery: true,
    merchant_product: false
  };
}

function normalizeDetail(item: any) {
  const base = normalizeSummary(item);
  const endTs = Date.parse(clean(item?.itemEndDate));
  const endActive = !Number.isFinite(endTs) || endTs > Date.now();
  const availabilityState = clean(item?.estimatedAvailabilities?.[0]?.estimatedAvailabilityStatus).toUpperCase();
  const inStock = availabilityState === "IN_STOCK";
  const available = safeItem(item) && fixedPrice(item) && endActive && inStock;
  const primary = positiveMoney(item?.price);
  const estimated = Array.isArray(item?.estimatedAvailabilities)
    ? item.estimatedAvailabilities.map((x:any)=>({
        status: clean(x?.estimatedAvailabilityStatus) || null,
        quantity: Number.isFinite(Number(x?.estimatedAvailableQuantity))
          ? Math.max(0, Math.trunc(Number(x.estimatedAvailableQuantity)))
          : null,
        sold_quantity: Number.isFinite(Number(x?.estimatedSoldQuantity))
          ? Math.max(0, Math.trunc(Number(x.estimatedSoldQuantity)))
          : null
      }))
    : [];
  return {
    ...base,
    price_amount: primary?.amount ?? base.price_amount,
    currency: primary?.currency ?? base.currency,
    availability_verified: available,
    last_stock_check_at: new Date().toISOString(),
    estimated_availability: estimated,
    return_terms: item?.returnTerms ? {
      returns_accepted: item.returnTerms.returnsAccepted === true,
      refund_method: clean(item.returnTerms.refundMethod) || null,
      return_method: clean(item.returnTerms.returnMethod) || null,
      return_period: item.returnTerms.returnPeriod ? {
        value: Number.isFinite(Number(item.returnTerms.returnPeriod.value))
          ? Number(item.returnTerms.returnPeriod.value)
          : null,
        unit: clean(item.returnTerms.returnPeriod.unit) || null
      } : null
    } : null,
    short_description: clean(item?.shortDescription) || null,
    item_location: item?.itemLocation ? {
      country: clean(item.itemLocation.country) || null,
      postal_code: clean(item.itemLocation.postalCode) || null
    } : null
  };
}

async function applicationToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.value;
  const {clientId, clientSecret} = credentials();
  if (!clientId || !clientSecret) throw new Error("eBay credentials are not configured.");
  const basic = btoa(`${clientId}:${clientSecret}`);
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: EBAY_SCOPE
  });
  const res = await fetch(EBAY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok || !clean(data?.access_token)) {
    throw new Error(`eBay OAuth failed (${res.status}).`);
  }
  const ttl = Math.max(60, Number(data?.expires_in) || 7200);
  tokenCache = {
    value: clean(data.access_token),
    expiresAt: Date.now() + ttl * 1000
  };
  return tokenCache.value;
}

async function ebayFetch(path: string) {
  const token = await applicationToken();
  const res = await fetch(EBAY_API + path, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": marketplace(),
      "Accept": "application/json"
    }
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) {
    const message = clean(data?.errors?.[0]?.message) || `eBay API failed (${res.status}).`;
    throw new Error(message);
  }
  return data;
}

async function search(body: any) {
  const department = clean(body?.department).toLowerCase();
  const preset = DEPARTMENTS[department] || "";
  const query = safeQuery(body?.q) || preset;
  if (!query) throw new Error("Safe fashion search query required.");
  const limit = Math.max(1, Math.min(50, Number(body?.limit) || 24));
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    filter: "conditions:{NEW}"
  });
  const data = await ebayFetch("/buy/browse/v1/item_summary/search?" + params.toString());
  const items = (Array.isArray(data?.itemSummaries) ? data.itemSummaries : [])
    .filter((item:any)=>safeItem(item) && fixedPrice(item))
    .map(normalizeSummary);
  return {
    provider: "eBay",
    marketplace_id: marketplace(),
    query,
    department: department || null,
    total_from_ebay: Number(data?.total) || 0,
    returned: items.length,
    filters: ["NEW","FIXED_PRICE"],
    sort_policy: "EBAY_DEFAULT_RELEVANCE",
    items
  };
}

async function itemDetail(body: any) {
  const itemId = clean(body?.item_id).slice(0, 220);
  if (!itemId || !/^[A-Za-z0-9|_-]+$/.test(itemId)) throw new Error("Valid eBay item_id required.");
  const item = await ebayFetch("/buy/browse/v1/item/" + encodeURIComponent(itemId));
  if (!safeItem(item) || !fixedPrice(item)) throw new Error("Item does not pass HUNT marketplace policy.");
  return {provider:"eBay", marketplace_id:marketplace(), product:normalizeDetail(item)};
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({error:"POST required"},405);
  if (!authorized(req)) return json({error:"unauthorized"},401);

  let body: any = {};
  try { body = await req.json(); } catch {}

  const action = clean(body?.action).toLowerCase();
  if (action === "status") {
    const {clientId, clientSecret} = credentials();
    return json({
      ok:true,
      provider:"eBay",
      configured:Boolean(clientId && clientSecret),
      client_id_present:Boolean(clientId),
      client_secret_present:Boolean(clientSecret),
      marketplace_id:marketplace(),
      mode:"FASHION_FIRST",
      supported_departments:Object.keys(DEPARTMENTS),
      oauth:"client_credentials",
      browse_api:true,
      checkout_api:false
    });
  }

  try {
    if (action === "search") return json({ok:true, ...(await search(body))});
    if (action === "item") return json({ok:true, ...(await itemDetail(body))});
    return json({error:"supported actions: status, search, item"},400);
  } catch (error) {
    return json({
      error:error instanceof Error ? error.message : "eBay adapter failed"
    },502);
  }
});
