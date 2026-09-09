(() => {
  const H=window.HuntCore;
  const sb=window.supabase;
  if(!H||!sb?.createClient)return;

  const SUPABASE_URL="https://zszlnahjqmwozwubetkm.supabase.co";
  const API_BASE=SUPABASE_URL+"/functions/v1/hunt-seller-api";
  const client=sb.createClient(SUPABASE_URL,H.publishableKey);
  const $=q=>document.querySelector(q);
  let session=null;
  let dashboard={accounts:[],stores:[]};

  const categories=[
    "women","men","dresses","tops","bottoms","hoodies","jackets","knitwear","activewear","swimwear","socks",
    "bags","shoes","hats","accessories","jewelry","beauty","perfume","home","kitchen","storage","bedding","bath",
    "lighting","cleaning","pillows","blankets","wallart","drinkware","tech","phoneaccessories","gaming","sports",
    "outdoors","travel","kids","toys","pets","gifts","party","crafts","ornaments","stickers","stationery","office"
  ];

  function setStatus(selector,text,tone=""){
    const el=$(selector); if(!el)return;
    el.textContent=text||"";
    el.dataset.tone=tone;
  }

  async function api(path,options={}){
    if(!session?.access_token)throw new Error("Sign in required");
    const res=await fetch(API_BASE+path,{
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

  function statusBadge(value){
    const safe=H.esc(value||"pending");
    return `<span class="hd-merchant-status ${safe}">${safe.replaceAll("_"," ")}</span>`;
  }

  function approvedStores(){
    return (dashboard.stores||[]).filter(s=>s.status==="approved");
  }

  function storeOptions(includePending=false){
    const rows=includePending?(dashboard.stores||[]):approvedStores();
    return rows.map(s=>`<option value="${H.esc(s.id)}">${H.esc(s.name)} · ${H.esc(s.status)}</option>`).join("");
  }  function renderStores(){
    const host=$("#hd-seller-stores");
    if(!host)return;
    const rows=dashboard.stores||[];
    host.innerHTML=rows.length?rows.map(store=>`<article class="hd-seller-store glass">
      <div><small>${H.esc(store.store_type||"store")}</small><h3>${H.esc(store.name)}</h3></div>
      ${statusBadge(store.status)}
      <p>${store.website_url?`<a href="${H.esc(store.website_url)}" target="_blank" rel="noopener">${H.esc(store.website_url)}</a>`:"No website supplied"}</p>
      <small>${store.status==="approved"?"API and product submission are enabled.":"Waiting for HUNT review before products or API keys can activate."}</small>
    </article>`).join(""):'<div class="hd-review-empty">No stores yet.</div>';

    const approved=approvedStores();
    ["#hd-product-store","#hd-key-store","#hd-ad-store"].forEach(selector=>{
      const el=$(selector);
      if(!el)return;
      el.innerHTML=approved.length?storeOptions(false):'<option value="">No approved stores yet</option>';
      el.disabled=!approved.length;
    });
    ["#hd-seller-product-form button[type=submit]","#hd-seller-key-form button[type=submit]","#hd-seller-ad-form button[type=submit]"].forEach(selector=>{
      const el=$(selector);
      if(el)el.disabled=!approved.length;
    });
    if(approved[0])loadProducts(approved[0].id);
  }

  function renderDashboard(){
    const hasAccount=(dashboard.accounts||[]).length>0;
    $("#hd-seller-application").hidden=hasAccount;
    $("#hd-seller-dashboard").hidden=!hasAccount;
    if(hasAccount)renderStores();
  }

  async function loadDashboard(){
    dashboard=await api("/dashboard");
    renderDashboard();
  }
  async function loadProducts(storeId){
    const host=$("#hd-seller-products");
    if(!host||!storeId)return;
    host.innerHTML="<p>Loading products…</p>";
    try{
      const data=await api("/dashboard/products?store_id="+encodeURIComponent(storeId));
      const rows=data.products||[];
      host.innerHTML=rows.length?rows.map(product=>`<article>
        <div><strong>${H.esc(product.title)}</strong><small>${H.esc(product.external_id)} · ${H.esc(product.category)}</small></div>
        <div>${statusBadge(product.status)}<small>${product.price_amount!=null?H.money(Number(product.price_amount),product.currency||"USD"):"Price not supplied"}</small></div>
      </article>`).join(""):"<p>No products submitted yet.</p>";
    }catch(error){
      host.innerHTML=`<p>${H.esc(error.message||"Could not load products.")}</p>`;
    }
  }

  function bind(){
    const category=$("#hd-product-category");
    if(category){
      category.innerHTML=categories.map(slug=>`<option value="${slug}">${H.esc(H.categoryDefs?.[slug]?.title||slug)}</option>`).join("");
    }

    $("#hd-seller-apply-form")?.addEventListener("submit",async event=>{
      event.preventDefault();
      const form=new FormData(event.currentTarget);
      setStatus("#hd-seller-apply-status","Submitting…");
      try{
        await api("/dashboard/apply",{method:"POST",body:JSON.stringify(Object.fromEntries(form.entries()))});
        setStatus("#hd-seller-apply-status","Application received. HUNT review is required before activation.","success");
        await loadDashboard();
      }catch(error){
        setStatus("#hd-seller-apply-status",error.message||"Could not submit application.","error");
      }
    });
    $("#hd-seller-product-form")?.addEventListener("submit",async event=>{
      event.preventDefault();
      const form=new FormData(event.currentTarget);
      const body=Object.fromEntries(form.entries());
      body.image_urls=String(body.image_urls||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
      if(body.price_amount==="")body.price_amount=null;
      if(body.inventory_quantity==="")body.inventory_quantity=null;
      setStatus("#hd-seller-product-status","Submitting product…");
      try{
        await api("/dashboard/products",{method:"POST",body:JSON.stringify(body)});
        setStatus("#hd-seller-product-status","Product received and queued for HUNT review.","success");
        await loadProducts(body.store_id);
      }catch(error){
        setStatus("#hd-seller-product-status",error.message||"Could not submit product.","error");
      }
    });

    $("#hd-product-store")?.addEventListener("change",event=>loadProducts(event.target.value));

    $("#hd-seller-key-form")?.addEventListener("submit",async event=>{
      event.preventDefault();
      const body=Object.fromEntries(new FormData(event.currentTarget).entries());
      setStatus("#hd-seller-key-status","Creating key…");
      try{
        const data=await api("/dashboard/keys",{method:"POST",body:JSON.stringify(body)});
        $("#hd-seller-api-key").textContent=data.api_key;
        $("#hd-seller-key-result").hidden=false;
        setStatus("#hd-seller-key-status","API key created. It is shown only once.","success");
      }catch(error){
        setStatus("#hd-seller-key-status",error.message||"Could not create key.","error");
      }
    });

    $("#hd-copy-api-key")?.addEventListener("click",async()=>{
      const value=$("#hd-seller-api-key")?.textContent||"";
      if(value)await navigator.clipboard.writeText(value);
      setStatus("#hd-seller-key-status","Copied to clipboard.","success");
    });
  }

  async function init(){
    const {data}=await client.auth.getSession();
    session=data.session||null;
    $("#hd-seller-signed-out").hidden=Boolean(session);
    if(!session)return;
    bind();
    try{
      await loadDashboard();
    }catch(error){
      $("#hd-seller-application").hidden=false;
      setStatus("#hd-seller-apply-status",error.message||"Could not load seller dashboard.","error");
    }
  }

  init();
})();