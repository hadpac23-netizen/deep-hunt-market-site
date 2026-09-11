(() => {
  const H=window.HuntCore;
  const $=q=>document.querySelector(q);
  const params=new URLSearchParams(location.search);
  const provider=params.get("provider")||"merchant";
  const id=params.get("id")||"";
  const sid=params.get("sid")||"";
  const src=params.get("src")||"";
  const campaign=params.get("campaign")||"";

  const esc=v=>H?.esc ? H.esc(v) : String(v??"");
  const money=(amount,currency)=>H?.money ? H.money(amount,currency||"USD") : String(amount??"—");

  function allowedOutbound(value){
    try{
      const u=new URL(value);
      const functions=new URL(H.functionsBase);
      return u.protocol==="https:" &&
        u.origin===functions.origin &&
        u.pathname==="/functions/v1/hunt-go";
    }catch{return false;}
  }

  function fail(message){
    const host=$("#hd-handoff-product");
    if(host) host.innerHTML='<div class="hd-handoff-error"><strong>Checkout route unavailable.</strong><p>'+esc(message)+'</p></div>';
    const btn=$("#hd-handoff-continue");
    if(btn){btn.disabled=true;btn.textContent="Partner route unavailable";}
  }

  async function load(){
    if(!H||!id){fail("Missing approved product context.");return;}
    try{
      const data=await H.storefront({provider,product_id:id});
      const product=data?.product;
      if(!product){throw new Error("Approved product not found.");}
      const outbound=String(product.partner_handoff_url||"");
      if(!allowedOutbound(outbound)) throw new Error("Approved partner route could not be verified.");

      const store=product?.store?.name||"partner store";
      const img=product?.images?.[0]||product?.gallery?.[0]||product?.image_url||"";
      const price=Number(product?.price_amount);
      const currency=String(product?.currency||"USD").toUpperCase();
      const host=$("#hd-handoff-product");
      if(host){
        host.innerHTML=(img?'<img src="'+esc(img)+'" alt="'+esc(product.title||"Product")+'">':'<div class="hd-checkout-thumb">◇</div>')+
          '<div><small>'+esc(store)+' · approved partner</small><h2>'+esc(product.title||"Product")+'</h2>'+
          '<p>'+esc(product.description||"Final availability and checkout terms are confirmed by the partner.")+'</p></div>';
      }
      $("#hd-handoff-store").textContent=store;
      $("#hd-handoff-price").textContent=Number.isFinite(price)?money(price,currency):"Final total at partner";
      if(product.affiliate_disclosure) $("#hd-handoff-affiliate").hidden=false;

      const btn=$("#hd-handoff-continue");
      btn.disabled=false;
      btn.textContent="Continue securely with "+store+" →";
      btn.addEventListener("click",()=>{
        const target=new URL(outbound);
        if(sid) target.searchParams.set("sid",sid);
        if(src) target.searchParams.set("src",src);
        else target.searchParams.set("src",location.pathname+location.search);
        if(campaign) target.searchParams.set("campaign",campaign);
        location.assign(target.toString());
      },{once:true});
    }catch{
      fail("This product does not currently have an approved partner checkout route.");
    }
  }

  $("#hd-handoff-back")?.addEventListener("click",()=>history.length>1?history.back():location.assign("./"));
  load();
})();