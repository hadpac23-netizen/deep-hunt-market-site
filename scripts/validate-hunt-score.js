const S=require("../hunt-score.js");
function assert(condition,message){if(!condition){console.error("FAIL",message);process.exitCode=1}else console.log("PASS",message)}

const weak={
  provider:"CJdropshipping",item_id:"1",title:"Swim cover-up",
  image_url:"https://example.com/a.jpg",price_amount:10,currency:"USD",
  availability_verified:false,shipping_verified:false,media_rights_verified:false,
  returns_policy_verified:false,variant_count:0
};
const weakResult=S.score(weak,{country_state:"check",landed_price:{state:"COST_PARTIAL"}});
assert(weakResult.band!=="HUNT_100_READY","incomplete product cannot enter HUNT 100");

const strong={
  provider:"Verified Supplier",item_id:"2",title:"Verified Product",
  image_url:"https://example.com/b.jpg",price_amount:20,currency:"USD",
  availability_verified:true,shipping_verified:true,shipping_country:"US",
  media_rights_verified:true,returns_policy_verified:true,variant_count:4
};
const strongResult=S.score(strong,{country_state:"eligible",landed_price:{state:"RETAIL_READY"}});
assert(strongResult.score===100,"fully evidenced product scores 100");
assert(strongResult.band==="HUNT_100_READY","fully evidenced product can enter HUNT 100");

const blocked=S.score(strong,{country_state:"blocked",landed_price:{state:"RETAIL_READY"}});
assert(blocked.band==="MARKET_BLOCKED","country block overrides otherwise strong product");

const ranked=S.rank([weak,strong],p=>p.item_id==="2"?{country_state:"eligible",landed_price:{state:"RETAIL_READY"}}:{country_state:"check",landed_price:{state:"COST_PARTIAL"}});
assert(ranked[0].product.item_id==="2","evidence score ranks stronger product first");
