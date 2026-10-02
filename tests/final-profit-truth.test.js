const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const mod = import("../supabase/functions/_shared/final-profit-truth.mjs");
const now = Date.parse("2026-10-02T18:00:00Z");
const context = { provider: "EPROLO", item_id: "i1", variant_id: "v1", country: "GB",
  cost_usd: 5, shipping_usd: 3, shipping_method: "verified-service", stock_quantity: 2 };
const binding = { provider: "EPROLO", item_id: "i1", variant_id: "v1" };
const proof = source_type => ({ source_type, source_ref: "fixture-only:proof-1",
  verified_at: "2026-10-02T17:45:00Z", expires_at: "2026-10-02T18:15:00Z" });
function fixture() {
  return { customs_truth_v1: { variants: { v1: { ...binding, country_of_origin: "CN",
    country_of_origin_verified: true, country_of_origin_evidence: proof("SUPPLIER_ATTESTATION"),
    markets: { GB: { ...binding, destination_country: "GB", currency: "USD", country_of_origin: "CN",
      quantity: 1, item_amount_usd: 30, shipping_usd: 3, shipping_method: "verified-service",
      landed_cost_verified: true, destination_tax_duty_verified: true, duty_tax_usd: 2,
      hs_code: "fixture-classification", classification_verified: true,
      evidence: proof("OFFICIAL_LANDED_COST_PROVIDER") } } } } },
    retail_truth_v1: { variants: { v1: { ...binding, markets: { GB: { ...binding,
      destination_country: "GB", currency: "USD", status: "PASS", retail_price_verified: true,
      market_price_verified: true, retail_usd: 30, customer_shipping_usd: 3,
      evidence: proof("MARKET_PRICE_REVIEW") } } } } } };
}
const market = s => s.customs_truth_v1.variants.v1.markets.GB;
const retail = s => s.retail_truth_v1.variants.v1.markets.GB;
test("valid exact-item, market, shipping and price proofs permit code-level final profit", async () => {
  const { finalProfitTruth } = await mod;
  const result = finalProfitTruth(fixture(), context, {}, now);
  assert.equal(result.final_profit_verified, true);
  assert.equal(result.economics.contribution, 20.03);
});
for (const [name, mutate] of [
  ["missing COO", s => delete s.customs_truth_v1.variants.v1.country_of_origin_evidence],
  ["predicted COO", s => s.customs_truth_v1.variants.v1.country_of_origin_evidence.source_type = "AI_PREDICTION"],
  ["wrong item", s => s.customs_truth_v1.variants.v1.item_id = "i2"],
  ["wrong variant", s => s.customs_truth_v1.variants.v1.variant_id = "v2"],
  ["wrong provider", s => market(s).provider = "other"],
  ["wrong destination", s => market(s).destination_country = "IL"],
  ["wrong currency", s => market(s).currency = "ILS"],
  ["wrong quote origin", s => market(s).country_of_origin = "US"],
  ["wrong amount", s => market(s).item_amount_usd = 10],
  ["wrong quantity", s => market(s).quantity = 2],
  ["wrong shipping amount", s => market(s).shipping_usd = 1],
  ["wrong shipping service", s => market(s).shipping_method = "other"],
  ["missing customs classification", s => delete market(s).hs_code],
  ["unverified classification", s => market(s).classification_verified = false],
  ["supplier taxesFee alone", s => market(s).evidence.source_type = "SUPPLIER_TAXES_FEE"],
  ["missing quote proof", s => delete market(s).evidence.source_ref],
  ["expired quote", s => market(s).evidence.expires_at = "2026-10-02T17:59:59Z"],
  ["stale quote", s => market(s).evidence.verified_at = "2026-09-28T12:00:00Z"],
  ["future quote", s => market(s).evidence.verified_at = "2026-10-02T18:01:00Z"],
  ["missing tax amount", s => delete market(s).duty_tax_usd],
  ["null tax amount", s => market(s).duty_tax_usd = null],
  ["blank tax amount", s => market(s).duty_tax_usd = " "],
  ["boolean tax amount", s => market(s).duty_tax_usd = false],
  ["array tax amount", s => market(s).duty_tax_usd = []],
  ["negative tax amount", s => market(s).duty_tax_usd = -1],
  ["string verified flag", s => market(s).landed_cost_verified = "true"],
  ["missing destination tax flag", s => delete market(s).destination_tax_duty_verified],
  ["missing retail proof", s => delete s.retail_truth_v1],
  ["market hold", s => retail(s).status = "MARKET_HOLD"],
  ["unreviewed retail", s => retail(s).market_price_verified = false],
  ["stale retail", s => retail(s).evidence.verified_at = "2026-09-28T12:00:00Z"],
  ["wrong retail variant", s => retail(s).variant_id = "v2"],
  ["unverified shipping charged", s => delete retail(s).customer_shipping_usd],
]) test(`final profit fails safely: ${name}`, async () => {
  const { finalProfitTruth } = await mod;
  const source = fixture(); mutate(source);
  assert.equal(finalProfitTruth(source, context, {}, now).final_profit_verified, false);
});
test("verified zero tax remains valid; absent tax cannot become zero", async () => {
  const { finalProfitTruth, finiteAmount } = await mod;
  const source = fixture(); market(source).duty_tax_usd = 0;
  assert.equal(finalProfitTruth(source, context, {}, now).final_profit_verified, true);
  for (const value of [null, undefined, "", " ", false, [], {}, Infinity, NaN]) assert.equal(finiteAmount(value), null);
});
test("out-of-stock and malformed supplier inventory cannot pass", async () => {
  const { finalProfitTruth } = await mod;
  for (const stock_quantity of [0, -1, null, NaN, Infinity, 0.5, "not-stock"]) {
    assert.equal(finalProfitTruth(fixture(), { ...context, stock_quantity }, {}, now).final_profit_verified, false);
  }
});
test("customer shipping charged affects contribution independently of supplier freight", async () => {
  const { finalProfitTruth } = await mod;
  const source = fixture(); retail(source).customer_shipping_usd = 0;
  assert.equal(finalProfitTruth(source, context, {}, now).economics.contribution, 17.3);
});
test("invalid profit profiles and actual unprofitable economics cannot pass", async () => {
  const { finalProfitTruth } = await mod;
  for (const profile of [{payment_rate: null}, {payment_rate: 1}, {min_margin_rate: -1}]) {
    assert.equal(finalProfitTruth(fixture(), context, profile, now).final_profit_verified, false);
  }
  assert.equal(finalProfitTruth(fixture(), {...context, cost_usd: 29}, {}, now).final_profit_verified, false);
});
test("product-level customs closure requires a complete nonempty variant set", async () => {
  const { completeCustomsCoverage } = await mod;
  const yes = { variant_id: "v1", destination_tax_duty_verified: true };
  assert.equal(completeCustomsCoverage([yes], true, "destination_tax_duty_verified"), true);
  for (const [rows, complete] of [[[], true], [[yes], false], [[yes, yes], true],
    [[yes, {variant_id:"v2",destination_tax_duty_verified:false}], true]]) {
    assert.equal(completeCustomsCoverage(rows, complete, "destination_tax_duty_verified"), false);
  }
});
test("both shadow audits use the tested profit guard; batch reads include its evidence", () => {
  for (const name of ["hunt-eprolo-variant-country-audit-shadow", "hunt-eprolo-product-country-variants-audit-shadow"]) {
    const src = fs.readFileSync(path.join(__dirname, "../supabase/functions", name, "index.ts"), "utf8");
    assert.match(src, /import .*finalProfitTruth.*final-profit-truth\.mjs/);
    assert.match(src, /finalProfitTruth\(/);
    assert.doesNotMatch(src, /function customsTruth|finalProfit=.*economics\.gate/);
  }
  const batch = fs.readFileSync(path.join(__dirname, "../supabase/functions/hunt-eprolo-variant-country-audit-shadow/index.ts"), "utf8");
  assert.match(batch, /select c\.item_id,c\.title,c\.source_payload,/);
});

async function productHandler(variants, source = fixture(), failWrite = false) {
  const vm = require("node:vm"), { stripTypeScriptTypes } = require("node:module");
  const { createHash } = require("node:crypto");
  const helpers = await mod;
  const mutations = [];
  const sql = async (strings) => {
    const query = strings.join("?");
    if (query.includes("vault.decrypted_secrets")) return [
      {name:"hunt_underwear_catalog_token",decrypted_secret:"fixture-token"},
      {name:"hunt_eprolo_api_key",decrypted_secret:"fixture-api"},
      {name:"hunt_eprolo_api_secret",decrypted_secret:"fixture-secret"}];
    if (query.includes("select title,source_payload")) return [{title:"Fixture product",source_payload:source}];
    if (query.includes("select * from public.hunt_profit_profiles")) return [{}];
    mutations.push(query);
    if (failWrite) throw new Error("fixture persistence unavailable");
    return [];
  };
  sql.json = x => x; sql.end = async () => {};
  let handler;
  const RealDate = Date;
  class FixedDate extends RealDate {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const code = fs.readFileSync(path.join(__dirname,
    "../supabase/functions/hunt-eprolo-product-country-variants-audit-shadow/index.ts"), "utf8")
    .replace(/^import .*;\s*$/gm, "");
  vm.runInNewContext(stripTypeScriptTypes(code), { ...helpers, createHash,
    postgres: () => sql, Date: FixedDate, URL, Response, AbortSignal,
    Deno: {env:{get:() => "fixture-config"},serve: fn => handler = fn},
    fetch: async () => new Response(JSON.stringify({code:0,data:{variantlist:variants}})) });
  const response = await handler(new Request("https://fixture.invalid?item_id=i1&country=GB",
    {headers:{"x-hunt-internal-token":"fixture-token"}}));
  return {http:response.status,body:await response.json(),mutations};
}
const upstreamVariant = id => ({id,cost:5,inventory_quantity:2,
  logistics_cost_list:[{cost_list:[{cost:3,ship_method:"verified-service",taxesFee:null}]}]});
test("actual product audit handler cannot close product tax from a partial variant PASS", async () => {
  const result = await productHandler([upstreamVariant("v1"),upstreamVariant("v2")]);
  assert.equal(result.http, 200);
  assert.equal(result.body.summary.final_profit_verified, 1);
  assert.equal(result.body.summary.destination_tax_missing, 1);
  assert.equal(result.mutations.some(q => q.includes("set status='resolved'")), false);
  assert.equal(result.body.sellable, false);
  assert.equal(result.body.production_effect, false);
});
test("actual product audit uses approved retail instead of its proposed floor", async () => {
  const result = await productHandler([upstreamVariant("v1")]);
  assert.equal(result.body.variants[0].current_retail_usd, 30);
  assert.equal(result.body.variants[0].economics.contribution, 20.03);
  assert.notEqual(result.body.variants[0].shadow_retail_floor_usd, 30);
  const unverified = fixture(); delete unverified.retail_truth_v1;
  const held = await productHandler([upstreamVariant("v1")],unverified);
  assert.equal(held.body.variants[0].final_profit_verified, false);
  assert.equal(held.body.variants[0].reason, "RETAIL_PRICE_UNVERIFIED");
});
test("actual product audit reports failed persistence and incomplete duplicate sets safely", async () => {
  const failed = await productHandler([upstreamVariant("v1")],fixture(),true);
  assert.equal(failed.http, 500);
  assert.equal(failed.body.ok, false);
  const duplicate = await productHandler([upstreamVariant("v1"),upstreamVariant("v1")]);
  assert.equal(duplicate.body.audit_complete, false);
  assert.equal(duplicate.mutations.some(q => q.includes("set status='resolved'")), false);
});
