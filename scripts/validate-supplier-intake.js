const fs = require("fs");
const path = require("path");
const I = require(path.join(process.cwd(),"supplier-intake.js"));
const config = JSON.parse(fs.readFileSync("config/supplier-intake.json","utf8"));

function assert(condition,message){
  if(!condition){ console.error("FAIL",message); process.exitCode=1; }
  else console.log("PASS",message);
}

assert(config.policy?.free_first === true,"free-first policy enabled");
assert(config.providers.length >= 5,"core supplier set configured");
for(const provider of config.providers){
  const r=I.providerReadiness(provider);
  assert(Boolean(r.provider_id),provider.name+" has provider id");
  assert(["check","blocked","eligible"].includes(provider.country_rules?.default || "check"),provider.name+" has valid country default");
}

const swim=JSON.parse(fs.readFileSync("catalog-fashion/swimwear.json","utf8"));
const rows=Array.isArray(swim.products)?swim.products:(Array.isArray(swim.items)?swim.items:[]);
assert(rows.length >= 7,"swim catalog available for intake test");

let valid=0, holds=0;
for(const raw of rows){
  const product=I.normalizeProduct(raw,{id:"cjdropshipping",name:"CJdropshipping"});
  const validation=I.validateProduct(product);
  if(validation.ok) valid++;
  if(I.publishGate(product).state==="HOLD") holds++;
}
console.log("SWIM_INTAKE",{rows:rows.length,valid,holds});
assert(valid===rows.length,"all current swim rows normalize structurally");
assert(holds===rows.length,"unverified media/price readiness remains HOLD rather than fabricated");

const verified=I.normalizeProduct({
  provider:"Test Supplier",item_id:"sku-1",title:"Test Product",
  image_url:"https://example.com/a.jpg",price_amount:10,currency:"USD",
  availability_verified:true,shipping_verified:true,shipping_country:"US",
  media_rights_verified:true,returns_policy_verified:true,
  variants:[{variant_id:"v1",price_amount:10,currency:"USD",availability_verified:true}]
});
assert(I.publishGate(verified).state==="CATALOG_READY","verified product can reach catalog-ready");
assert(I.checkoutGate(verified,"US").state==="ALLOW","verified destination can reach checkout");
assert(I.checkoutGate(verified,"IL").state==="BLOCK","different destination is blocked until reverified");
