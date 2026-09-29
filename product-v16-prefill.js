(()=>{
  const q=new URLSearchParams(location.search);
  const aliasMap={h1:"CJdropshipping",h2:"EPROLO",h3:"Printful",h4:"Gooten"};
  const provider=q.get("provider")||aliasMap[q.get("src")]||"";
  const id=q.get("id")||"";
  const key="hunt_product_"+provider+":"+id;
  let p=null;
  try{p=JSON.parse(sessionStorage.getItem(key)||"null")}catch{}
  const $=s=>document.querySelector(s);
  if(!id){
    $("#hd-product-loading").hidden=true;
    $("#hd-product-layout").hidden=true;
    $("#hd-product-error").hidden=false;
    $("#hd-product-error-copy").textContent="This product link is missing its product id.";
    return;
  }
  if(!p)return;
  const n=Number(p.target_retail_usd ?? p.profit_truth?.target_retail_usd ?? p.retail_price_usd ?? p.price_amount ?? p.price);
  $("#hd-product-title").textContent=p.title||"Product";
  $("#hd-product-breadcrumb").textContent=p.title||"Product";
  $("#hd-product-main-image").src=p.image_url||"";
  $("#hd-product-main-image").alt=p.title||"Product";
  if(Number.isFinite(n)&&n>0)$("#hd-product-price").textContent=new Intl.NumberFormat("en-US",{style:"currency",currency:String(p.retail_currency||"USD"),maximumFractionDigits:n>=100?0:2}).format(n);
  else $("#hd-product-price").textContent="Price being confirmed";
  $("#hd-product-stock").textContent="Product loaded";
  $("#hd-product-description").textContent=p.description||"Full product details are being refreshed.";
  $("#hd-product-loading").hidden=true;
  $("#hd-product-layout").hidden=false;
})();