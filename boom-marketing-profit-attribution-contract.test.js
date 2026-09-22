const fs=require("fs"),assert=require("assert");
const a=JSON.parse(fs.readFileSync("boom-marketing-profit-attribution-contract.json","utf8"));
assert.equal(a.current_truth.real_order_linked_rows,0);
assert.equal(a.current_truth.profit_evidence_ready_rows,0);
assert.equal(a.current_truth.marketing_cost_feed,"GA4_TRAFFIC_CONNECTED_COST_NOT_VERIFIED");
assert(a.hard_rules.some(x=>/Missing marketing cost evidence/.test(x)));
assert(a.hard_rules.some(x=>/Never count test orders/.test(x)));
assert(a.hard_rules.some(x=>/Never optimize solely on ROAS/.test(x)));
console.log("BOOM Marketing Profit Attribution: PASS — real order + finance + cost evidence required, ROAS diagnostic only");