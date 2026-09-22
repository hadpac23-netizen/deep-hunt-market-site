const token=(process.env.PRINTFUL_API_TOKEN||"").trim();
if(!token){console.error("PRINTFUL_API_TOKEN missing");process.exit(2);}
const base="https://api.printful.com";
const headers={Authorization:"Bearer "+token,Accept:"application/json"};
const get=async path=>{const r=await fetch(base+path,{headers});return {ok:r.ok,status:r.status,body:await r.json().catch(()=>({}))};};
const post=async(path,body)=>{const r=await fetch(base+path,{method:"POST",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify(body)});return {ok:r.ok,status:r.status,body:await r.json().catch(()=>({}))};};
const reserve=.91,targetMargin=.35,minProfit=4;
const priceGate=cost=>{
  const contribution=(cost+minProfit)/reserve;
  const margin=cost/Math.max(.05,reserve-targetMargin);
  const retail=Math.max(.99,Math.ceil(Math.max(contribution,margin))-.01);
  const profit=retail*reserve-cost;
  return {retail:+retail.toFixed(2),profit:+profit.toFixed(2),margin:+(profit/retail).toFixed(4)};
};
const safe=s=>!/weapon|knife|gun|alcohol|beer|wine|vape|nicotine|cannabis|drug|betting|casino|porn/i.test(String(s||""));
const buckets=[
 ["tees",/\btee\b|t-shirt|shirt/i],
 ["hoodies",/hoodie|sweatshirt/i],
 ["hats",/hat|cap|beanie/i],
 ["drinkware",/mug|bottle|tumbler/i],
 ["wall_art",/poster|canvas|print/i],
 ["cases",/case for|phone case|airpods/i],
 ["bags",/bag|backpack|tote/i],
 ["home",/rug|pillow|blanket|towel/i],
 ["accessories",/luggage tag|keychain|mouse pad|notebook/i],
 ["sports",/leggings|sports bra|jersey|shorts/i]
];
const catalog=await get("/products");
if(!catalog.ok){console.log(JSON.stringify({stage:"catalog",http:catalog.status,error:catalog.body?.result||catalog.body?.error},null,2));process.exit(3);}
const products=(Array.isArray(catalog.body?.result)?catalog.body.result:[]).filter(x=>safe(x.title));
const chosen=[];
for(const [bucket,re] of buckets){
  for(const p of products.filter(x=>re.test(String(x.title||""))).slice(0,3)){
    if(!chosen.some(c=>c.product.id===p.id))chosen.push({bucket,product:p});
  }
}
for(const p of products){
  if(chosen.length>=30)break;
  if(!chosen.some(c=>c.product.id===p.id))chosen.push({bucket:"other",product:p});
}
const results=[];
for(const item of chosen.slice(0,30)){
  const product=item.product;
  const detail=await get("/products/"+product.id);
  if(!detail.ok){results.push({bucket:item.bucket,product_id:product.id,title:product.title,state:"DETAIL_FAILED",http:detail.status});continue;}
  const variants=Array.isArray(detail.body?.result?.variants)?detail.body.result.variants:[];
  const inStock=variants.filter(v=>v?.in_stock===true&&Number(v?.price)>0);
  const variant=inStock.sort((a,b)=>Number(a.price)-Number(b.price))[0]||variants.find(v=>Number(v?.price)>0);
  if(!variant){results.push({bucket:item.bucket,product_id:product.id,title:product.title,state:"NO_PRICED_VARIANT",variant_count:variants.length});continue;}
  const cost=Number(variant.price);
  const gate=priceGate(cost);
  const row={bucket:item.bucket,product_id:product.id,title:product.title,variant_id:variant.id,variant_name:variant.name||null,size:variant.size||null,color:variant.color||null,in_stock:variant.in_stock===true,supplier_cost_usd:+cost.toFixed(2),product_gate:gate,countries:{}};
  for(const destination of [{country_code:"IL"},{country_code:"DE"},{country_code:"US",state_code:"CA"}]){
    const q=await post("/shipping/rates",{recipient:destination,items:[{variant_id:variant.id,quantity:1}],currency:"USD"});
    const rates=Array.isArray(q.body?.result)?q.body.result:[];
    const cheapest=rates.map(x=>({id:x.id,name:x.name,rate:Number(x.rate),currency:x.currency})).filter(x=>Number.isFinite(x.rate)).sort((a,b)=>a.rate-b.rate)[0];
    if(!q.ok||!cheapest){row.countries[destination.country_code]={shipping_verified:false,http:q.status};continue;}
    const ship=cheapest.rate;
    const exactPassProfit=(gate.retail+ship)*reserve-cost-ship;
    const grossedShipping=ship/reserve;
    const preservedProfit=(gate.retail+grossedShipping)*reserve-cost-ship;
    const freeGate=priceGate(cost+ship);
    row.countries[destination.country_code]={
      shipping_verified:true,
      supplier_shipping_usd:+ship.toFixed(2),
      customer_shipping_exact_usd:+ship.toFixed(2),
      profit_if_exact_pass_through_usd:+exactPassProfit.toFixed(2),
      customer_shipping_grossed_up_usd:+grossedShipping.toFixed(2),
      profit_if_grossed_up_usd:+preservedProfit.toFixed(2),
      free_shipping_required_retail_usd:freeGate.retail,
      free_shipping_profit_usd:freeGate.profit,
      free_shipping_margin:freeGate.margin
    };
  }
  const verified=Object.values(row.countries).filter(x=>x.shipping_verified);
  const avgShip=verified.length?verified.reduce((a,x)=>a+x.supplier_shipping_usd,0)/verified.length:null;
  row.avg_shipping_usd=avgShip===null?null:+avgShip.toFixed(2);
  row.economics_score=avgShip===null?null:+(gate.profit-Math.max(0,avgShip*.09)).toFixed(2);
  results.push(row);
}
const ranked=results.filter(x=>x.variant_id).sort((a,b)=>(b.economics_score??-999)-(a.economics_score??-999));
const summary={
  provider:"Printful",
  mode:"READ_ONLY_PROFIT_30",
  order_creation:false,
  fulfillment:"DISABLED",
  checkout:"DISABLED",
  catalog_count:products.length,
  products_checked:results.length,
  variants_verified:results.filter(x=>x.variant_id).length,
  in_stock_verified:results.filter(x=>x.in_stock).length,
  shipping_verified_all_3:results.filter(x=>["IL","DE","US"].every(c=>x.countries?.[c]?.shipping_verified)).length,
  note:"Exact shipping pass-through still loses reserve fees; gross-up preserves product-gate profit."
};
console.log(JSON.stringify({summary,ranked,results},null,2));