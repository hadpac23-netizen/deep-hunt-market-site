const assert=require("node:assert");
const A=require("./hunt-marketplace-snapshot-adapter.js");

function client(){
  return {
    from(table){
      return {
        select(){
          const make=(filter)=>Promise.resolve({count:table==="merchant_accounts"?2:table==="merchant_stores"?(filter?.value==="approved"?1:filter?.value==="pending"?1:2):table==="merchant_products"?(filter?.value==="approved"?5:filter?.value==="pending_review"?3:8):table==="merchant_outbound_clicks"?11:table==="merchant_conversion_events"?2:table==="merchant_ad_requests"?1:0,error:null});
          const p=make(null);
          p.eq=(column,value)=>make({column,value});
          return p;
        }
      };
    }
  };
}
(async()=>{
  const snap=await A.load(client());
  assert.strictEqual(snap.adapter_ready,true);
  assert.strictEqual(snap.merchant_registry_ready,true);
  assert.strictEqual(snap.attribution_registry_ready,true);
  assert.strictEqual(snap.counts.products_approved,5);
  assert.strictEqual(snap.read_only,true);
  assert.strictEqual(snap.writes,0);
  assert.strictEqual(snap.execute_actions,false);
  console.log("hunt_marketplace_snapshot_adapter=PASS");
})().catch(error=>{console.error(error);process.exit(1)});