import fs from "node:fs";

const target = process.argv[2] || "supabase/functions/hunt-storefront/index.ts";
if (!fs.existsSync(target)) {
  throw new Error(`Missing storefront source: ${target}`);
}

let source = fs.readFileSync(target, "utf8");

function replaceOnce(label, from, to) {
  const first = source.indexOf(from);
  if (first < 0) throw new Error(`Missing patch marker: ${label}`);
  if (source.indexOf(from, first + from.length) >= 0) {
    throw new Error(`Patch marker is not unique: ${label}`);
  }
  source = source.replace(from, to);
}

replaceOnce(
  "warehouse import",
  'import { createClient } from "jsr:@supabase/supabase-js@2";',
  'import { createClient } from "jsr:@supabase/supabase-js@2";\n' +
  'import { catalogWarehouseShelves, catalogWarehouseProductDetail } from "../_shared/hunt-catalog-warehouse.ts";'
);
replaceOnce(
  "modern secret key",
  `async function merchantDb() {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth:{persistSession:false,autoRefreshToken:false} });
}`,
  `function backendSecretKey() {
  try {
    const keys = JSON.parse(env("SUPABASE_SECRET_KEYS") || "{}");
    return cleanText(keys?.default) || env("SUPABASE_SERVICE_ROLE_KEY");
  } catch {
    return env("SUPABASE_SERVICE_ROLE_KEY");
  }
}

async function merchantDb() {
  const url = env("SUPABASE_URL");
  const key = backendSecretKey();
  if (!url || !key) return null;
  return createClient(url, key, { auth:{persistSession:false,autoRefreshToken:false} });
}`
);
replaceOnce(
  "warehouse shelves",
  `    const [merchantShelves, printfulShelves, cjShelves, gootenShelves] = await Promise.all([
      withProviderTimeout(merchantMarketShelves(), {}, 3500),
      withProviderTimeout(printfulMarketShelves(), {}, 8000),
      withProviderTimeout(cjMarketShelves(), {}, 9000),
      withProviderTimeout(gootenMarketShelves(), {}, 8000)
    ]);
    const shelves = mergeMarketShelves(merchantShelves, printfulShelves, gootenShelves, cjShelves);`,
  `    const [merchantShelves, warehouseShelves, printfulShelves, cjShelves, gootenShelves] = await Promise.all([
      withProviderTimeout(merchantMarketShelves(), {}, 3500),
      withProviderTimeout((async()=>catalogWarehouseShelves(await merchantDb()))(), {}, 3500),
      withProviderTimeout(printfulMarketShelves(), {}, 8000),
      withProviderTimeout(cjMarketShelves(), {}, 9000),
      withProviderTimeout(gootenMarketShelves(), {}, 8000)
    ]);
    const shelves = mergeMarketShelves(merchantShelves, warehouseShelves, printfulShelves, gootenShelves, cjShelves);`
);
replaceOnce(
  "warehouse product detail",
  `    if (providerLower === "cjdropshipping" || providerLower === "cj") {`,
  `    if (providerLower === "brandsdistribution" || providerLower === "orpe") {
      const product = await catalogWarehouseProductDetail(await merchantDb(), productProvider, productId);
      if (!product) {
        return new Response(JSON.stringify({ error: "product not found or not publishable" }), { status:404, headers });
      }
      return new Response(JSON.stringify({
        product,
        provider_checkout,
        checkout:{mode:"ONSITE_FIRST",external_purchase_links_enabled:false,public_checkout_enabled:false},
        truth_note:"Supplier data passed HUNT catalog truth gates. Checkout remains disabled until final retail pricing, shipping, tax and supplier order execution are verified."
      }),{headers});
    }
    if (providerLower === "cjdropshipping" || providerLower === "cj") {`
);

fs.writeFileSync(target, source);
console.log("HUNT storefront warehouse patch applied:", target);
