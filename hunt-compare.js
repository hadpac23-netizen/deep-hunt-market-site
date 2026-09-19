(() => {
  "use strict";

  const H=window.HuntCore;
  const KEY="hunt_compare_v1";
  const MAX=3;
  const products=new Map();
  let selected=[];

  const esc=value=>H?.esc?H.esc(value):String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const keyOf=p=>String(p?.provider||"")+"::"+String(p?.item_id||"");
  const restricted=p=>/\b(gun|firearm|ammunition|ammo|weapon|switchblade|taser|cannabis|marijuana|thc|cocaine|heroin|meth|steroid|vape|cigarette|nicotine|beer|wine|vodka|casino|sportsbook|betting|porn|sex toy)\b/i.test([p?.title,p?.category,p?.type_name].filter(Boolean).join(" "));

  function safeProduct(p){
    if(!p||!p.item_id||restricted(p))return null;
    return {
      provider:String(p.provider||"CJdropshipping"),
      item_id:String(p.item_id),
      title:String(p.title||"Product").slice(0,220),
      image_url:typeof p.image_url==="string"&&p.image_url.startsWith("https://")?p.image_url:"",
      category:String(p.category||""),
      brand:String(p.brand||""),
      model:String(p.model||""),
      type_name:String(p.type_name||""),
      origin_country:String(p.origin_country||""),
      avg_fulfillment_time:String(p.avg_fulfillment_time||""),
      variant_count:Number(p.variant_count||0)||0,
      availability_verified:p.availability_verified===true,
      quote_verification_status:String(p.quote_verification_status||""),
      retail_price_verified:p.retail_price_verified===true,
      profit_gate_status:String(p.profit_gate_status||""),
      retail_price_amount:Number(p.retail_price_amount||0)||0,
      retail_currency:String(p.retail_currency||p.currency||"USD")
    };
  }

  function load(){
    try{
      const rows=JSON.parse(sessionStorage.getItem(KEY)||"[]");
      selected=Array.isArray(rows)?rows.map(safeProduct).filter(Boolean).slice(0,MAX):[];
      selected.forEach(p=>products.set(keyOf(p),p));
    }catch{selected=[];}
  }

  function save(){
    try{sessionStorage.setItem(KEY,JSON.stringify(selected));}catch{}
  }

  function retail(p){
    const ready=p.retail_price_verified===true
      && String(p.profit_gate_status||"").toUpperCase()==="PASS"
      && Number.isFinite(Number(p.retail_price_amount))
      && Number(p.retail_price_amount)>0;
    return ready?(H?.money?H.money(Number(p.retail_price_amount),p.retail_currency||"USD"):String(p.retail_price_amount)):"Needs check";
  }

  function availability(p){
    if(String(p.quote_verification_status||"").toUpperCase()==="PASS")return "Quote verified";
    if(p.availability_verified===true)return "Signal verified";
    return "Recheck";
  }

  function register(input){
    (Array.isArray(input)?input:[input]).forEach(row=>{
      const p=safeProduct(row);
      if(p)products.set(keyOf(p),p);
    });
    syncButtons();
  }

  function isSelected(key){return selected.some(p=>keyOf(p)===key);}

  function button(product){
    const p=safeProduct(product);
    if(!p)return "";
    products.set(keyOf(p),p);
    const active=isSelected(keyOf(p));
    return `<div class="hd-compare-row"><button type="button" class="hd-compare-toggle" data-hunt-compare="${esc(keyOf(p))}" aria-pressed="${active?"true":"false"}">${active?"Selected":"Compare facts"}</button></div>`;
  }

  function ensureShell(){
    if(document.querySelector("#hd-compare-tray"))return;
    document.body.insertAdjacentHTML("beforeend",`
      <aside class="hd-compare-tray" id="hd-compare-tray" hidden aria-live="polite">
        <div class="hd-compare-tray-copy"><strong id="hd-compare-copy">Compare facts</strong><small>Choose up to 3 products. HUNT does not rank a winner.</small></div>
        <div class="hd-compare-tray-products" id="hd-compare-tray-products"></div>
        <button type="button" data-compare-open>Compare</button>
        <button type="button" data-compare-clear>Clear</button>
      </aside>
      <dialog class="hd-compare-dialog" id="hd-compare-dialog">
        <div class="hd-compare-dialog-shell">
          <div class="hd-compare-dialog-head">
            <div><small>HUNT FACTUAL COMPARE</small><h2>Compare what is known.</h2><p>No winner, score, or invented specification. Missing data stays unknown.</p></div>
            <button type="button" data-compare-close aria-label="Close comparison">×</button>
          </div>
          <div class="hd-compare-table-wrap" id="hd-compare-table-wrap"></div>
        </div>
      </dialog>
    `);
  }

  function syncButtons(){
    document.querySelectorAll("[data-hunt-compare]").forEach(btn=>{
      const active=isSelected(btn.dataset.huntCompare||"");
      btn.setAttribute("aria-pressed",String(active));
      btn.textContent=active?"Selected":"Compare facts";
    });
  }

  function renderTray(message=""){
    ensureShell();
    const tray=document.querySelector("#hd-compare-tray");
    if(!tray)return;
    tray.hidden=selected.length===0;
    const copy=tray.querySelector("#hd-compare-copy");
    if(copy)copy.textContent=message||(`${selected.length} selected for factual comparison`);
    const images=tray.querySelector("#hd-compare-tray-products");
    if(images)images.innerHTML=selected.map(p=>p.image_url?`<span title="${esc(p.title)}"><img src="${esc(p.image_url)}" alt=""></span>`:`<span title="${esc(p.title)}"></span>`).join("");
    tray.querySelector("[data-compare-open]")?.toggleAttribute("disabled",selected.length<2);
    syncButtons();
  }

  function row(label,getter){
    const values=selected.map(p=>{
      const v=getter(p);
      return v===null||v===undefined||v===""?"Unknown":String(v);
    });
    if(values.every(v=>v==="Unknown"))return "";
    return `<tr><th scope="row">${esc(label)}</th>${values.map(v=>`<td>${esc(v)}</td>`).join("")}</tr>`;
  }

  function renderTable(){
    const wrap=document.querySelector("#hd-compare-table-wrap");
    if(!wrap)return;
    const heads=selected.map(p=>`
      <th scope="col"><div class="hd-compare-product-head">
        ${p.image_url?`<img src="${esc(p.image_url)}" alt="">`:""}
        <div><strong>${esc(p.title)}</strong><a href="${esc(H?.productUrl?H.productUrl(p):"#")}">View product →</a></div>
      </div></th>`).join("");
    const rows=[
      row("Price",retail),
      row("Brand",p=>p.brand||null),
      row("Model",p=>p.model||null),
      row("Type",p=>p.type_name||null),
      row("Options",p=>p.variant_count>0?String(p.variant_count):null),
      row("Availability",availability),
      row("Origin",p=>p.origin_country||null),
      row("Fulfillment",p=>p.avg_fulfillment_time||null),
      row("Provider",p=>p.provider||null)
    ].join("");
    wrap.innerHTML=`<table class="hd-compare-table"><thead><tr><th scope="col">Fact</th>${heads}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  function open(){
    if(selected.length<2)return;
    ensureShell(); renderTable();
    const dialog=document.querySelector("#hd-compare-dialog");
    if(dialog?.showModal)dialog.showModal();
    else dialog?.setAttribute("open","");
  }

  function close(){
    const dialog=document.querySelector("#hd-compare-dialog");
    if(dialog?.close)dialog.close();
    else dialog?.removeAttribute("open");
  }

  function toggle(key){
    const existing=selected.findIndex(p=>keyOf(p)===key);
    if(existing>=0){
      selected.splice(existing,1);
      save(); renderTray(); return;
    }
    const p=products.get(key);
    if(!p)return;
    if(selected.length>=MAX){
      renderTray("Compare up to 3 products at a time.");
      return;
    }
    selected.push(p); save(); renderTray();
  }

  document.addEventListener("click",event=>{
    const toggleBtn=event.target.closest?.("[data-hunt-compare]");
    if(toggleBtn){event.preventDefault();toggle(toggleBtn.dataset.huntCompare||"");return;}
    if(event.target.closest?.("[data-compare-open]")){open();return;}
    if(event.target.closest?.("[data-compare-clear]")){selected=[];save();renderTray();return;}
    if(event.target.closest?.("[data-compare-close]")){close();return;}
  });

  window.HuntCompare=Object.freeze({register,button,open,clear:()=>{selected=[];save();renderTray();},selected:()=>selected.map(p=>({...p}))});
  load();
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{ensureShell();renderTray();},{once:true});
  else {ensureShell();renderTray();}
})();
