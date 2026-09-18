(() => {
  const reduce=matchMedia("(prefers-reduced-motion: reduce)");
  const SELECTOR=".hd-brand,.hd-footer strong";

  function markup(){
    return [..."HUNT"].map((letter,index)=>
      '<span class="hd-hunt-letter" style="--hunt-letter-index:'+index+'" aria-hidden="true">'+letter+'</span>'
    ).join("")+
      '<span class="hd-hunt-glass" aria-hidden="true">HUNT</span>'+
      '<span class="hd-hunt-star" aria-hidden="true"></span>';
  }

  function activate(el){
    if(reduce.matches){
      el.classList.add("is-signature-active");
      return;
    }
    el.classList.remove("is-signature-active");
    void el.offsetWidth;
    el.classList.add("is-signature-active");
  }

  function upgrade(el){
    if(!el||el.dataset.huntSignature==="1")return;
    const text=(el.textContent||"").replace(/\s+/g,"").toUpperCase();
    if(text!=="HUNT")return;
    el.dataset.huntSignature="1";
    el.classList.add("hd-hunt-signature");
    el.setAttribute("aria-label","HUNT");
    el.setAttribute("dir","ltr");
    el.innerHTML=markup();

    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>.35)){
        observer.disconnect();
        activate(el);
      }
    },{threshold:[.35,.75]});
    observer.observe(el);
  }

  function scan(root=document){
    root.querySelectorAll?.(SELECTOR).forEach(upgrade);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>scan(),{once:true});
  else scan();

  const mo=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes){
        if(node.nodeType!==1)continue;
        if(node.matches?.(SELECTOR))upgrade(node);
        scan(node);
      }
    }
  });
  mo.observe(document.documentElement,{childList:true,subtree:true});

  addEventListener("pageshow",event=>{
    if(!event.persisted)return;
    document.querySelectorAll(".hd-hunt-signature").forEach(activate);
  });

  window.HuntBrandMotion={scan,replay:()=>document.querySelectorAll(".hd-hunt-signature").forEach(activate)};
})();