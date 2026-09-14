import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const shardDir = path.join(root, "catalog-shards");
const shardFiles = fs.readdirSync(shardDir).filter((name) => name.endsWith(".json"));
const readiness = JSON.parse(fs.readFileSync(new URL("../catalog-readiness.json", import.meta.url)));

const entries = shardFiles.flatMap((name) => {
  const shard = JSON.parse(fs.readFileSync(path.join(shardDir, name), "utf8"));
  return Array.isArray(shard?.products) ? shard.products : [];
});
const unique = new Map();
for (const product of entries) {
  const provider = String(product?.provider || "").trim();
  const itemId = String(product?.item_id || "").trim();
  if (provider && itemId) unique.set(`${provider}:${itemId}`, product);
}

const quoteVerified = new Set(
  (readiness?.quote_verified?.products || []).map((product) =>
    `${String(product?.provider || "").trim()}:${String(product?.item_id || "").trim()}`
  )
);

const isPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};

const report = {
  generated_at: new Date().toISOString(),
  catalog_generated_at: readiness.generated_at || null,
  shard_files: shardFiles.length,
  unique_products: unique.size,
  shelf_entries: entries.length,
  providers: {},
  gates: {
    catalog_valid: 0,
    legacy_availability_verified: 0,
    stock_evidence_present: 0,
    price_present: 0,
    quote_verified: 0,
    checkout_candidates: 0,
    public_checkout_enabled: 0,
  },
  failures: {
    missing_identity: 0,
    missing_title: 0,
    missing_image: 0,
    missing_stock_evidence: 0,
    missing_price: 0,
    missing_quote: 0,
  },
};

for (const [key, product] of unique) {
  const provider = String(product.provider).trim();
  report.providers[provider] = (report.providers[provider] || 0) + 1;
  const identityOk = Boolean(provider && String(product.item_id || "").trim());
  const titleOk = Boolean(String(product.title || "").trim());
  const imageOk = /^https:\/\//i.test(String(product.image_url || "").trim());
  const legacyAvailable = product.availability_verified === true;
  const detailVerified = product.detail_verified === true;
  const positiveStock = isPositiveNumber(product.stock_quantity);
  const price = Number(product.retail_price_amount ?? product.price_amount);
  const priceOk = Number.isFinite(price) && price > 0;
  const quoted = quoteVerified.has(key);
  const quotePassed = product.quote_verification_status === "PASS" && quoted;
  const stockEvidence = legacyAvailable || (detailVerified && positiveStock && quotePassed);
  const checkoutCandidate =
    identityOk && titleOk && imageOk && stockEvidence && priceOk && quotePassed;

  if (!identityOk) report.failures.missing_identity++;
  if (!titleOk) report.failures.missing_title++;
  if (!imageOk) report.failures.missing_image++;
  if (!stockEvidence) report.failures.missing_stock_evidence++;
  if (!priceOk) report.failures.missing_price++;
  if (!quoted) report.failures.missing_quote++;

  if (identityOk && titleOk && imageOk) report.gates.catalog_valid++;
  if (legacyAvailable) report.gates.legacy_availability_verified++;
  if (stockEvidence) report.gates.stock_evidence_present++;
  if (priceOk) report.gates.price_present++;
  if (quoted) report.gates.quote_verified++;
  if (checkoutCandidate) report.gates.checkout_candidates++;
  // Payments remain intentionally disabled while the storefront is PRELAUNCH.
  if (checkoutCandidate && product.checkout_status === "LIVE") {
    report.gates.public_checkout_enabled++;
  }
}

console.log(JSON.stringify(report, null, 2));
