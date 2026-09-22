const token = (process.env.PRINTFUL_API_TOKEN || "").trim();
const expectedStoreId = (process.env.PRINTFUL_STORE_ID || "").trim();
const base = "https://api.printful.com";

const result = {
  provider: "Printful",
  mode: "READ_ONLY",
  token_present: Boolean(token),
  expected_store_id_present: Boolean(expectedStoreId),
  auth: "NOT_CHECKED",
  store: "NOT_CHECKED",
  sync_products: "NOT_CHECKED",
  shipping: "NOT_VERIFIED",
  fulfillment: "DISABLED",
};

if (!token) {
  result.auth = "TOKEN_REQUIRED";
  console.log(JSON.stringify(result, null, 2));
  process.exit(2);
}

const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
const getJson = async (path, extraHeaders = {}) => {
  const r = await fetch(base + path, { headers: { ...headers, ...extraHeaders } });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
};

const stores = await getJson("/stores");
result.auth = stores.ok ? "VERIFIED" : `FAILED_HTTP_${stores.status}`;

const storeList = Array.isArray(stores.body?.result) ? stores.body.result : [];
const selected = expectedStoreId
  ? storeList.find((s) => String(s?.id) === expectedStoreId)
  : storeList[0];

if (selected?.id) {
  result.store = "VERIFIED";
  result.store_id = String(selected.id);
  result.store_name = String(selected.name || "");
} else if (stores.ok) {
  result.store = expectedStoreId ? "EXPECTED_STORE_NOT_FOUND" : "NO_STORE_FOUND";
}

if (stores.ok && selected?.id) {
  const storeHeaders = { "X-PF-Store-Id": String(selected.id) };
  const products = await getJson("/store/products?limit=1", storeHeaders);
  result.sync_products = products.ok ? "READ_ONLY_VERIFIED" : `FAILED_HTTP_${products.status}`;
}

console.log(JSON.stringify(result, null, 2));
if (result.auth !== "VERIFIED" || result.store !== "VERIFIED") process.exit(3);
