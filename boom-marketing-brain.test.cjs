const assert=require("node:assert");
const M=require("./boom-marketing-brain.js");

const plan={
  funnel:{sessions:12},
  launch:{canRunPaidMarketing:false},
  rankedDeals:[{boom:{eligibleForPromotion:true}}]
};
const passportSummary={
  channels:{
    google_free_listings:{data_ready:12,ready:0},
    google_ai:{data_ready:7,ready:0},
    agentic_ucp:{data_ready:7,ready:0,transaction_ready:0},
    organic_social:{data_ready:14,ready:0},
    pinterest_catalog:{data_ready:9,ready:0},
    paid_media:{ready:0}
  }
};
const result=M.build({plan,passportSummary});
assert(result.primary,"Primary channel missing");
assert(result.channels.some(x=>x.channel==="google_free_listings"&&x.state==="prepare"&&x.locked===true));
assert(result.channels.some(x=>x.channel==="ai_commerce_discovery"&&x.state==="prepare"));
assert(result.channels.some(x=>x.channel==="paid_media"&&x.state==="locked"&&x.priority===5));
assert.strictEqual(result.agentic.discovery_data_ready,7);
assert.strictEqual(result.agentic.transaction_ready,0);

const ready=M.build({
  plan:{funnel:{sessions:300},launch:{canRunPaidMarketing:true},rankedDeals:[{boom:{eligibleForPromotion:true}}]},
  passportSummary:{
    channels:{
      google_free_listings:{data_ready:8,ready:8},
      google_ai:{data_ready:5,ready:5},
      agentic_ucp:{data_ready:5,ready:5,transaction_ready:0},
      organic_social:{data_ready:8,ready:8},
      pinterest_catalog:{data_ready:8,ready:8},
      paid_media:{ready:3}
    }
  }
});
assert(ready.channels.some(x=>x.channel==="google_free_listings"&&x.state==="ready"));
assert(ready.channels.some(x=>x.channel==="paid_media"&&x.state==="ready"&&x.locked===false));
assert.strictEqual(ready.agentic.transaction_ready,0,"Agentic discovery must not imply transaction readiness");
console.log("boom_marketing_brain=PASS",JSON.stringify({primary:result.primary.channel,agentic:result.agentic}));
