const assert=require("node:assert");
const P=require("./hunt-server-purchase-proof-adapter.js");

const base=P.evaluate({
  sessions:[
    {id:"ps1",order_id:"o1",paid_at:"2026-09-19T10:00:00Z",commerce_snapshot:{attribution:{first_touch:{utm_source:"x"}}}},
    {id:"ps2",order_id:"o2",paid_at:null,commerce_snapshot:{}}
  ],
  orders:[
    {id:"o1",is_test:false,status:"processing"},
    {id:"o2",is_test:true,status:"processing"}
  ],
  events:[
    {payment_session_id:"ps1",event_type:"callback_verified_hold"}
  ]
});
assert.strictEqual(base.paid_sessions,1);
assert.strictEqual(base.linked_real_orders,1);
assert.strictEqual(base.server_purchase_confirmation,false);
assert.strictEqual(base.purchase_touchpoint_linkage,false);
assert.strictEqual(base.live_campaign_context_persisted,true);

const confirmed=P.evaluate({
  sessions:[{id:"ps1",order_id:"o1",paid_at:"2026-09-19T10:00:00Z",commerce_snapshot:{attribution:{first_touch:{utm_source:"x"}}}}],
  orders:[{id:"o1",is_test:false,status:"processing"}],
  events:[{payment_session_id:"ps1",event_type:"payment_confirmed"}]
});
assert.strictEqual(confirmed.provider_payment_confirmation,true);
assert.strictEqual(confirmed.server_purchase_confirmation,true);
assert.strictEqual(confirmed.purchase_touchpoint_linkage,true);
assert.strictEqual(confirmed.conversion_claim_allowed,true);
assert.strictEqual(confirmed.execute_actions,false);

function mockClient(){
  const data={
    hunt_payment_sessions:[{id:"p",order_id:"o",paid_at:null,commerce_snapshot:null}],
    hunt_orders:[{id:"o",is_test:true,status:"processing"}],
    hunt_payment_events:[{payment_session_id:"p",event_type:"callback_verified_hold"}]
  };
  return {from(table){return {select(){return {limit:async()=>({data:data[table],error:null})}}}}};
}
(async()=>{
  const snap=await P.load(mockClient());
  assert.strictEqual(snap.adapter_ready,true);
  assert.strictEqual(snap.server_purchase_confirmation,false);
  assert.strictEqual(snap.read_only,true);
  assert.strictEqual(snap.writes,0);
  console.log("hunt_server_purchase_proof_adapter=PASS");
})().catch(error=>{console.error(error);process.exit(1)});