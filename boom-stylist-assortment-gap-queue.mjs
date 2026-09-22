import fs from "node:fs";

const ROOT=".";
const defs={
  footwear:{
    file:"catalog-shards/shoes.json",
    include:/\b(shoes?|sneakers?|boots?|sandals?|slippers?|loafers?|heels?)\b/i,
    exclude:/shoe (rack|cabinet|storage|organizer|bench|shelf|cleaner|deodor|protector|insoles?)|pen holder|changing stool|repair|display|furniture|resistance belt|height-increasing|orthopedic|pig-hoof/i,
    target:18
  },
  bottoms:{
    file:"catalog-shards/bottoms.json",
    include:/\b(jeans?|trousers?|pants?|shorts?|skirts?|leggings?|sweatpants?)\b/i,
    exclude:/underwear|boxers?|briefs?|pet |dog |tummy|butt[- ]?lift|slimming|shark pants|menstrual/i,
    target:18
  }
};
const genderBucket=t=>{
  const s=t.toLowerCase();
  if(/women|woman|ladies|female/.test(s))return "women";
  if(/men|man|male/.test(s))return "men";
  if(/child|kid|boys?|girls?|baby/.test(s))return "kids";
  return "general";
};
const styleTags=t=>{
  const s=t.toLowerCase(), out=[];
  for(const [tag,re] of [
    ["casual",/casual/],["formal",/formal|business|dress/],["sport",/sport|golf|fitness/],
    ["boots",/boot/],["sneakers",/sneaker/],["sandals",/sandal/],["slippers",/slipper/],
    ["denim",/jean|denim/],["wide_leg",/wide[- ]?leg/],["straight_leg",/straight[- ]?leg/],
    ["shorts",/shorts?/],["trousers",/trousers?|pants?/]
  ]) if(re.test(s)) out.push(tag);
  return out;
};
const result={version:"HUNT-STYLIST-ASSORTMENT-GAP-QUEUE-V1",mode:"CANDIDATE_RECHECK_ONLY",production_effect:false,product_truth_claimed:false,lanes:{}};
for(const [lane,d] of Object.entries(defs)){
  const x=JSON.parse(fs.readFileSync(d.file,"utf8"));
  const seen=new Set(), pool=[];
  for(const p of x.products||[]){
    if(p.provider!=="CJdropshipping")continue;
    const title=String(p.title||"");
    if(!d.include.test(title)||d.exclude.test(title))continue;
    if(!p.item_id||seen.has(String(p.item_id)))continue;
    if(!Number.isFinite(Number(p.price_amount))||Number(p.price_amount)<=0)continue;
    seen.add(String(p.item_id));
    pool.push({
      provider:p.provider,item_id:String(p.item_id),title,
      category:p.category||lane,gender_bucket:genderBucket(title),style_tags:styleTags(title),
      supplier_snapshot_price_usd:Number(p.price_amount),
      snapshot_availability_verified:p.availability_verified===true,
      required_next:"EXACT_VARIANT_STOCK_SHIPPING_PROFIT_RECHECK_IL"
    });
  }
  const scored=pool.map(p=>{
    let score=0;
    if(p.gender_bucket!=="general")score+=2;
    if(p.style_tags.length>=2)score+=2;
    if(/casual|business|denim|sneaker|boot|loafer|sandal|short|trouser|jean/i.test(p.title))score+=2;
    if(p.supplier_snapshot_price_usd>=4&&p.supplier_snapshot_price_usd<=30)score+=2;
    return {...p,queue_score:score};
  }).sort((a,b)=>b.queue_score-a.queue_score||a.supplier_snapshot_price_usd-b.supplier_snapshot_price_usd);
  const chosen=[]; const bucketCount={women:0,men:0,kids:0,general:0};
  for(const p of scored){
    if(chosen.length>=d.target)break;
    if(bucketCount[p.gender_bucket]>=8)continue;
    chosen.push(p);bucketCount[p.gender_bucket]++;
  }
  result.lanes[lane]={source_candidates:pool.length,selected_for_recheck:chosen.length,buckets:bucketCount,candidates:chosen};
}
result.summary={
  footwear_source:result.lanes.footwear.source_candidates,
  footwear_queue:result.lanes.footwear.selected_for_recheck,
  bottoms_source:result.lanes.bottoms.source_candidates,
  bottoms_queue:result.lanes.bottoms.selected_for_recheck,
  total_queue:result.lanes.footwear.selected_for_recheck+result.lanes.bottoms.selected_for_recheck
};
result.next="RUN_READ_ONLY_PRODUCT_TRUTH_RECHECK_IN_SMALL_BATCHES; ONLY VERIFIED ITEMS MAY ENTER STYLIST TRAINING";
fs.writeFileSync("evidence/HUNT-STYLIST-ASSORTMENT-GAP-QUEUE-2026-09-22.json",JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify(result.summary,null,2));
for(const lane of ["footwear","bottoms"]){
 console.log("\n"+lane.toUpperCase());
 for(const x of result.lanes[lane].candidates) console.log(x.item_id+" | "+x.gender_bucket+" | "+x.title);
}
