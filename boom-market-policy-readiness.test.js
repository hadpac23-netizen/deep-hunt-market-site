const fs=require("fs"),vm=require("vm"),assert=require("assert");
const c=JSON.parse(fs.readFileSync("boom-market-policy-readiness-contract.json","utf8"));
assert.equal(c.authority,"NONE");
assert.equal(c.unmapped_market_policy.state,"HOLD");
assert(c.publication_rules.some(x=>/does not create binding production legal text autonomously/.test(x)));
assert(c.returns_truth_rules.some(x=>/No blanket 'no refunds'/.test(x)));
const src=fs.readFileSync("boom-market-policy-readiness.js","utf8");
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(src,ctx);
const P=ctx.window.BoomMarketPolicyReadiness;
assert.equal(P.marketKey("DE"),"EU");
assert.equal(P.marketKey("GB"),"GB");
let r=P.evaluate({country:"CA",global:{},market:{}});
assert.equal(r.state,"HOLD_UNMAPPED_MARKET");
r=P.evaluate({country:"IL",global:{business_identity_published:false},market:{review_approved:false}});
assert.equal(r.blocker,"BUSINESS_IDENTITY_PUBLISHED");
const all={
 business_identity_published:true,legal_registry_deployed:true,terms_published:true,privacy_published:true,
 returns_published:true,shipping_published:true,returns_address_ready:true,support_contact_ready:true,
 privacy_contact_ready:true,verified_shipping_promise_source:true,cancellation_return_flow_implemented:true
};
r=P.evaluate({country:"IL",global:all,market:{review_approved:false}});
assert.equal(r.blocker,"MARKET_SPECIFIC_REVIEW_APPROVED");
r=P.evaluate({country:"IL",global:all,market:{review_approved:true}});
assert.equal(r.state,"READY_FOR_OWNER_REVIEW");
assert.equal(r.real_money_allowed,false);
console.log("BOOM Market Policy Readiness: PASS — unmapped markets hold; legal publication, contacts, shipping truth and market review are hard gates");