(() => {
  "use strict";
  const runtime=window.BoomRuntime;
  const form=document.getElementById("hd-checkout-shipping-form");
  const saveBtn=document.getElementById("hd-save-delivery");
  const forgetBtn=document.getElementById("hd-forget-delivery");
  const status=document.getElementById("hd-saved-delivery-status");
  if(!runtime||!form||!saveBtn||!forgetBtn||!status)return;

  const client=runtime.getSupabaseClient?.();
  if(!client)return;

  const fieldMap={
    recipient_name:"hd-ship-name",
    email:"hd-ship-email",
    address_line1:"hd-ship-address",
    address_line2:"hd-ship-address2",
    city:"hd-ship-city",
    region:"hd-ship-province",
    postal_code:"hd-ship-zip",
    phone:"hd-ship-phone"
  };
  const read=id=>String(document.getElementById(id)?.value||"").trim();
  const country=()=>String(document.getElementById("hd-checkout-market")?.value||"").toUpperCase();

  const setStatus=(message,tone="")=>{
    status.textContent=message||"";
    status.dataset.tone=tone;
  };
  const writeIfEmpty=(id,value)=>{
    const el=document.getElementById(id);
    if(el&&!String(el.value||"").trim())el.value=String(value||"");
  };
  function payload(user){
    return {
      user_id:user.id,
      label:"default",
      recipient_name:read(fieldMap.recipient_name).slice(0,80),
      email:read(fieldMap.email).slice(0,254)||null,
      address_line1:read(fieldMap.address_line1).slice(0,160),
      address_line2:read(fieldMap.address_line2).slice(0,160)||null,
      city:read(fieldMap.city).slice(0,80),
      region:read(fieldMap.region).slice(0,80)||null,
      postal_code:read(fieldMap.postal_code).slice(0,20)||null,
      country_code:country(),
      phone:read(fieldMap.phone).slice(0,30)||null,
      is_default:true,
      updated_at:new Date().toISOString()
    };
  }

  async function load(session){
    const user=session?.user;
    const connected=Boolean(user);
    saveBtn.hidden=!connected;
    forgetBtn.hidden=!connected;
    if(!connected){
      setStatus("Sign in to save delivery details securely to your HUNT account.");
      return;
    }
    const {data,error}=await client.from("hunt_saved_addresses")
      .select("recipient_name,email,address_line1,address_line2,city,region,postal_code,country_code,phone")
      .eq("user_id",user.id)
      .eq("label","default")
      .maybeSingle();
    if(error){
      if(String(error.code||"")==="42P01"){
        setStatus("Saved delivery details are prepared but account storage is not activated yet.");
        return;
      }
      setStatus("Saved delivery details are temporarily unavailable.","error");
      return;
    }
    if(!data){
      setStatus("You can save these delivery details to your HUNT account.");
      return;
    }

    for(const [key,id] of Object.entries(fieldMap))writeIfEmpty(id,data[key]);
    const market=document.getElementById("hd-checkout-market");
    if(market&&data.country_code&&[...market.options].some(o=>o.value===data.country_code)){
      market.value=data.country_code;
    }
    setStatus("Saved delivery details loaded from your HUNT account.","ok");
    form.dispatchEvent(new Event("change",{bubbles:true}));
  }

  saveBtn.addEventListener("click",async()=>{
    const session=await runtime.sessionReady?.();
    if(!session?.user){
      setStatus("Sign in before saving delivery details.","error");
      return;
    }
    const p=payload(session.user);
    if(!p.recipient_name||!p.address_line1||!p.city||!p.country_code){
      setStatus("Add your name, address and city before saving.","error");
      return;
    }
    saveBtn.disabled=true;
    setStatus("Saving delivery details…");

    try{
      const {error}=await client.from("hunt_saved_addresses")
        .upsert(p,{onConflict:"user_id,label"});
      if(error)throw error;
      setStatus("Delivery details saved to your HUNT account.","ok");
    }catch(error){
      setStatus(String(error?.code||"")==="42P01"
        ?"Account storage is not activated yet."
        :"Could not save delivery details right now.","error");
    }finally{
      saveBtn.disabled=false;
    }
  });

  forgetBtn.addEventListener("click",async()=>{
    const session=await runtime.sessionReady?.();
    if(!session?.user)return;
    forgetBtn.disabled=true;
    try{
      const {error}=await client.from("hunt_saved_addresses")
        .delete()
        .eq("user_id",session.user.id)
        .eq("label","default");
      if(error)throw error;

      setStatus("Saved delivery details removed.","ok");
    }catch{
      setStatus("Could not remove saved delivery details right now.","error");
    }finally{
      forgetBtn.disabled=false;
    }
  });

  runtime.subscribeSession?.(session=>load(session),{immediate:true});
})();
