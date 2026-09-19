const assert=require("node:assert");
const Passport=require("./boom-commerce-passport.js");
const Feed=require("./boom-google-ai-feed.js");

const product={
  provider:"CJdropshipping",
  item_id:"offer-1",
  title:"Cotton T-Shirt",
  description:"Source-verified cotton t-shirt description with enough detail for a truthful product listing.",
  category:"men-tops",
  image_url:"https://cdn.example.com/main.jpg",
  gallery:["https://cdn.example.com/main.jpg","https://cdn.example.com/alt.jpg"],
  video_links:["https://cdn.example.com/video.mp4"],
  retail_price_verified:true,
  profit_gate_status:"PASS",
  retail_price_amount:24.5,
  retail_currency:"USD",
  availability_verified:true,
  variant_count:2,
  brand:"Example Brand",
  gtin:"1234567890123",
  sku:"MPN-1",
  color:"Black",
  size:"M",
  material:"Cotton",
  gender:"men",
  condition:"new"
};

const ctx={
  canonical_url:"https://hunt.example/product.html?provider=CJdropshipping&id=offer-1",
  merchant_identity_ready:true,
  shipping_policy_ready:true,
  returns_policy_ready:true,
  source_fresh:true,
  feed_availability_verified:true,
  connected_channels:{google_free_listings:false,google_ai:false,agentic_ucp:false},
  questions_and_answers:[
    {question:"What is it made from?",answer:"The source lists cotton as the material.",verified:true},
    {question:"Is it guaranteed to arrive tomorrow?",answer:"Yes.",verified:false}
  ],
  related_products:[{offer_id:"offer-2",relationship:"accessory"}],
  variants:[{color:"Black",size:"M"}],
  document_links:[{url:"https://cdn.example.com/guide.pdf",label:"Guide"}]
};

const passport=Passport.build(product,ctx);
const input=Feed.buildProductInput(passport,{feedLabel:"US",contentLanguage:"en"});
assert.strictEqual(input.export_ready,true);
assert.strictEqual(input.publish_ready,false,"Channel connection must remain separate from export readiness");
assert.strictEqual(input.productAttributes.availability,"IN_STOCK");
assert.strictEqual(input.productAttributes.condition,"NEW");
assert.deepStrictEqual(input.productAttributes.gtins,["1234567890123"]);
assert.strictEqual(input.productAttributes.gender,"MALE");
assert.strictEqual(input.productAttributes.questionsAndAnswers.length,1,"Only verified Q&A may leave HUNT");
assert.deepStrictEqual(input.productAttributes.variantOptions,[{name:"color",value:"Black"},{name:"size",value:"M"}]);
assert.deepStrictEqual(input.productAttributes.relatedProducts,[{relationshipType:"ACCESSORY",idType:"ID",id:"offer-2"}]);
assert.deepStrictEqual(input.productAttributes.documentLinks,["https://cdn.example.com/guide.pdf"]);
assert.strictEqual(input.owner_gate,"REVIEW_REQUIRED");

const connected=Passport.build(product,{...ctx,connected_channels:{...ctx.connected_channels,google_free_listings:true}});
const connectedInput=Feed.buildProductInput(connected,{feedLabel:"US"});
assert.strictEqual(connectedInput.publish_ready,true);

const multi=Passport.build(product,{...ctx,variants:[{color:"Black",size:"M"},{color:"Blue",size:"L"}]});
const multiInput=Feed.buildProductInput(multi,{feedLabel:"US"});
assert.strictEqual(multiInput.export_ready,false);
assert(multiInput.blockers.includes("variant_offer_not_expanded"));

const blocked=Passport.build({...product,description:"",retail_price_verified:false},{
  ...ctx,
  feed_availability_verified:false,
  variant_availability_feed_ready:false,
  merchant_identity_ready:false,
  source_fresh:false
});
const blockedInput=Feed.buildProductInput(blocked);
for(const blocker of ["description_missing_or_too_short","verified_price_missing","feed_safe_availability_missing","merchant_identity_not_ready","source_freshness_not_verified"]){
  assert(blockedInput.blockers.includes(blocker),"Missing blocker "+blocker);
}
assert.strictEqual(blockedInput.export_ready,false);
assert(blockedInput.blockers.includes("feed_label_invalid"),"Missing target feed label must fail closed");

const batch=Feed.buildBatch([passport,connected,multi,blocked],{feedLabel:"US"});
assert.strictEqual(batch.total,4);
assert.strictEqual(batch.export_ready,2);
assert.strictEqual(batch.publish_ready,1);
assert.strictEqual(batch.blocked,2);
assert.strictEqual(batch.network_calls,0);
assert.strictEqual(batch.external_publish,false);
assert(batch.top_blockers.some(x=>x.blocker==="variant_offer_not_expanded"));
assert.strictEqual(Feed.VERSION,"2026-09-19-v1");

const src=require("node:fs").readFileSync("boom-google-ai-feed.js","utf8");
assert(!/fetch\s*\(|XMLHttpRequest|merchantapi\.googleapis\.com/.test(src),"M02 exporter must not perform external network calls");
console.log("boom_google_ai_feed=PASS",JSON.stringify({
  export_ready:batch.export_ready,
  publish_ready:batch.publish_ready,
  blocked:batch.blocked,
  top_blockers:batch.top_blockers.slice(0,5)
}));
