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

const storeHeaders = expectedStoreId ? { "X-PF-Store-Id": expectedStoreId } : {};
const products = await getJson("/store/products", storeHeaders);
result.auth = products.ok ? "VERIFIED" : `FAILED_HTTP_${products.status}`;
result.store = products.ok ? "STORE_CONTEXT_VERIFIED" : "STORE_CONTEXT_FAILED";
result.sync_products = products.ok ? "READ_ONLY_VERIFIED" : `FAILED_HTTP_${products.status}`;

const rows = Array.isArray(products.body?.result) ? products.body.result : [];
result.sample_count = rows.length;
if (expectedStoreId) result.store_id = expectedStoreId;
if (!products.ok) {
  result.api_error = products.body?.result || products.body?.error || products.body?.message || products.body?.code || "UNKNOWN";
}

console.log(JSON.stringify(result, null, 2));
if (result.auth !== "VERIFIED" || result.sync_products !== "READ_ONLY_VERIFIED") process.exit(3);
