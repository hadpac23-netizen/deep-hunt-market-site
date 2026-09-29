const BASE="https://zszlnahjqmwozwubetkm.supabase.co/functions/v1";
const APIKEY="sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
const COUNTRY="IL";
const PRODUCTS=[
  "09AA8DA5-1F05-4198-B504-8532D2DC0CD2",
  "1459000019528060928",
  "2031984615632564226"
];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function getJson(url){
  const res=await fetch(url,{headers:{apikey:APIKEY,accept:"application/json"}});
  const body=await res.json().catch(()=>({}));
  return {http:res.status,body};
}
async function detail(itemId){
  const u=new URL(BASE+"/hunt-storefront");
  u.searchParams.set("provider","CJdropshipping");
  u.searchParams.set("product_id",itemId);
  return getJson(u);
}
async function quote(vid){
  const u=new URL(BASE+"/hunt-cj-quote");
  u.searchParams.set("vid",vid);
  u.searchParams.set("country_code",COUNTRY);
  u.searchParams.set("quantity","1");
  return getJson(u);
}
const out={audit_version:"HUNT_LIVE_SHELF_AUDIT_V1",provider:"CJdropshipping",
  department:"accessories",shelf:"jewelry-rings",destination_country:COUNTRY,
  checked_at:new Date().toISOString(),production_effect:false,payment_attempted:false,
  supplier_order_attempted:false,products:[]};
for(const itemId of PRODUCTS){
  const d=await detail(itemId);
  const p=d.body?.product||null;
  const row={item_id:itemId,detail_http:d.http,title:p?.title||null,variant_count:p?.variant_count??0,variants:[]};
  if(p&&Array.isArray(p.variants)){
    for(const v of p.variants){
      const q=await quote(v.variant_id);
      const b=q.body||{};
      row.variants.push({
        variant_id:v.variant_id,sku:v.sku||null,color:v.color||null,size:v.size||null,
        supplier_price_usd:v.price_amount??null,
        detail_stock_snapshot:v.stock_quantity??null,
        quote_http:q.http,
        stock_verified:b.stock_verified===true,
        stock_available:b.stock_available===true,
        selected_origin:b.selected_origin||null,
        shipping_verified:b.shipping_verified===true,
        shipping_options:Array.isArray(b.shipping_options)?b.shipping_options.slice(0,3):[],
        live_status:q.http===200&&b.stock_verified===true
          ?(b.stock_available===true?(b.shipping_verified===true?"AVAILABLE_SHIPPABLE":"AVAILABLE_NO_SHIPPING"):"OUT_OF_STOCK")
          :"UNVERIFIED"
      });
      await sleep(140);
    }
  }
  out.products.push(row);
}
const variants=out.products.flatMap(p=>p.variants);
out.summary={
  product_count:out.products.length,
  variant_count:variants.length,
  available_shippable:variants.filter(v=>v.live_status==="AVAILABLE_SHIPPABLE").length,
  available_no_shipping:variants.filter(v=>v.live_status==="AVAILABLE_NO_SHIPPING").length,
  out_of_stock:variants.filter(v=>v.live_status==="OUT_OF_STOCK").length,
  unverified:variants.filter(v=>v.live_status==="UNVERIFIED").length
};
console.log("HUNT_SHELF_AUDIT_JSON="+JSON.stringify(out));
console.log("HUNT_SHELF_AUDIT_SUMMARY="+JSON.stringify(out.summary));
