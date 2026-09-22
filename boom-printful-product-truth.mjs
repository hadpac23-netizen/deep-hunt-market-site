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
const safeTitle=s=>!/weapon|knife|gun|alcohol|beer|wine|vape|nicotine|cannabis|drug|betting|casino|porn/i.test(String(s||""));
const catalog=await get("/products");
if(!catalog.ok){console.log(JSON.stringify({stage:"catalog",http:catalog.status,error:catalog.body?.result||catalog.body?.error},null,2));process.exit(3);}
const products=(Array.isArray(catalog.body?.result)?catalog.body.result:[]).filter(p=>safeTitle(p.title));
const preferred=["T-SHIRT","HAT","MUG","POSTER","PHONE-CASE","HOODIE"];
const chosen=[];
for(const type of preferred){
  const p=products.find(x=>String(x.type||"").toUpperCase()===type&&!chosen.some(c=>c.id===x.id));
  if(p)chosen.push(p);
}
for(const p of products){if(chosen.length>=6)break;if(!chosen.some(c=>c.id===p.id))chosen.push(p);}
const results=[];
for(const product of chosen){
  const detail=await get("/products/"+product.id);
  if(!detail.ok){results.push({product_id:product.id,title:product.title,detail_http:detail.status});continue;}
  const variants=Array.isArray(detail.body?.result?.variants)?detail.body.result.variants:[];
  const inStock=variants.filter(v=>v?.in_stock===true&&Number(v?.price)>0);
  const variant=inStock.sort((a,b)=>Number(a.price)-Number(b.price))[0]||variants.find(v=>Number(v?.price)>0);
  if(!variant){results.push({product_id:product.id,title:product.title,variant_count:variants.length,state:"NO_PRICED_VARIANT"});continue;}
  const cost=Number(variant.price);
  const row={product_id:product.id,title:product.title,variant_id:variant.id,variant_name:variant.name||null,size:variant.size||null,color:variant.color||null,in_stock:variant.in_stock===true,supplier_cost_usd:+cost.toFixed(2),price_gate:priceGate(cost),shipping:{}};
  for(const destination of [{country_code:"IL"},{country_code:"DE"},{country_code:"US",state_code:"CA"}]){
    const q=await post("/shipping/rates",{recipient:destination,items:[{variant_id:variant.id,quantity:1}],currency:"USD"});
    const rates=Array.isArray(q.body?.result)?q.body.result:[];
    const cheapest=rates.map(x=>({id:x.id,name:x.name,rate:Number(x.rate),currency:x.currency})).filter(x=>Number.isFinite(x.rate)).sort((a,b)=>a.rate-b.rate)[0];
    row.shipping[destination.country_code]=q.ok?{verified:true,options:rates.length,cheapest:cheapest||null}:{verified:false,http:q.status,error:q.body?.result||q.body?.error||q.body?.message||null};
  }
  results.push(row);
}
const summary={
  provider:"Printful",
  mode:"READ_ONLY_PRODUCT_TRUTH",
  order_creation:false,
  fulfillment:"DISABLED",
  checkout:"DISABLED",
  catalog_count:products.length,
  products_checked:results.length,
  variants_verified:results.filter(x=>x.variant_id).length,
  in_stock_verified:results.filter(x=>x.in_stock).length,
  shipping_verified_all_3:results.filter(x=>["IL","DE","US"].every(c=>x.shipping?.[c]?.verified)).length
};
console.log(JSON.stringify({summary,results},null,2));