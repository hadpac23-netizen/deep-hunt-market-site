(() => {
  "use strict";

  const clean=v=>String(v??"").trim();
  const Decision=typeof module!=="undefined"&&module.exports
    ? require("./boom-decision-brain.js")
    : globalThis.BoomDecisionBrain;
  const Taste=typeof module!=="undefined"&&module.exports
    ? require("./boom-taste-dna.js")
    : globalThis.BoomTasteDNA;
  const hash=value=>{
    let h=2166136261;
    for(const ch of clean(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
    return h>>>0;
  };

  const WORLDS=Object.freeze([
    {id:"fashion",title:"Fashion After Dark",copy:"Fashion, bags and accessories in one living edit.",visual:"assets/hunt-city/real/tokyo.jpg",visual_fallback:"assets/hunt-city/tokyo-night.svg",visual_label:"Tokyo night skyline · Pexels",slugs:["women","women-tops","women-jeans","bags","jewelry","women-shoes"]},
    {id:"jewelry",title:"Jewelry Close-Up",copy:"Small details, stronger focus.",visual:"assets/hunt-city/real/paris.jpg",visual_fallback:"assets/hunt-city/paris-night.svg",visual_label:"Paris skyline · Pexels",slugs:["jewelry","jewelry-necklaces","jewelry-earrings","jewelry-rings","watches"]},
    {id:"tech-home",title:"Future Living",copy:"Useful tech and home upgrades.",visual:"assets/hunt-city/real/shenzhen.jpg",visual_fallback:"assets/hunt-city/shenzhen-night.svg",visual_label:"Shenzhen night skyline · Pexels",slugs:["tech","phone-cases","power-banks","home","lighting","computer-accessories"]},
    {id:"travel",title:"Night Departure",copy:"Travel-ready essentials with a global feel.",visual:"assets/hunt-city/real/dubai.jpg",visual_fallback:"assets/hunt-city/dubai-night.svg",visual_label:"Dubai night skyline · Pexels",slugs:["travel","luggage","bags","power-banks","drinkware"]}
  ]);

  function uniqueProducts(shelves={}){
    const rows=[],seen=new Set();
    for(const [slug,list] of Object.entries(shelves||{})){
      for(const item of Array.isArray(list)?list:[]){
        const key=clean(item?.provider)+":"+clean(item?.item_id);
        if(!item?.item_id||seen.has(key))continue;
        seen.add(key);
        rows.push({...item,_shelf_slug:slug});
      }
    }
    return rows;
  }

  function worldProducts(world,shelves={},limit=18){
    const out=[],seen=new Set();
    for(const slug of world.slugs){
      for(const item of Array.isArray(shelves?.[slug])?shelves[slug]:[]){
        const key=clean(item?.provider)+":"+clean(item?.item_id);
        if(!item?.item_id||seen.has(key))continue;
        seen.add(key);out.push({...item,_shelf_slug:slug});
        if(out.length>=limit)return out;
      }
    }
    return out;
  }
  function laneFor(item,index,context={}){
    if(item?.is_new===true||item?.new_arrival===true)return "new";
    const category=clean(item?.category||item?._shelf_slug);
    if((context.recent_categories||[]).includes(category))return "personalized";
    const pattern=["personalized","adjacent","new","wildcard","personalized","adjacent"];
    return pattern[index%pattern.length];
  }

  function laneLabel(lane){
    return ({
      personalized:"FOR YOU",
      adjacent:"NEXT TO YOUR TASTE",
      new:"NEW",
      wildcard:"SURPRISE"
    })[lane]||"DISCOVER";
  }

  function reasonFor(item,lane,context={}){
    const category=clean(item?.category||item?._shelf_slug);
    const recentCategories=context.recent_categories||[];
    const recentSuppliers=context.recent_suppliers||[];
    const affinity=Number(context.category_affinity?.[category]||0);
    if(category&&affinity>=4)return "Strong match with your recent "+category.replace(/-/g," ")+" activity";
    if(category&&recentCategories.includes(category))return "Because you explored "+category.replace(/-/g," ");
    if(lane==="new")return "New in HUNT";
    if(lane==="adjacent")return recentCategories.length?"Related to your recent browsing":"A nearby category to explore";
    if(lane==="wildcard")return "A controlled surprise outside your usual lane";
    if(clean(item?.provider)&&recentSuppliers.includes(clean(item.provider).toLowerCase()))return "From a provider you explored";
    return "Picked for discovery";
  }

  function discoveryScore(item,lane,context={}){
    let score=0;
    const taste=Taste?.candidateSignals?.(context.taste_profile||{},item)||null;
    const verifiedCandidate=item?.decision_candidate&&typeof item.decision_candidate==="object"
      ? Decision?.scoreCandidate?.(item.decision_candidate,context)
      : null;
    if(verifiedCandidate?.eligible)score+=Math.min(40,Number(verifiedCandidate.score||0)*0.4);
    if(taste){score+=(taste.affinity-.5)*36;score-=taste.hide_risk*30;}
    const category=clean(item?.category||item?._shelf_slug);
    const provider=clean(item?.provider).toLowerCase();
    if((context.recent_categories||[]).includes(category))score+=18;
    const categoryAffinity=Number(context.category_affinity?.[category]||0);
    const supplierAffinity=Number(context.supplier_affinity?.[provider]||0);
    if(categoryAffinity>0)score+=Math.min(28,categoryAffinity*2.4);
    if(categoryAffinity<0)score-=Math.min(35,Math.abs(categoryAffinity)*3);
    if((context.recent_suppliers||[]).includes(provider))score+=4;
    if(supplierAffinity>0)score+=Math.min(10,supplierAffinity);
    if(supplierAffinity<0)score-=Math.min(14,Math.abs(supplierAffinity)*1.5);
    if(item?.is_new===true||item?.new_arrival===true)score+=20;
    if(item?.availability_verified===true)score+=12;
    if(item?.retail_price_verified===true)score+=8;
    if(/^https:\/\//i.test(clean(item?.image_url)))score+=8;
    if(lane==="wildcard")score+=hash(clean(item?.item_id))%14;
    if(lane==="adjacent")score+=10;
    return score;
  }

  function buildUnits({shelves={},context={},sessionSeed="hunt"}={}){
    const all=uniqueProducts(shelves);
    const worlds=WORLDS.map((world,index)=>{
      const rows=worldProducts(world,shelves,16)
        .map((item,i)=>{
          const lane=laneFor(item,i,context);
          return {item,lane,score:discoveryScore(item,lane,context),reason:reasonFor(item,lane,context)};
        })
        .sort((a,b)=>b.score-a.score)
        .slice(0,12);
      return Object.freeze({...world,index,products:Object.freeze(rows)});
    }).filter(x=>x.products.length);

    const laneMap={personalized:[],adjacent:[],new:[],wildcard:[]};
    all.forEach((item,index)=>{
      const lane=laneFor(item,index,context);
      laneMap[lane].push({item,lane,score:discoveryScore(item,lane,context),reason:reasonFor(item,lane,context)});
    });
    Object.values(laneMap).forEach(rows=>rows.sort((a,b)=>b.score-a.score));

    const order=["personalized","new","adjacent","wildcard"];
    const units=order.map((lane,index)=>Object.freeze({
      id:"lane-"+lane,
      type:"lane",
      lane,
      title:laneLabel(lane),
      products:Object.freeze(laneMap[lane].slice(0,12)),
      position:index
    })).filter(x=>x.products.length);

    return Object.freeze({
      sessionSeed,
      worlds:Object.freeze(worlds),
      units:Object.freeze(units),
      total_products:all.length
    });
  }

  const api=Object.freeze({WORLDS,uniqueProducts,worldProducts,laneFor,laneLabel,reasonFor,discoveryScore,buildUnits});
  if(typeof window!=="undefined")window.Hunt2037FlowCore=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
