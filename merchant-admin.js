(() => {
  const H=window.HuntCore, sb=window.supabase;
  if(!H||!sb?.createClient)return;
  const SUPABASE_URL="https://zszlnahjqmwozwubetkm.supabase.co";
  const API=SUPABASE_URL+"/functions/v1/hunt-seller-api";
  const client=sb.createClient(SUPABASE_URL,H.publishableKey);
  const $=q=>document.querySelector(q);
  let session=null;

  async function api(path,options={}){
    const res=await fetch(API+path,{
      ...options,
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer "+session.access_token,
        ...(options.headers||{})
      }
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||"Request failed");
    return data;
  }

  function setStatus(text,tone=""){
    const el=$("#hd-merchant-admin-status");
    if(!el)return;
    el.hidden=false;
    el.innerHTML=`<strong>${H.esc(text)}</strong>`;
    el.dataset.tone=tone;
  }

  function actionButtons(kind,id){
    if(kind==="store")return `<div class="hd-admin-actions"><button data-admin-action="approve-store" data-id="${H.esc(id)}">Approve</button><button data-admin-action="reject-store" data-id="${H.esc(id)}">Reject</button></div>`;
    if(kind==="product")return `<div class="hd-admin-actions"><button data-admin-action="approve-product" data-id="${H.esc(id)}">Approve</button><button data-admin-action="reject-product" data-id="${H.esc(id)}">Reject</button></div>`;
    return `<div class="hd-admin-actions"><button data-admin-action="approve-ad" data-id="${H.esc(id)}">Approve</button><button data-admin-action="reject-ad" data-id="${H.esc(id)}">Reject</button></div>`;
  }
  function renderStores(rows){
    $("#hd-admin-store-count").textContent=String(rows.length);
    $("#hd-admin-stores").innerHTML=rows.length?rows.map(store=>`<article>
      <div><strong>${H.esc(store.name)}</strong><small>${H.esc(store.store_type||"store")} · ${H.esc(store.merchant_accounts?.legal_name||"")}</small></div>
      <p>${store.website_url?`<a href="${H.esc(store.website_url)}" target="_blank" rel="noopener">${H.esc(store.website_url)}</a>`:"No website"}</p>
      ${actionButtons("store",store.id)}
    </article>`).join(""):'<p>No pending stores.</p>';
  }

  function renderProducts(rows){
    $("#hd-admin-product-count").textContent=String(rows.length);
    $("#hd-admin-products").innerHTML=rows.length?rows.map(product=>`<article>
      <div><strong>${H.esc(product.title)}</strong><small>${H.esc(product.merchant_stores?.name||"")} · ${H.esc(product.category)}</small></div>
      <p>${product.price_amount!=null?H.money(Number(product.price_amount),product.currency||"USD"):"No price"} · ${H.esc(product.external_id)}</p>
      ${Array.isArray(product.image_urls)&&product.image_urls[0]?`<img class="hd-admin-thumb" src="${H.esc(product.image_urls[0])}" alt="" loading="lazy">`:""}
      ${actionButtons("product",product.id)}
    </article>`).join(""):'<p>No pending products.</p>';
  }

  function renderMedia(rows){
    $("#hd-admin-media-count").textContent=String(rows.length);
    $("#hd-admin-media").innerHTML=rows.length?rows.map(media=>`<article>
      <div><strong>${H.esc(media.source_name||media.provider||"Product video")}</strong><small>${H.esc(media.provider||"")} · ${H.esc(media.item_id||"")}</small></div>
      <p><a href="${H.esc(media.media_url)}" target="_blank" rel="noopener">Open submitted video ↗</a></p>
      ${media.source_url?`<p><a href="${H.esc(media.source_url)}" target="_blank" rel="noopener">Product/source page ↗</a></p>`:""}
      <div class="hd-admin-actions"><button data-admin-action="approve-media" data-id="${H.esc(media.id)}">Verify & approve</button><button data-admin-action="reject-media" data-id="${H.esc(media.id)}">Reject</button></div>
    </article>`).join(""):'<p>No pending product media.</p>';
  }

  function renderAds(rows){
    $("#hd-admin-ad-count").textContent=String(rows.length);
    $("#hd-admin-ads").innerHTML=rows.length?rows.map(req=>`<article>
      <div><strong>${H.esc(req.title)}</strong><small>${H.esc(req.merchant_stores?.name||"")} · ${H.esc(req.placement_type)}</small></div>
      <p>${H.esc(req.notes||"No notes")}</p>
      ${actionButtons("ad",req.id)}
    </article>`).join(""):'<p>No pending placement requests.</p>';
  }
  async function load(){
    const [stores,products,ads,media,approved]=await Promise.all([
      api("/admin/stores?status=pending"),
      api("/admin/products?status=pending_review"),
      api("/admin/ad-requests?status=pending"),
      api("/admin/media?status=pending_review"),
      api("/admin/stores?status=approved")
    ]);
    renderStores(stores.stores||[]);
    renderProducts(products.products||[]);
    renderAds(ads.requests||[]);
    renderMedia(media.media||[]);
    const select=$("#hd-admin-tracking-store");
    select.innerHTML=(approved.stores||[]).map(store=>`<option value="${H.esc(store.id)}">${H.esc(store.name)}</option>`).join("")||'<option value="">No approved stores</option>';
    $("#hd-merchant-admin").hidden=false;
    $("#hd-merchant-admin-status").hidden=true;
  }

  async function moderate(action,id){
    const routes={
      "approve-store":`/admin/stores/${encodeURIComponent(id)}/approve`,
      "reject-store":`/admin/stores/${encodeURIComponent(id)}/reject`,
      "approve-product":`/admin/products/${encodeURIComponent(id)}/approve`,
      "reject-product":`/admin/products/${encodeURIComponent(id)}/reject`,
      "approve-ad":`/admin/ad-requests/${encodeURIComponent(id)}/approve`,
      "reject-ad":`/admin/ad-requests/${encodeURIComponent(id)}/reject`,
      "approve-media":`/admin/media/${encodeURIComponent(id)}/approve`,
      "reject-media":`/admin/media/${encodeURIComponent(id)}/reject`
    };
    const route=routes[action];
    if(!route)return;
    await api(route,{method:"POST"});
    await load();
  }
  document.addEventListener("click",async event=>{
    const button=event.target.closest?.("[data-admin-action]");
    if(!button)return;
    button.disabled=true;
    try{await moderate(button.dataset.adminAction,button.dataset.id);}
    catch(error){setStatus(error.message||"Moderation failed.","error");button.disabled=false;}
  });

  $("#hd-admin-tracking-form")?.addEventListener("submit",async event=>{
    event.preventDefault();
    const body=Object.fromEntries(new FormData(event.currentTarget).entries());
    const storeId=body.store_id;
    delete body.store_id;
    const status=$("#hd-admin-tracking-status");
    status.textContent="Saving…";
    try{
      await api("/admin/stores/"+encodeURIComponent(storeId)+"/tracking",{method:"PATCH",body:JSON.stringify(body)});
      status.textContent="Tracking configuration saved.";
      status.dataset.tone="success";
    }catch(error){
      status.textContent=error.message||"Could not save tracking.";
      status.dataset.tone="error";
    }
  });

  async function init(){
    const {data}=await client.auth.getSession();
    session=data.session||null;
    if(!session){
      location.replace("auth.html?next="+encodeURIComponent("/deep-hunt-market-site/merchant-admin.html"));
      return;
    }
    try{await load();}
    catch(error){setStatus(error.message||"Admin access required.","error");}
  }

  init();
})();