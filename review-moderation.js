(() => {
  const H=window.HuntCore;
  const sb=window.supabase;
  if(!H||!sb?.createClient)return;
  const client=sb.createClient("https://zszlnahjqmwozwubetkm.supabase.co",H.publishableKey);
  const $=q=>document.querySelector(q);

  function setStatus(text,tone=""){
    const el=$("#hd-mod-status");
    if(!el)return;
    el.hidden=false;
    el.innerHTML=`<strong>${H.esc(text)}</strong>`;
    el.dataset.tone=tone;
  }

  function publicImage(path){
    return client.storage.from("hunt-review-images").getPublicUrl(path).data.publicUrl;
  }

  function card(row){
    const photos=Array.isArray(row.image_paths)?row.image_paths:[];
    const productUrl=`product.html?provider=${encodeURIComponent(row.provider)}&id=${encodeURIComponent(row.item_id)}#reviews`;
    return `<article class="hd-mod-card glass" data-review-id="${H.esc(row.id)}">
      <div class="hd-mod-card-head">
        <div><strong>${"★".repeat(Number(row.rating)||0)}${"☆".repeat(5-(Number(row.rating)||0))}</strong><small>${H.esc(row.provider)} · ${H.esc(row.item_id)}</small></div>
        <a href="${H.esc(productUrl)}" target="_blank" rel="noopener">Open product</a>
      </div>
      ${row.comment?`<p>${H.esc(row.comment)}</p>`:""}
      <div class="hd-mod-photos">${photos.map(path=>`<a href="${H.esc(publicImage(path))}" target="_blank" rel="noopener"><img src="${H.esc(publicImage(path))}" alt="Pending review photo"></a>`).join("")}</div>
      <div class="hd-mod-actions"><button type="button" data-review-action="approve">Approve</button><button type="button" data-review-action="reject">Reject</button></div>
    </article>`;
  }

  async function load(){
    const {data:{session}}=await client.auth.getSession();
    if(!session?.user){
      location.replace("auth.html?next="+encodeURIComponent("/deep-hunt-market-site/review-moderation.html"));
      return;
    }

    const {data:profile,error:profileError}=await client.from("profiles").select("is_admin").eq("id",session.user.id).single();
    if(profileError||!profile?.is_admin){
      setStatus("Admin access required.","error");
      return;
    }

    const {data,error}=await client.from("product_reviews")
      .select("id,provider,item_id,rating,comment,image_paths,status,created_at")
      .eq("status","pending")
      .order("created_at",{ascending:true})
      .limit(200);

    if(error){setStatus(error.message||"Could not load pending reviews.","error");return;}
    const rows=Array.isArray(data)?data:[];
    $("#hd-mod-count").textContent=`${rows.length} pending`;
    const list=$("#hd-mod-list");
    list.hidden=false;
    list.innerHTML=rows.length?rows.map(card).join(""):'<div class="hd-review-empty">No reviews are waiting for moderation.</div>';
    $("#hd-mod-status").hidden=true;
  }  document.addEventListener("click",async event=>{
    const button=event.target.closest?.("[data-review-action]");
    if(!button)return;
    const cardEl=button.closest("[data-review-id]");
    const id=cardEl?.dataset.reviewId;
    const action=button.dataset.reviewAction;
    if(!id||!["approve","reject"].includes(action))return;
    button.disabled=true;
    const nextStatus=action==="approve"?"published":"rejected";
    const {error}=await client.from("product_reviews").update({status:nextStatus}).eq("id",id);
    if(error){button.disabled=false;setStatus(error.message||"Moderation failed.","error");return;}
    cardEl.remove();
    const remaining=document.querySelectorAll("[data-review-id]").length;
    $("#hd-mod-count").textContent=`${remaining} pending`;
    if(!remaining)$("#hd-mod-list").innerHTML='<div class="hd-review-empty">No reviews are waiting for moderation.</div>';
  });

  load();
})();