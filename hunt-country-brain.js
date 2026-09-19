(() => {
  const KEY="hunt_destination_market_v1";
  const MARKET_META={
    IL:{name:"Israel",city:"Dubai"},
    AE:{name:"United Arab Emirates",city:"Dubai"},
    SA:{name:"Saudi Arabia",city:"Dubai"},
    QA:{name:"Qatar",city:"Dubai"},
    KW:{name:"Kuwait",city:"Dubai"},
    BH:{name:"Bahrain",city:"Dubai"},
    OM:{name:"Oman",city:"Dubai"},
    US:{name:"United States",city:"New York"},
    CA:{name:"Canada",city:"New York"},
    MX:{name:"Mexico",city:"New York"},
    GB:{name:"United Kingdom",city:"London"},
    IE:{name:"Ireland",city:"London"},
    FR:{name:"France",city:"Paris"},
    BE:{name:"Belgium",city:"Paris"},
    CH:{name:"Switzerland",city:"Paris"},
    ES:{name:"Spain",city:"Madrid"},
    PT:{name:"Portugal",city:"Madrid"},
    DE:{name:"Germany",city:"Paris"},
    NL:{name:"Netherlands",city:"Paris"},
    AT:{name:"Austria",city:"Paris"},
    IT:{name:"Italy",city:"Paris"},
    HK:{name:"Hong Kong",city:"Hong Kong"},
    JP:{name:"Japan",city:"Tokyo"},
    KR:{name:"South Korea",city:"Seoul"},
    SG:{name:"Singapore",city:"Singapore"},
    MY:{name:"Malaysia",city:"Singapore"},
    CN:{name:"China",city:"Shanghai"},
    TW:{name:"Taiwan",city:"Shanghai"},
    AU:{name:"Australia",city:"Singapore"}
  };

  function normalize(value){
    const code=String(value||"").trim().toUpperCase();
    return /^[A-Z]{2}$/.test(code)?code:"";
  }
  function localeCountry(){
    const m=String(navigator.language||"").match(/[-_]([A-Za-z]{2})$/);
    return normalize(m?.[1]);
  }
  function market(){
    try{return normalize(localStorage.getItem(KEY))||localeCountry()||"US"}
    catch{return localeCountry()||"US"}
  }
  function setMarket(code,{source="user"}={}){
    const next=normalize(code);
    if(!next)return market();
    try{localStorage.setItem(KEY,next)}catch{}
    window.dispatchEvent(new CustomEvent("hunt:country-changed",{detail:{market:next,source}}));
    window.HuntAnalytics?.experience?.("country_change",{market:next,source});
    return next;
  }

  function values(item,keys){
    for(const key of keys){
      const raw=item?.[key];
      if(Array.isArray(raw))return raw.map(normalize).filter(Boolean);
      if(typeof raw==="string"&&raw.trim()){
        const parts=raw.split(/[;,|]/).map(normalize).filter(Boolean);
        if(parts.length)return parts;
      }
    }
    return [];
  }

  function explicitCountries(item){
    return values(item,[
      "shipping_countries","available_countries","supported_countries","countries",
      "service_countries","markets","market_codes"
    ]);
  }
  function warehouseCountries(item){
    return values(item,["warehouse_countries","warehouse_country","stock_countries"]);
  }
  function readiness(item,code=market()){
    const m=normalize(code);
    const explicit=explicitCountries(item);
    if(explicit.length)return explicit.includes(m)?"verified_match":"verified_mismatch";
    return "unknown";
  }
  function score(item,code=market()){
    const m=normalize(code),state=readiness(item,m);
    if(state==="verified_match")return 45;
    if(state==="verified_mismatch")return -100;
    const wh=warehouseCountries(item);
    let value=wh.includes(m)?8:0;
    if(item?.availability_verified===true)value+=3;
    return value;
  }
  function rank(rows,code=market()){
    return (rows||[]).map((item,index)=>({item,index,score:score(item,code)}))
      .sort((a,b)=>(b.score-a.score)||(a.index-b.index))
      .map(x=>x.item);
  }
  function meta(code=market()){
    const c=normalize(code);
    return {code:c,...(MARKET_META[c]||{name:c||"Global",city:"Dubai"})};
  }

  function bindCheckout(){
    const select=document.querySelector("#hd-checkout-market");
    if(!select)return;
    const current=market();
    if([...select.options].some(o=>o.value===current))select.value=current;
    select.addEventListener("change",()=>setMarket(select.value,{source:"checkout"}));
  }

  window.HuntCountry=Object.freeze({market,setMarket,readiness,score,rank,meta,explicitCountries});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bindCheckout,{once:true});
  else bindCheckout();
})();