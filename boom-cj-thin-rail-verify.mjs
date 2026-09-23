import fs from "fs";
const sel=JSON.parse(fs.readFileSync("evidence/HUNT-CJ-THIN-RAIL-SELECTION-2026-09-23.json","utf8"));
const MARKETS=["IL","DE","US","SG"];
const base="https://zszlnahjqmwozwubetkm.supabase.co/functions/v1";
const key="sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
const headers={apikey:key,Origin:"http://127.0.0.1:8781",Accept:"application/json"};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function getJson(url,timeout=10000){
  for(let a=1;a<=3;a++){
    try{
      const r=await fetch(url,{headers,signal:AbortSignal.timeout(timeout)});
      let b={};try{b=await r.json()}catch{}
      if(r.ok)return {ok:true,status:r.status,body:b};
      if(![429,500,502,503,504].includes(r.status)||a===3)return {ok:false,status:r.status,body:b};
    }catch(e){if(a===3)return {ok:false,status:0,body:{error:e.name}};}
    await sleep(350*a);
  }
}
function gate(cost){
  cost=Number(cost);if(!Number.isFinite(cost)||cost<=0)return null;
  const reserve=.91,minProfit=4,target=.35;
  const raw=Math.max((cost+minProfit)/reserve,cost/(reserve-target));
  const retail=Math.max(.99,Math.ceil(raw+.01)-.01),profit=retail*reserve-cost;
  return {retail_shadow_usd:+retail.toFixed(2),product_contribution_shadow_usd:+profit.toFixed(2),product_margin_shadow:+(profit/retail).toFixed(4)};
}
async function productDetail(id){
  const u=new URL(base+"/hunt-storefront");u.searchParams.set("provider","CJdropshipping");u.searchParams.set("product_id",id);u.searchParams.set("country_code","IL");
  const r=await getJson(u,12000);return r.ok?r.body?.product:null;
}
async function quote(vid,cc){
  const u=new URL(base+"/hunt-cj-quote");u.searchParams.set("vid",vid);u.searchParams.set("country_code",cc);u.searchParams.set("quantity","1");
  const r=await getJson(u,10000);
  if(!r.ok)return null;
  const q=r.body,opts=(q.shipping_options||[]).filter(x=>Number.isFinite(Number(x?.price_usd))).sort((a,b)=>Number(a.price_usd)-Number(b.price_usd));
  if(q.stock_verified!==true||q.stock_available!==true||q.shipping_verified!==true||!opts.length)return null;
  return {q,ship:opts[0]};
}
async function verify(meta){
  const p=await productDetail(meta.item_id);
  if(!p)return {...meta,status:"PRODUCT_DETAIL_FAILED",markets:{},production_effect:false};
  const variants=(p.variants||[]).filter(v=>v?.variant_id&&Number(v.price_amount??p.price_amount)>0).slice(0,5);
  for(const v of variants){
    const checks=await Promise.all(MARKETS.map(async cc=>[cc,await quote(v.variant_id,cc)]));
    if(checks.every(([,q])=>q)){
      const supplier=Number(v.price_amount??p.price_amount),pg=gate(supplier);
      const markets={};
      for(const [cc,qr] of checks){
        const ship=Number(qr.ship.price_usd),customerShip=+(ship/.91).toFixed(2);
        const total=pg?+(pg.retail_shadow_usd+customerShip).toFixed(2):null;
        markets[cc]={
          state:"STOCK_SHIPPING_VERIFIED",variant_id:String(v.variant_id),
          variant_name:v.variant_name||v.variant_name_en||v.sku||null,
          supplier_cost_usd:supplier,...pg,
          supplier_shipping_usd:ship,customer_shipping_grossup_shadow_usd:customerShip,
          customer_total_shadow_usd:total,shipping_method:qr.ship.name||null,shipping_aging:qr.ship.aging||null,
          selected_origin:qr.q.selected_origin||null,
          projected_order_contribution_after_9pct_reserve_usd:pg?.product_contribution_shadow_usd??null,
          final_profit_verified:false
        };
      }
      return {...meta,title:p.title||meta.title,image_url:p.image_url||p.image||meta.image_url,
        status:"VERIFIED_4_OF_4",exact_variant:{id:String(v.variant_id),name:v.variant_name||v.variant_name_en||v.sku||null},
        markets,production_effect:false};
    }
  }
  return {...meta,title:p.title||meta.title,image_url:p.image_url||p.image||meta.image_url,status:"NO_SINGLE_VARIANT_4_OF_4",markets:{},production_effect:false};
}

const results=new Array(sel.products.length);
let next=0,done=0;
async function worker(){
  while(true){
    const i=next++;if(i>=sel.products.length)return;
    results[i]=await verify(sel.products[i]);
    done++;
    if(done%25===0||done===sel.products.length)console.log("PROGRESS",done,"/",sel.products.length);
    await sleep(60);
  }
}
await Promise.all(Array.from({length:6},()=>worker()));
const verified=results.filter(x=>x.status==="VERIFIED_4_OF_4");
const summary={
 products_checked:results.length,verified_4_of_4:verified.length,
 failed:results.length-verified.length,
 rails_with_verified:new Set(verified.map(x=>x.department+"/"+x.category)).size,
 market_pass_counts:Object.fromEntries(MARKETS.map(cc=>[cc,verified.filter(x=>x.markets?.[cc]?.state==="STOCK_SHIPPING_VERIFIED").length])),
 final_profit_verified_products:0,checkout_live:0,payment_live:0,fulfillment_live:0,production_effect:false
};
const out={version:"HUNT-CJ-THIN-RAIL-VERIFY-V1",date:"2026-09-23",mode:"READ_ONLY_SHADOW",provider:"CJdropshipping",markets:MARKETS,summary,results,
 rules:["Exact CJ product and one exact variant must pass stock+shipping in all 4 pilot markets","Price Gate V2 shadow only","Final net profit remains false","No Production/checkout/payment/order/fulfillment"]};
fs.writeFileSync("evidence/HUNT-CJ-THIN-RAIL-VERIFY-2026-09-23.json",JSON.stringify(out,null,2)+"\n");
console.log("SUMMARY",JSON.stringify(summary));
