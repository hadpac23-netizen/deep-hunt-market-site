(() => {
  "use strict";

  const Mirror=window.BoomMirrorCore;
  const Memory=window.HuntExperienceMemory;
  if(!Mirror)return;

  const $=q=>document.querySelector(q);
  const consent=$("#mirror-consent");
  const retention=$("#mirror-retention");
  const photo=$("#mirror-photo");
  const stage=$("#mirror-photo-stage");
  const clear=$("#mirror-clear");
  const start=$("#mirror-start");
  const type=$("#mirror-product-type");
  const plan=$("#mirror-focus-plan");
  const status=$("#mirror-status");

  let objectUrl=null;
  let activeSession=null;

  function revoke(){
    if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
  }

  function currentConsent(){
    return Mirror.createConsent({
      accepted:Boolean(consent&&consent.checked),
      photo_preview:Boolean(consent&&consent.checked),
      retention:retention?retention.value:"none",
      share_allowed:false
    });
  }

  function updateControls(){
    const allowed=Mirror.validateConsent(currentConsent()).valid;
    if(photo)photo.disabled=!allowed;
    if(start)start.disabled=!allowed||!(photo&&photo.files&&photo.files.length);
    if(!allowed&&status)status.textContent="Waiting for consent.";
  }

  function renderFocus(){
    const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches===true;
    const focus=Mirror.focusPlan(type?type.value:"necklace",{reducedMotion:reduced});
    if(!plan)return;
    if(!focus.valid){plan.innerHTML="<span>Unsupported product type</span>";return;}
    plan.innerHTML=focus.frames.map(function(frame,index){
      return "<span>"+(index+1)+". "+String(frame).replace(/_/g," ")+"</span>";
    }).join("");
  }

  function clearPhoto(){
    revoke();
    if(photo)photo.value="";
    if(stage)stage.innerHTML="<span>Photo stays local in this Alpha.</span>";
    activeSession=null;
    updateControls();
    if(status)status.textContent="Photo cleared. No source photo was stored.";
  }

  function showPhoto(file){
    revoke();
    if(!file||!String(file.type||"").startsWith("image/")){
      clearPhoto();
      if(status)status.textContent="Please choose an image file.";
      return;
    }
    objectUrl=URL.createObjectURL(file);
    if(stage){
      stage.innerHTML="";
      const img=document.createElement("img");
      img.src=objectUrl;
      img.alt="Private local preview";
      stage.appendChild(img);
    }
    if(status)status.textContent="Photo loaded locally. It has not been uploaded or stored.";
    updateControls();
  }

  function startSession(){
    const c=currentConsent();
    const session=Mirror.createSession({consent:c,inputMode:"upload"});
    if(!session.created){
      if(status)status.textContent="Consent is required before starting a preview.";
      return;
    }
    activeSession=session;
    const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches===true;
    const focus=Mirror.focusPlan(type?type.value:"necklace",{reducedMotion:reduced});
    if(Memory&&Memory.record){
      Memory.record({type:"try_on",category:focus.product_type||"",source:"boom-mirror-alpha"});
    }
    if(status){
      status.textContent="Mirror session created. Focus plan: "+(focus.frames||[]).join(" → ")+
        ". AI rendering is not connected yet, so this Alpha stops before generating a try-on image.";
    }
  }

  if(consent)consent.addEventListener("change",updateControls);
  if(retention)retention.addEventListener("change",updateControls);
  if(type)type.addEventListener("change",renderFocus);
  if(photo)photo.addEventListener("change",function(){showPhoto(photo.files&&photo.files[0]||null);});
  if(clear)clear.addEventListener("click",clearPhoto);
  if(start)start.addEventListener("click",startSession);
  window.addEventListener("beforeunload",revoke);

  window.BoomMirrorAlpha=Object.freeze({currentConsent,clearPhoto,getSession:function(){return activeSession;}});
  renderFocus();
  updateControls();
})();
