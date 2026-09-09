(() => {
  const H=window.HuntCore, sb=window.supabase;
  if(!H||!sb?.createClient)return;
  const client=sb.createClient("https://zszlnahjqmwozwubetkm.supabase.co",H.publishableKey);
  const form=document.querySelector("#hd-seller-ad-form");
  const status=document.querySelector("#hd-seller-ad-status");
  if(!form)return;

  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const body=Object.fromEntries(new FormData(form).entries());
    status.textContent="Sending request…";
    const {error}=await client.from("merchant_ad_requests").insert({
      store_id:body.store_id,
      placement_type:body.placement_type,
      title:String(body.title||"").trim(),
      destination_url:String(body.destination_url||"").trim()||null,
      notes:String(body.notes||"").trim()
    });
    if(error){
      status.textContent=error.message||"Could not send request.";
      status.dataset.tone="error";
      return;
    }
    status.textContent="Placement request received for HUNT review.";
    status.dataset.tone="success";
  });
})();