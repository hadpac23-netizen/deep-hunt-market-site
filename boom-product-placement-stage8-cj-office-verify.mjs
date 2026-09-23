import fs from "fs";
const item={provider:"CJdropshipping",item_id:"1873971085362515969",rail:"office/office-furniture",title:"110X50X94cm One Draw, Two Tiers With Keyboard Rack Computer Desk"};
const MARKETS=["IL","DE","US","SG"];
const base="https://zszlnahjqmwozwubetkm.supabase.co/functions/v1";
const key="sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
const headers={apikey:key,Origin:"http://127.0.0.1:8781",Accept:"application/json"};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function getJson(url,timeout=12000){
  for(let a=1;a<=3;a++){
    try{
      const r=await fetch(url,{headers,signal:AbortSignal.timeout(timeout)});
      let b={};try{b=await r.json()}catch{}
      if(r.ok)return {ok:true,status:r.status,body:b};
      if(![429,500,502,503,504].includes(r.status)||a===3)return {ok:false,status:r.status,body:b};
    }catch(e){if(a===3)return {ok:false,status:0,body:{error:e.name}};}
    await sleep(450*a);
  }
}
async function productDetail(id){
  const u=new URL(base+"/hunt-storefront");
  u.searchParams.set("provider","CJdropshipping");u.searchParams.set("product_id",id);u.searchParams.set("country_code","IL");
  const r=await getJson(u,15000);return r.ok?r.body?.product:null;
}
async function quote(vid,cc){
  const u=new URL(base+"/hunt-cj-quote");
  u.searchParams.set("vid",vid);u.searchParams.set("country_code",cc);u.searchParams.set("quantity","1");
  const r=await getJson(u,12000);
  if(!r.ok)return {ok:false,status:r.status,body:r.body};
  const q=r.body,opts=(q.shipping_options||[]).filter(x=>Number.isFinite(Number(x?.price_usd))).sort((a,b)=>Number(a.price_usd)-Number(b.price_usd));
  if(q.stock_verified!==true||q.stock_available!==true||q.shipping_verified!==true||!opts.length)return {ok:false,status:r.status,body:q};
  return {ok:true,q,ship:opts[0]};
}
const p=await productDetail(item.item_id);
let out;
if(!p){
  out={version:"HUNT-STAGE8-CJ-OFFICE-VERIFY-V1",date:"2026-09-23",mode:"READ_ONLY_SHADOW",production_effect:false,item,status:"PRODUCT_DETAIL_FAILED",markets:{},final_net_profit_verified:false};
}else{
  let selected=null;
  const variants=(p.variants||[]).filter(v=>v?.variant_id&&Number(v.price_amount??p.price_amount)>0).slice(0,12);
  for(const v of variants){
    const checks=await Promise.all(MARKETS.map(async cc=>[cc,await quote(v.variant_id,cc)]));
    if(checks.every(([,q])=>q.ok)){selected={v,checks};break;}
  }
  if(!selected){
    out={version:"HUNT-STAGE8-CJ-OFFICE-VERIFY-V1",date:"2026-09-23",mode:"READ_ONLY_SHADOW",production_effect:false,item,title:p.title||item.title,status:"NO_SINGLE_VARIANT_4_OF_4",variant_count:(p.variants||[]).length,markets:{},final_net_profit_verified:false};
  }else{
    const supplier=Number(selected.v.price_amount??p.price_amount);
    const markets={};
    for(const [cc,q] of selected.checks)markets[cc]={state:"STOCK_SHIPPING_VERIFIED",variant_id:String(selected.v.variant_id),supplier_cost_usd:supplier,supplier_shipping_usd:Number(q.ship.price_usd),shipping_method:q.ship.name||null,shipping_aging:q.ship.aging||null,selected_origin:q.q.selected_origin||null};
    out={version:"HUNT-STAGE8-CJ-OFFICE-VERIFY-V1",date:"2026-09-23",mode:"READ_ONLY_SHADOW",production_effect:false,item,title:p.title||item.title,image_url:p.image_url||p.image||null,status:"VERIFIED_4_OF_4",exact_variant:{id:String(selected.v.variant_id),name:selected.v.variant_name||selected.v.variant_name_en||selected.v.sku||null},markets,final_net_profit_verified:false};
  }
}
fs.writeFileSync("evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-CJ-OFFICE-VERIFY-2026-09-23.json",JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out,null,2));
