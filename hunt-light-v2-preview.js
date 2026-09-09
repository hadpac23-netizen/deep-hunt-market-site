(()=>{
  "use strict";
  const rewrite = href => {
    if(!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return href;
    try{
      const u=new URL(href,location.href);
      const file=u.pathname.split("/").pop();
      const map={
        "index.html":"hunt-light-v2.html",
        "":"hunt-light-v2.html",
        "category.html":"category-light-v2.html",
        "product.html":"product-light-v2.html",
        "checkout.html":"checkout-light-v2.html"
      };
      if(!Object.prototype.hasOwnProperty.call(map,file)) return href;
      u.pathname=u.pathname.replace(/[^/]*$/,map[file]);
      return u.pathname.split("/").pop()+u.search+u.hash;
    }catch{return href;}
  };
  function apply(root=document){
    root.querySelectorAll?.("a[href]").forEach(a=>{
      const next=rewrite(a.getAttribute("href"));
      if(next) a.setAttribute("href",next);
    });
  }
  apply();
  const obs=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes){
        if(node.nodeType!==1) continue;
        if(node.matches?.("a[href]")){
          const next=rewrite(node.getAttribute("href"));
          if(next) node.setAttribute("href",next);
        }
        apply(node);
      }
    }
  });
  obs.observe(document.documentElement,{childList:true,subtree:true});
  window.HuntLightPreview={rewrite,apply};
})();
