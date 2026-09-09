(() => {
  const H=window.HuntCore, sb=window.supabase;
  if(!H||!sb?.createClient)return;
  const client=sb.createClient("https://zszlnahjqmwozwubetkm.supabase.co",H.publishableKey);
  const $=q=>document.querySelector(q);
  let session=null;

  function safeHttps(value){
    try{return new URL(value).protocol==="https:";}catch{return false;}
  }

  function productHref(row){
    return `product.html?provider=${encodeURIComponent(row.provider)}&id=${encodeURIComponent(row.item_id)}`;
  }

  function productCard(row){
    const image=row.image_url&&safeHttps(row.image_url)
      ? `<img src="${H.esc(row.image_url)}" alt="${H.esc(row.title||"Product")}" loading="lazy">`
      : '<div class="hd-profile-product-placeholder">H</div>';
    return `<article class="hd-profile-product">
      <a class="hd-profile-product-media" href="${H.esc(productHref(row))}">${image}</a>
      <div class="hd-profile-product-body">
        <a href="${H.esc(productHref(row))}">${H.esc(row.title||"Product")}</a>
        <small>${H.esc(row.provider||"")}</small>
        <div class="hd-profile-product-flags">
          ${row.liked?'<span>♥ Liked</span>':""}
          ${row.saved?'<span>🔖 Saved</span>':""}
        </div>
      </div>
    </article>`;
  }

  function statusLabel(status){
    const map={
      placed:"Order placed",confirmed:"Confirmed",processing:"Processing",
      shipped:"Shipped",out_for_delivery:"Out for delivery",delivered:"Delivered",
      cancelled:"Cancelled",returned:"Returned",refunded:"Refunded",exception:"Delivery issue"
    };
    return map[status]||status||"Unknown";
  }

  function orderCard(order,events){
    const tracking=order.tracking_url&&safeHttps(order.tracking_url)
      ? `<a class="hd-btn" href="${H.esc(order.tracking_url)}" target="_blank" rel="noopener">Carrier tracking →</a>`:"";
    const total=order.total_amount!=null?H.money(Number(order.total_amount),order.currency||"USD"):"";
    const timeline=(events||[]).map(event=>`<li class="${H.esc(event.status)}">
      <i></i><div><strong>${H.esc(event.label||statusLabel(event.status))}</strong>
      <span>${new Date(event.occurred_at).toLocaleString()}${event.location?" · "+H.esc(event.location):""}</span></div>
    </li>`).join("");
    return `<article class="hd-order-card glass">
      <div class="hd-order-head">
        <div><small>${H.esc(order.provider)}</small><h3>${H.esc(statusLabel(order.status))}</h3></div>
        <div><strong>${H.esc(total)}</strong><span>#${H.esc(order.external_order_id)}</span></div>
      </div>
      <div class="hd-order-meta">
        ${order.carrier?`<span>Carrier <strong>${H.esc(order.carrier)}</strong></span>`:""}
        ${order.tracking_number?`<span>Tracking <strong>${H.esc(order.tracking_number)}</strong></span>`:""}
        ${order.estimated_delivery_at?`<span>Estimated <strong>${new Date(order.estimated_delivery_at).toLocaleDateString()}</strong></span>`:""}
      </div>
      ${timeline?`<ol class="hd-order-timeline">${timeline}</ol>`:'<p class="hd-order-no-events">Waiting for the connected provider to report shipment events.</p>'}
      ${tracking}
    </article>`;
  }
  async function loadProfile(){
    const user=session.user;
    const meta=user.user_metadata||{};
    const {data:profile}=await client.from("profiles")
      .select("display_name,username,avatar_url")
      .eq("id",user.id).maybeSingle();

    const name=profile?.display_name||meta.full_name||meta.name||user.email?.split("@")[0]||"HUNT user";
    $("#hd-profile-name").textContent=name;
    $("#hd-profile-email").textContent=user.email||profile?.username||"";
    const avatar=profile?.avatar_url||meta.avatar_url||meta.picture||"";
    const host=$("#hd-profile-avatar");
    if(avatar&&safeHttps(avatar)){
      host.innerHTML=`<img src="${H.esc(avatar)}" alt="">`;
    }else{
      host.textContent=String(name).slice(0,1).toUpperCase();
    }
  }

  async function loadActions(){
    const {data,error}=await client.from("hunt_product_actions")
      .select("provider,item_id,title,image_url,category,liked,saved,liked_at,saved_at,updated_at")
      .order("updated_at",{ascending:false})
      .limit(2000);

    const rows=error?[]:(data||[]);
    const likes=rows.filter(row=>row.liked);
    const saves=rows.filter(row=>row.saved);
    $("#hd-like-count").textContent=String(likes.length);
    $("#hd-save-count").textContent=String(saves.length);
    $("#hd-profile-likes").innerHTML=likes.length?likes.map(productCard).join(""):'<div class="hd-review-empty">No liked products yet. Tap ♡ on any product to add it here.</div>';
    $("#hd-profile-saved").innerHTML=saves.length?saves.map(productCard).join(""):'<div class="hd-review-empty">Nothing saved yet. Tap Save on a product to keep it for later.</div>';
  }

  async function loadOrders(){
    const {data:orders,error}=await client.from("hunt_orders")
      .select("id,provider,external_order_id,status,total_amount,currency,carrier,tracking_number,tracking_url,estimated_delivery_at,placed_at,updated_at")
      .order("placed_at",{ascending:false})
      .limit(200);

    if(error){
      $("#hd-profile-orders").innerHTML='<div class="hd-review-empty">Order tracking is temporarily unavailable.</div>';
      return;
    }

    const rows=orders||[];
    $("#hd-order-count").textContent=String(rows.length);
    if(!rows.length){
      $("#hd-profile-orders").innerHTML='<div class="hd-review-empty">No connected orders yet. Orders will appear here only after a real checkout/provider integration creates them.</div>';
      return;
    }

    const ids=rows.map(x=>x.id);
    const {data:events}=await client.from("hunt_order_events")
      .select("order_id,status,label,location,occurred_at")
      .in("order_id",ids)
      .order("occurred_at",{ascending:true});

    const byOrder=new Map();
    for(const event of events||[]){
      if(!byOrder.has(event.order_id))byOrder.set(event.order_id,[]);
      byOrder.get(event.order_id).push(event);
    }
    $("#hd-profile-orders").innerHTML=rows.map(order=>orderCard(order,byOrder.get(order.id)||[])).join("");
  }
  async function init(){
    const {data}=await client.auth.getSession();
    session=data.session||null;
    if(!session){
      location.replace("auth.html?next="+encodeURIComponent("/deep-hunt-market-site/profile.html"));
      return;
    }
    H.updateCartBadges?.();
    await Promise.all([loadProfile(),loadActions(),loadOrders()]);
  }

  $("#hd-profile-signout")?.addEventListener("click",async()=>{
    await client.auth.signOut();
    location.replace("./");
  });

  window.addEventListener("hunt:shopping-action",()=>loadActions());
  init();
})();