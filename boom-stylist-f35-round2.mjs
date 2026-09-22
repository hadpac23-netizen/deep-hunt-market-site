import fs from "node:fs";
const train=JSON.parse(fs.readFileSync("evidence/HUNT-STYLIST-ACADEMY-TRAINING-SET-V2-IL-2026-09-22.json","utf8"));
const by=new Map(train.products.map(x=>[String(x.product_id),x]));
const looks=[
  {id:"LOOK-01",audience:"women",occasion:"casual_street",items:[
    ["1628","top"],["2609080947141606700","bottom"],["2609080904291620900","footwear"],["458","accessory"],["262","bag"]
  ]},
  {id:"LOOK-02",audience:"women",occasion:"smart_casual",items:[
    ["1590","top"],["2609070646371634700","bottom"],["2609081212521623500","footwear"],["630","accessory"],["181","tech"]
  ]},
  {id:"LOOK-03",audience:"women",occasion:"weekend",items:[
    ["388","top"],["507","bottom"],["2609090301381604500","footwear"],["630","accessory"],["262","bag"]
  ]},
  {id:"LOOK-04",audience:"men",occasion:"smart_casual",items:[
    ["770","top"],["2609070326191624000","bottom"],["2609080443011631100","footwear"],["638","accessory"],["681","tech"]
  ]},
  {id:"LOOK-05",audience:"men",occasion:"weekend",items:[
    ["531","top"],["2609090321561625000","bottom"],["2609080443011631100","footwear"],["1586","accessory"],["279","bag"]
  ]}
];
const outLooks=looks.map(l=>{
  const items=l.items.map(([id,role])=>{
    const p=by.get(id);if(!p)throw new Error("Missing verified product "+id);
    const shippingFlag=p.commercial_training_flag||"GLOBAL_SOURCE";
    return {role,product_id:id,title:p.title,provider:p.provider,verified_markets:p.verified_markets||[],shipping_flag:shippingFlag};
  });
  const marketOk=items.every(x=>x.verified_markets.includes("IL"));
  const highShip=items.filter(x=>x.shipping_flag==="HIGH_SHIPPING_BURDEN").map(x=>x.product_id);
  return {...l,items,product_truth_il:marketOk,high_shipping_burden_items:highShip,commercial_note:highShip.length?"STYLE_OK_FOR_TRAINING_BUT_DO_NOT_HERO_WITHOUT_SHIPPING_STRATEGY":"NO_HIGH_SHIPPING_FLAG"};
});
const assortment={
  footwear:train.products.filter(x=>/shoe|sneaker|boot|sandal|slipper|loafer/i.test(x.title)).length,
  bottoms:train.products.filter(x=>/short|pant|trouser|jean|skirt|legging/i.test(x.title)).length,
  tops:train.products.filter(x=>/shirt|hoodie|sweatshirt|jersey|pullover/i.test(x.title)).length,
  accessories:train.products.filter(x=>/cap|hat|beanie|bandana|bag|tag|case/i.test(x.title)).length
};
const result={
  version:"BOOM-STYLIST-F35-ROUND2-V1",
  market:"IL",mode:"SHADOW_EXAM",production_effect:false,
  training_set:train.version,
  assortment_gate:{status:assortment.footwear>=3&&assortment.bottoms>=5?"PASS":"BLOCKED",assortment},
  style_exam:{
    id:"STYLE-20-5",
    status:"READY_FOR_VISUAL_QA",
    product_truth_gate:outLooks.every(x=>x.product_truth_il)?"PASS":"BLOCKED",
    looks:outLooks,
    subjective_score_claimed:false,
    reason:"Five complete verified looks exist for IL; visual coherence, color harmony and brand-fit still require visual QA."
  },
  commerce_exam:{
    status:"PASS_WITH_WARNINGS",
    warning:"High shipping-to-retail ratio on several footwear items; use for style training, not automatic hero placement.",
    high_shipping_look_count:outLooks.filter(x=>x.high_shipping_burden_items.length).length
  },
  mastery_change:false,
  next:["Run Visual QA on exact product images/mockups.","Score style coherence and HUNT brand fit only after visual evidence.","Keep high-shipping footwear out of commercial hero slots unless shipping/bundle economics improve."]
};
fs.writeFileSync("evidence/HUNT-STYLIST-F35-ROUND2-2026-09-22.json",JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify({assortment_gate:result.assortment_gate,style_status:result.style_exam.status,truth:result.style_exam.product_truth_gate,looks:result.style_exam.looks.length,commerce:result.commerce_exam},null,2));
