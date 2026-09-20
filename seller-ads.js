(() => {
  const H=window.HuntCore, runtime=window.BoomRuntime;
  if(!H||!runtime?.getSupabaseClient)return;
  const client=runtime.getSupabaseClient();
  if(!client)return;
  const form=document.querySelector("#hd-seller-ad-form");
  const status=document.querySelector("#hd-seller-ad-status");
  if(!form)return;

  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const body=Object.fromEntries(new FormData(form).entries());
    status.textContent="Sending request…";
    const button=form.querySelector("button[type='submit']");
    const run=runtime?.runAction ? runtime.runAction.bind(runtime) : async (_id,opts)=>opts.execute({});
    try{
      await run("seller.ad.submit",{
        key:String(body.store_id||""),element:button,broadcastSuccess:false,
        execute:async()=>{const {error}=await client.from("merchant_ad_requests").insert({
          store_id:body.store_id,placement_type:body.placement_type,title:String(body.title||"").trim(),
          destination_url:String(body.destination_url||"").trim()||null,notes:String(body.notes||"").trim()
        });if(error)throw error;return true;}
      });
      status.textContent="Placement request received for HUNT review.";
      status.dataset.tone="success";
    }catch(error){
      status.textContent=error.message||"Could not send request.";
      status.dataset.tone="error";
    }
  });
})();