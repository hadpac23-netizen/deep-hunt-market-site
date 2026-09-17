(() => {
  "use strict";
  const H=window.HuntCore;
  const Memory=window.HuntExperienceMemory;
  if(!H||!Memory)return;
  const $=q=>document.querySelector(q);
  let shoppingRows=[];

  const esc=v=>H.esc(String(v??""));
  const safeImage=v=>/^https:\/\//i.test(String(v||""));

  function productHref(row){
    if(row.url)return row.url;
    return row.provider&&row.item_id
      ? "product.html?provider="+encodeURIComponent(row.provider)+"&id="+encodeURIComponent(row.item_id)
      : "#";
  }

  function eventCard(row){
    const label=String(row.type||"activity").replace(/_/g," ");
    const time=new Date(row.ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    const title=row.title||row.category||row.world||label;
    const href=productHref(row);
    return '<a class="hunt-history-event" href="'+esc(href)+'"><div><small>'+esc(label.toUpperCase())+'</small><strong>'+esc(title)+'</strong></div><span>'+esc(time)+'</span></a>';
  }

  function productCard(row){
    const href=productHref(row);
    const media=safeImage(row.image_url)
      ? '<img src="'+esc(row.image_url)+'" alt="'+esc(row.title||"Product")+'" loading="lazy">'
      : '<div class="hunt-history-placeholder">H</div>';
    return '<article class="hunt-history-product"><a class="hunt-history-media" href="'+esc(href)+'">'+media+'</a><div><a href="'+esc(href)+'">'+esc(row.title||"Product")+'</a><small>'+esc(row.provider||"")+'</small></div></article>';
  }

  function render(){
    const groups=Memory.historyGroups();
    $("#hunt-history-today").innerHTML=groups.today.length?groups.today.slice(0,40).map(eventCard).join(""):'<p class="hunt-history-empty">Nothing here yet.</p>';
    $("#hunt-history-yesterday").innerHTML=groups.yesterday.length?groups.yesterday.slice(0,30).map(eventCard).join(""):'<p class="hunt-history-empty">No activity yesterday.</p>';
    $("#hunt-history-week").innerHTML=groups.this_week.length?groups.this_week.slice(0,50).map(eventCard).join(""):'<p class="hunt-history-empty">No earlier activity this week.</p>';

    const liked=shoppingRows.filter(x=>x.liked);
    const saved=shoppingRows.filter(x=>x.saved);
    $("#hunt-history-liked").innerHTML=liked.length?liked.slice(0,24).map(productCard).join(""):'<p class="hunt-history-empty">No liked products yet.</p>';
    $("#hunt-history-saved").innerHTML=saved.length?saved.slice(0,24).map(productCard).join(""):'<p class="hunt-history-empty">No saved products yet.</p>';
  }

  window.addEventListener("hunt:shopping-state",event=>{
    shoppingRows=Array.isArray(event.detail?.rows)?event.detail.rows:[];
    render();
  });
  window.addEventListener("hunt:experience-event",render);
  window.addEventListener("hunt:memory-reset",render);

  let resetArmed=false,resetTimer=null;
  $("#hunt-history-reset")?.addEventListener("click",event=>{
    const btn=event.currentTarget;
    if(!resetArmed){
      resetArmed=true;
      btn.textContent="Press again to reset memory";
      resetTimer=setTimeout(()=>{resetArmed=false;btn.textContent="Reset HUNT Memory";},5000);
      return;
    }
    clearTimeout(resetTimer);
    Memory.clear();
    resetArmed=false;
    btn.textContent="HUNT Memory reset";
    setTimeout(()=>{btn.textContent="Reset HUNT Memory";},1800);
  });

  shoppingRows=window.HuntShoppingActions?.snapshot?.()||[];
  render();
})();