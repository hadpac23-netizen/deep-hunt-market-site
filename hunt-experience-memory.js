(() => {
  "use strict";

  const STORAGE_KEY="hunt_experience_memory_v1";
  const MAX_EVENTS=500;
  const TYPES=Object.freeze([
    "impression","product_view","dwell","like","save","share","skip",
    "not_interested","world_enter","try_on","look_save","add_to_cart",
    "purchase","return","watch"
  ]);
  const TYPE_SET=new Set(TYPES);
  const clean=v=>String(v??"").trim();

  function readStore(){
    if(typeof localStorage==="undefined")return [];
    try{
      const rows=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
      return Array.isArray(rows)?rows:[];
    }catch{return []}
  }

  function writeStore(rows){
    if(typeof localStorage==="undefined")return rows;
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(rows.slice(-MAX_EVENTS)))}catch{}
    return rows;
  }

  function normalize(input={}){
    const type=clean(input.type).toLowerCase();
    if(!TYPE_SET.has(type))throw new Error("UNSUPPORTED_EVENT_TYPE");
    const ts=input.ts?new Date(input.ts):new Date();
    if(Number.isNaN(ts.getTime()))throw new Error("INVALID_EVENT_TIME");
    return Object.freeze({
      id:clean(input.id)||type+":"+ts.getTime()+":"+Math.random().toString(36).slice(2,8),
      type,
      ts:ts.toISOString(),
      provider:clean(input.provider).toLowerCase(),
      item_id:clean(input.item_id),
      variant_id:clean(input.variant_id),
      category:clean(input.category),
      world:clean(input.world),
      look_id:clean(input.look_id),
      title:clean(input.title),
      image_url:clean(input.image_url),
      url:clean(input.url),
      active:input.active!==false,
      source:clean(input.source||"hunt")
    });
  }
  function record(input={}){
    const event=normalize(input);
    const rows=readStore();
    rows.push(event);
    writeStore(rows);
    if(typeof window!=="undefined"&&typeof window.dispatchEvent==="function"){
      try{window.dispatchEvent(new CustomEvent("hunt:experience-event",{detail:event}))}catch{}
    }
    return event;
  }

  function clear(){
    if(typeof localStorage!=="undefined")try{localStorage.removeItem(STORAGE_KEY)}catch{}
    if(typeof window!=="undefined"&&typeof window.dispatchEvent==="function"){
      try{window.dispatchEvent(new CustomEvent("hunt:memory-reset"))}catch{}
    }
  }

  function events({limit=MAX_EVENTS,type=null}={}){
    let rows=readStore();
    if(type)rows=rows.filter(x=>x.type===type);
    return rows.slice(-Math.max(1,Number(limit)||MAX_EVENTS));
  }

  function productKey(row={}){
    const provider=clean(row.provider).toLowerCase();
    const item=clean(row.item_id);
    const variant=clean(row.variant_id);
    return provider&&item?provider+":"+item+(variant?":"+variant:""):"";
  }

  function decisionContext(rows=events()){
    const recent=[...rows].reverse().slice(0,120);
    const products=[],categories=[],suppliers=[];
    for(const row of recent){
      const key=productKey(row);
      if(key&&!products.includes(key))products.push(key);
      if(row.category&&!categories.includes(row.category))categories.push(row.category);
      if(row.provider&&!suppliers.includes(row.provider))suppliers.push(row.provider);
    }
    return Object.freeze({
      interactions:rows.length,
      recent_product_keys:Object.freeze(products.slice(0,30)),
      recent_categories:Object.freeze(categories.slice(0,15)),
      recent_suppliers:Object.freeze(suppliers.slice(0,8))
    });
  }
  function historyGroups(rows=events(),now=new Date()){
    const startToday=new Date(now);startToday.setHours(0,0,0,0);
    const startYesterday=new Date(startToday);startYesterday.setDate(startYesterday.getDate()-1);
    const startWeek=new Date(startToday);startWeek.setDate(startWeek.getDate()-7);
    const groups={today:[],yesterday:[],this_week:[],older:[]};

    for(const row of [...rows].reverse()){
      const t=new Date(row.ts);
      if(t>=startToday)groups.today.push(row);
      else if(t>=startYesterday)groups.yesterday.push(row);
      else if(t>=startWeek)groups.this_week.push(row);
      else groups.older.push(row);
    }
    return groups;
  }

  function connectBrowserEvents(){
    if(typeof window==="undefined"||typeof window.addEventListener!=="function")return;
    window.addEventListener("hunt:shopping-action",event=>{
      const d=event.detail||{};
      if((d.action==="like"||d.action==="save")&&d.active===true){
        record({type:d.action,...d,active:true,source:"shopping-actions"});
      }
    });
    window.addEventListener("hunt:share",event=>{
      record({type:"share",...(event.detail||{}),source:"share"});
    });
    window.addEventListener("hunt:world-enter",event=>{
      record({type:"world_enter",...(event.detail||{}),source:"worlds"});
    });
  }

  const api=Object.freeze({TYPES,normalize,record,clear,events,productKey,decisionContext,historyGroups,connectBrowserEvents});
  if(typeof window!=="undefined"){
    window.HuntExperienceMemory=api;
    connectBrowserEvents();
  }
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
