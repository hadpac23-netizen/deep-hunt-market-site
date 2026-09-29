const BASE="https://zszlnahjqmwozwubetkm.supabase.co/functions/v1";
const APIKEY="sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
const COUNTRY="IL";
const PROFILE={payment_rate:0.04,refund_reserve_rate:0.05,platform_variable_rate:0,platform_fixed_per_order:0,min_contribution_per_unit:4,min_margin_rate:0.20,observed_at:"2026-09-14T19:55:14.774197Z"};
const POOL=[{"item_id":"09AA8DA5-1F05-4198-B504-8532D2DC0CD2","variant_id":"03B6EE1C-27CB-48E1-982A-18209D5E4C4A","retail_usd":5.99},{"item_id":"1369595750064984064","variant_id":"1369595751386189824","retail_usd":5.99},{"item_id":"1402815850569928704","variant_id":"1402856273678045184","retail_usd":14.99},{"item_id":"1412274952509460480","variant_id":"1412274953969078272","retail_usd":58.99},{"item_id":"1417723948015161344","variant_id":"1417723949504139264","retail_usd":6.99},{"item_id":"1421057420163158016","variant_id":"1421057421656330240","retail_usd":6.99},{"item_id":"1430020289193971712","variant_id":"1430020289227526144","retail_usd":5.99},{"item_id":"1451047630602899456","variant_id":"1451047630674202626","retail_usd":6.99},{"item_id":"1459000019528060928","variant_id":"1459000019590975489","retail_usd":5.99},{"item_id":"1562065404334452736","variant_id":"1562065404401561600","retail_usd":8.99},{"item_id":"1605844768632877056","variant_id":"1605844768699985921","retail_usd":6.99},{"item_id":"1634503348474884096","variant_id":"1634503348550381568","retail_usd":6.99},{"item_id":"1637303108059541504","variant_id":"1637303108344754176","retail_usd":4.99},{"item_id":"1697806323154427904","variant_id":"2510090710481601100","retail_usd":15.99},{"item_id":"1730310207496003584","variant_id":"1730310207709913088","retail_usd":8.99},{"item_id":"1739938184483577856","variant_id":"1739938184575852544","retail_usd":18.99},{"item_id":"1749064500030361600","variant_id":"1749064500051333129","retail_usd":11.99},{"item_id":"1764522119859286016","variant_id":"1764522120190636032","retail_usd":10.99},{"item_id":"1772805666072170496","variant_id":"1772805666210582528","retail_usd":5.99},{"item_id":"1779500898084343808","variant_id":"1779500898101121024","retail_usd":11.99},{"item_id":"1795739095671508992","variant_id":"1795739095751200768","retail_usd":6.99},{"item_id":"1796092259851579392","variant_id":"1796092260388450304","retail_usd":5.99},{"item_id":"1803019858280861696","variant_id":"1803019858301833217","retail_usd":6.99},{"item_id":"1837773406780411904","variant_id":"1837773406797189121","retail_usd":7.99},{"item_id":"1840648079268532224","variant_id":"1840648079344029696","retail_usd":8.99},{"item_id":"1846808671704469504","variant_id":"1846808672241340418","retail_usd":8.99},{"item_id":"2406080735051609200","variant_id":"2406080735061601100","retail_usd":5.99},{"item_id":"2406200720261609200","variant_id":"2406200720261609500","retail_usd":6.99},{"item_id":"2406260909541609100","variant_id":"2406260909541609300","retail_usd":17.99},{"item_id":"2407110211521609400","variant_id":"2407110211521609700","retail_usd":7.99},{"item_id":"2407230635391622400","variant_id":"2407230635391622600","retail_usd":5.99},{"item_id":"2408071314491619400","variant_id":"2408071314501610700","retail_usd":5.99},{"item_id":"2408220800151617100","variant_id":"2408220800151618900","retail_usd":19.99},{"item_id":"2408292342281614500","variant_id":"2408292342281615100","retail_usd":8.99},{"item_id":"2409040547221623400","variant_id":"2409040547221623600","retail_usd":7.99},{"item_id":"2409190210281602400","variant_id":"2409190210281602600","retail_usd":5.99},{"item_id":"2410280811211610600","variant_id":"2410280811211610800","retail_usd":7.99},{"item_id":"2410290536221624400","variant_id":"2410290536231621100","retail_usd":10.99},{"item_id":"2411070225211608000","variant_id":"2411070225221600500","retail_usd":4.99},{"item_id":"2411110403251628700","variant_id":"2411110403251628900","retail_usd":17.99},{"item_id":"2411140821401625400","variant_id":"2411140821401625700","retail_usd":6.99},{"item_id":"2411220158191609500","variant_id":"2411220158201600300","retail_usd":10.99},{"item_id":"2411280812111629400","variant_id":"2411280812111629700","retail_usd":21.99},{"item_id":"2412030803371624800","variant_id":"2412030803371625200","retail_usd":23.99},{"item_id":"2412210707211618600","variant_id":"2412210707211619400","retail_usd":6.99},{"item_id":"2412280616311613000","variant_id":"2412280616311613900","retail_usd":7.99},{"item_id":"2412280819511601200","variant_id":"2604080357331608300","retail_usd":6.99},{"item_id":"2501080713581609300","variant_id":"2501080713581609400","retail_usd":17.99},{"item_id":"2502121315081606300","variant_id":"2502121315081606500","retail_usd":7.99},{"item_id":"2503010508541627000","variant_id":"2503010508541627200","retail_usd":5.99},{"item_id":"2504090200471601900","variant_id":"2504090200481605000","retail_usd":15.99},{"item_id":"2505100159331600400","variant_id":"2505100159331601400","retail_usd":18.99},{"item_id":"2505230138231606300","variant_id":"2505230138241603800","retail_usd":7.99},{"item_id":"2505260143271616600","variant_id":"2505260143271616900","retail_usd":10.99},{"item_id":"2506070253101603100","variant_id":"2506070253111600200","retail_usd":8.99},{"item_id":"2506270548471611300","variant_id":"2506270548471616300","retail_usd":5.99},{"item_id":"2506280800381615700","variant_id":"2506280800381617000","retail_usd":7.99},{"item_id":"2507040832171609800","variant_id":"2507040832181601200","retail_usd":12.99},{"item_id":"2508300545571626600","variant_id":"2508300545571626800","retail_usd":5.99},{"item_id":"B27C9DB8-9FD8-4F7D-A45F-EE46042F16DA","variant_id":"A43A4557-F116-43E0-B0D0-F646C7CB070E","retail_usd":7.99},{"item_id":"B90B5473-0DA2-4344-ACE6-23AC5040B6D8","variant_id":"5DAAB867-5303-4E51-B2D6-F0FEE24879B8","retail_usd":5.99},{"item_id":"F7AC6D42-0DF8-41BC-A1B1-FB43131085E3","variant_id":"4AB706A2-3C87-47ED-AB34-6E52C85D2376","retail_usd":4.99},{"item_id":"F9384AE4-43F2-4DBE-B6BE-68C6712ECA22","variant_id":"05496153-746E-48F9-9D92-A34A41233DF4","retail_usd":9.99}];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function get(path,params){
  const u=new URL(BASE+"/"+path);
  for(const [k,v] of Object.entries(params))u.searchParams.set(k,String(v));
  const res=await fetch(u,{headers:{apikey:APIKEY,accept:"application/json"}});
  return {http:res.status,body:await res.json().catch(()=>({}))};
}
function economics(retail,cost,shipping){
  const gross=retail+shipping;
  const contribution=gross-cost-shipping-gross*PROFILE.payment_rate-gross*PROFILE.refund_reserve_rate-gross*PROFILE.platform_variable_rate-PROFILE.platform_fixed_per_order;
  const margin=retail>0?contribution/retail:0;
  const gate=contribution+0.0001>=PROFILE.min_contribution_per_unit&&margin+0.0001>=PROFILE.min_margin_rate?"PASS":contribution>0?"REVIEW":"BLOCK";
  return {contribution:Number(contribution.toFixed(2)),margin:Number(margin.toFixed(4)),gate,destination_tax_verified:false,final_profit_verified:false};
}
const results=[];
for(const row of POOL){
  let result;
  try{
    const detail=await get("hunt-storefront",{provider:"CJdropshipping",product_id:row.item_id});
    const quote=await get("hunt-cj-quote",{vid:row.variant_id,country_code:COUNTRY,quantity:1});
    const variants=Array.isArray(detail.body?.product?.variants)?detail.body.product.variants:[];
    const exact=variants.find(v=>String(v?.variant_id||"")===row.variant_id)||null;
    const cost=Number(exact?.price_amount);
    const options=Array.isArray(quote.body?.shipping_options)?quote.body.shipping_options:[];
    const shipping=options.length?Number(options[0]?.price_usd):NaN;
    let classification="RETRY",reason="FRESH_TRUTH_UNVERIFIED",econ=null;
    if(detail.http===200&&quote.http===200&&quote.body?.stock_verified===true){
      if(quote.body?.stock_available!==true){classification="HOLD";reason="OUT_OF_STOCK";}
      else if(quote.body?.shipping_verified!==true||!options.length||!Number.isFinite(shipping)){classification="HOLD";reason="NO_SHIPPING";}
      else if(!Number.isFinite(cost)||cost<=0){classification="RETRY";reason="SUPPLIER_COST_UNVERIFIED";}
      else{
        econ=economics(row.retail_usd,cost,shipping);
        classification=econ.gate==="PASS"?"FRESH_PASS":"HOLD";
        reason=econ.gate==="PASS"?"OK":econ.gate==="REVIEW"?"PROFIT_REVIEW":"PROFIT_BLOCK";
      }
    }
    result={...row,classification,reason,detail_http:detail.http,quote_http:quote.http,
      supplier_cost_usd:Number.isFinite(cost)?cost:null,
      stock_verified:quote.body?.stock_verified===true,stock_available:quote.body?.stock_available===true,
      shipping_verified:quote.body?.shipping_verified===true&&options.length>0,
      shipping_usd:Number.isFinite(shipping)?shipping:null,economics:econ};
  }catch(e){
    result={...row,classification:"RETRY",reason:"AUDIT_EXCEPTION",error:String(e?.message||e)};
  }
  results.push(result);
  await sleep(220);
}
const counts={
  total:results.length,
  fresh_pass:results.filter(x=>x.classification==="FRESH_PASS").length,
  hold:results.filter(x=>x.classification==="HOLD").length,
  retry:results.filter(x=>x.classification==="RETRY").length,
  out_of_stock:results.filter(x=>x.reason==="OUT_OF_STOCK").length,
  no_shipping:results.filter(x=>x.reason==="NO_SHIPPING").length,
  profit_review:results.filter(x=>x.reason==="PROFIT_REVIEW").length,
  profit_block:results.filter(x=>x.reason==="PROFIT_BLOCK").length
};
console.log("HUNT_CJ_CORE_AUDIT_SUMMARY="+JSON.stringify(counts));
console.log("HUNT_CJ_CORE_AUDIT_EXCEPTIONS="+JSON.stringify(results.filter(x=>x.classification!=="FRESH_PASS")));
