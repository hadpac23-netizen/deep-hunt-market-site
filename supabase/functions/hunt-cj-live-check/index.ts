import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type CatalogRow = {
  item_id: string;
  source_fresh_at: string;
  last_stock_check_at: string | null;
};

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
});

let tokenCache = { token: "", expiresAt: 0 };

async function cjToken() {
  const direct = clean(Deno.env.get("CJ_ACCESS_TOKEN"));
  if (direct) return direct;

  const apiKey = clean(Deno.env.get("CJ_API_KEY"));
  if (!apiKey) throw new Error("CJ credentials are unavailable");
  if (tokenCache.token && tokenCache.expiresAt > Date.now()) return tokenCache.token;

  const response = await fetch(
    "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",
    {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ apiKey }),
    },
  );
  const body = await response.json().catch(() => ({}));
  const token = clean(body?.data?.accessToken);
  if (!response.ok || !token) throw new Error("CJ authentication failed");

  tokenCache = { token, expiresAt: Date.now() + 12 * 60 * 60 * 1000 };
  return token;
}

async function catalogRequest(path: string, init: RequestInit = {}) {
  const url = clean(Deno.env.get("SUPABASE_URL"));
  const serviceKey = clean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  if (!url || !serviceKey) throw new Error("Supabase server credentials are unavailable");

  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
}

async function getDueProducts(limit: number): Promise<CatalogRow[]> {
  const query = new URLSearchParams({
    provider: "eq.CJdropshipping",
    select: "item_id,source_fresh_at,last_stock_check_at",
    order: "last_stock_check_at.asc.nullsfirst,source_fresh_at.asc",
    limit: String(limit),
  });
  const response = await catalogRequest(`hunt_catalog_products?${query}`);
  if (!response.ok) throw new Error(`Catalog read failed (${response.status})`);
  const body = await response.json();
  return Array.isArray(body) ? body : [];
}

async function cjProductState(itemId: string, token: string) {
  const url = new URL("https://developers.cjdropshipping.com/api2.0/v1/product/query");
  url.searchParams.set("pid", itemId);
  const response = await fetch(url, {
    headers: { "CJ-Access-Token": token, accept: "application/json" },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || Number(body?.code || 200) !== 200 || !body?.data) {
    throw new Error(`CJ detail recheck failed (${response.status})`);
  }

  const variants = Array.isArray(body.data.variants) ? body.data.variants : [];
  const stock = variants.reduce((productTotal: number, variant: any) => {
    const inventories = Array.isArray(variant?.inventories) ? variant.inventories : [];
    return productTotal + inventories.reduce(
      (variantTotal: number, inventory: any) =>
        variantTotal + Math.max(0, Number(inventory?.totalInventory || 0)),
      0,
    );
  }, 0);
  const price = Number(body.data.sellPrice);

  return {
    availability_verified: variants.length > 0 && stock > 0,
    stock_quantity: Math.min(2_147_483_647, Math.floor(stock)),
    price_amount: Number.isFinite(price) && price > 0 ? price : null,
    currency: "USD",
  };
}

async function updateProduct(itemId: string, state: Record<string, unknown>) {
  const query = new URLSearchParams({
    provider: "eq.CJdropshipping",
    item_id: `eq.${itemId}`,
  });
  const response = await catalogRequest(`hunt_catalog_products?${query}`, {
    method: "PATCH",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify({
      ...state,
      source_fresh_at: new Date().toISOString(),
      last_stock_check_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });
  if (!response.ok) throw new Error(`Catalog update failed (${response.status})`);
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);

  const serviceKey = clean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const authorization = clean(request.headers.get("authorization"));
  if (!serviceKey || authorization !== `Bearer ${serviceKey}`) {
    return json({ error: "unauthorized" }, 401);
  }

  const input = await request.json().catch(() => ({}));
  const limit = Math.max(1, Math.min(50, Number(input?.limit || 20) || 20));
  const dryRun = input?.dry_run !== false;
  const token = await cjToken();
  const products = await getDueProducts(limit);
  const result = { checked: 0, available: 0, unavailable: 0, failed: 0, dry_run: dryRun };

  for (const product of products) {
    try {
      const state = await cjProductState(clean(product.item_id), token);
      result.checked++;
      if (state.availability_verified) result.available++;
      else result.unavailable++;
      if (!dryRun) await updateProduct(clean(product.item_id), state);
    } catch (error) {
      // A transient provider/API failure must never be converted into false stock data.
      result.failed++;
      console.error("CJ live check failed", clean(product.item_id), String(error));
    }
  }

  return json(result);
});
