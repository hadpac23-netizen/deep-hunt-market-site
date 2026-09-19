const fs=require("node:fs");
const assert=require("node:assert");
const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const adapter=fs.readFileSync("hunt-marketplace-snapshot-adapter.js","utf8");

assert(html.includes('hunt-marketplace-snapshot-adapter.js?v=m19'),"M19 snapshot adapter script missing");
assert(/boom-growth-os\.js\?v=os\d+/.test(html),"Growth OS cache-busted script missing");

for(const token of [
"MarketplaceSnapshotAdapter",
"await MarketplaceSnapshotAdapter.load(client)",
"marketplaceSnapshot,",
'"M19","Marketplace Snapshot Adapter"',
"marketplace_snapshot_adapter_ready:snap.adapter_ready===true",
"attribution_registry_ready:snap.attribution_registry_ready===true",
'merchant_accounts + merchant_stores + merchant_products',
"renderMarketplace(data)"
]) assert(js.includes(token),"M19 Growth Studio integration missing: "+token);

for(const token of [
"merchant_accounts","merchant_stores","merchant_products",
"merchant_outbound_clicks","merchant_conversion_events","merchant_ad_requests",
'select("id",{count:"exact",head:true})',
"read_only:true","writes:0","execute_actions:false"
]) assert(adapter.includes(token),"M19 adapter contract missing: "+token);

for(const forbidden of [".insert(", ".update(", ".delete(", ".upsert(", ".rpc(", "fetch("])
  assert(!adapter.includes(forbidden),"M19 adapter must be read-only: "+forbidden);

console.log("boom_m19_marketplace_snapshot_adapter_contract=PASS");