import fs from "node:fs";
const base=JSON.parse(fs.readFileSync("evidence/HUNT-STYLIST-ACADEMY-TRAINING-SET-2026-09-22.json","utf8"));
const a=JSON.parse(fs.readFileSync("evidence/HUNT-STYLIST-ASSORTMENT-MINI-LIVE-SCAN-2026-09-22.json","utf8"));
const b=JSON.parse(fs.readFileSync("evidence/HUNT-STYLIST-ASSORTMENT-MINI-LIVE-SCAN-B-2026-09-22.json","utf8"));
const cj=[...(a.results||[]),...(b.results||[])].filter(x=>x.status==="VERIFIED");
const extra=cj.map(x=>{
 const ratio=Number(x.shipping?.price_usd)/Number(x.retail_price_usd);
 return {
  provider:"CJdropshipping",
  product_id:String(x.item_id),
  title:x.title,
  variant_id:String(x.variant_id),
  size:null,color:null,in_stock:true,
  verified_markets:["IL"],
  supplier_cost_usd:Number(x.supplier_cost_usd),
  retail_price_usd:Number(x.retail_price_usd),
  shipping_il_usd:Number(x.shipping?.price_usd),
  shipping_to_retail_ratio:Number.isFinite(ratio)?Number(ratio.toFixed(3)):null,
  commercial_training_flag:Number.isFinite(ratio)&&ratio>=0.8?"HIGH_SHIPPING_BURDEN":"NORMAL_SHIPPING_BURDEN",
  training_only:true,
  truth_source:"LIVE_CJ_EXACT_VARIANT_STOCK_SHIPPING_PROFIT_GATE"
 };
});
const out={
 version:"HUNT-STYLIST-TRAINING-SET-V2-IL",
 mode:"SHADOW_TRAINING",
 market:"IL",
 sources:[
  base.source,
  "evidence/HUNT-STYLIST-ASSORTMENT-MINI-LIVE-SCAN-2026-09-22.json",
  "evidence/HUNT-STYLIST-ASSORTMENT-MINI-LIVE-SCAN-B-2026-09-22.json"
 ],
 verified_products:base.products.length+extra.length,
 printful_global_verified:base.products.length,
 cj_il_verified_added:extra.length,
 products:[
   ...base.products.map(x=>({...x,market_training_scope:"GLOBAL_3_MARKET_SOURCE"})),
   ...extra.map(x=>({...x,market_training_scope:"IL_ONLY"}))
 ],
 production_effect:false
};
fs.writeFileSync("evidence/HUNT-STYLIST-ACADEMY-TRAINING-SET-V2-IL-2026-09-22.json",JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify({verified_products:out.verified_products,printful:out.printful_global_verified,cj_added:out.cj_il_verified_added,cj:extra.map(x=>({title:x.title,shipping_ratio:x.shipping_to_retail_ratio,flag:x.commercial_training_flag}))},null,2));
