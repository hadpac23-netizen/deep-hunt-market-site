(() => {
  const missionKey="hunt_mission_v1";
  const text=value=>String(value??"").trim();
  const truth=()=>window.HuntPromotionTruth;

  function readMission(){
    try{
      const value=JSON.parse(localStorage.getItem(missionKey)||"null");
      return value && typeof value==="object" ? value : {};
    }catch{return {};}
  }

  function evidenceFlag(promo,key){
    const evidence=promo?.evidence||{};
    const comparison=evidence?.comparison||{};
    return evidence?.[key]===true || comparison?.[key]===true;
  }

  function evaluate(promo,mission=readMission()){
    const T=truth();
    const active=T?.active?.(promo)===true;
    const verified=T?.verified?.(promo)===true;
    const fit=T?.missionFit?.(promo,mission)||{overbuy_required:false,required_cart_quantity:null};
    const checkout=promo?.checkout_verified===true;
    const landed=evidenceFlag(promo,"landed_cost_complete");
    const best=evidenceFlag(promo,"best_verified_option");
    const alternativeBetter=evidenceFlag(promo,"alternative_better");

    let verdict="WAIT";
    let reason="More evidence is needed before BOOM recommends buying.";
    if(!active){
      verdict="SKIP";
      reason="The promotion is not active.";
    }else if(!verified || !checkout){
      verdict="WAIT";
      reason="Checkout verification is still incomplete.";
    }else if(fit.overbuy_required){
      verdict="WAIT";
      reason="The promotion requires more units than the current HUNT Mission needs.";
    }else if(alternativeBetter){
      verdict="SWITCH";
      reason="A verified alternative currently produces a better outcome.";
    }else if(!landed){
      verdict="WAIT";
      reason="The promotion works, but full landed cost is still incomplete.";
    }else if(best){
      verdict="BUY";
      reason="Checkout, landed cost and comparison evidence support this option.";
    }else{
      verdict="WAIT";
      reason="The promotion is verified, but BOOM has not proved it is the best verified option.";
    }

    return {
      verdict,reason,active,verified,checkout,
      landed_cost_complete:landed,
      best_verified_option:best,
      alternative_better:alternativeBetter,
      mission_fit:fit,
      expires_at:text(promo?.ends_at)||null
    };
  }

  function html(promo,mission=readMission()){
    const H=window.HuntCore;
    if(!H)return "";
    const result=evaluate(promo,mission);
    const fit=result.mission_fit||{};
    const expiry=result.expires_at ? new Date(result.expires_at).toLocaleDateString() : "Open";
    const missionText=fit.overbuy_required
      ? `Needs ${fit.required_cart_quantity} units · mission needs fewer`
      : (fit.required_cart_quantity ? `Requires ${fit.required_cart_quantity} units` : "No quantity conflict found");
    const yesNo=value=>value?"YES":"PENDING";
    return `<aside class="hd-deal-passport" aria-label="HUNT Deal Passport">
      <div class="hd-deal-passport-head">
        <small>DEAL PASSPORT</small>
        <strong class="hd-deal-verdict ${H.esc(result.verdict.toLowerCase())}">${H.esc(result.verdict)}</strong>
      </div>
      <p>${H.esc(result.reason)}</p>
      <div class="hd-deal-passport-grid">
        <span><b>Checkout</b><em>${H.esc(yesNo(result.checkout))}</em></span>
        <span><b>Mission fit</b><em>${H.esc(missionText)}</em></span>
        <span><b>Landed cost</b><em>${H.esc(yesNo(result.landed_cost_complete))}</em></span>
        <span><b>Comparison</b><em>${H.esc(result.best_verified_option?"BEST VERIFIED":result.alternative_better?"BETTER ALTERNATIVE":"PENDING")}</em></span>
        <span><b>Expiry</b><em>${H.esc(expiry)}</em></span>
      </div>
    </aside>`;
  }

  window.HuntDealPassport={readMission,evaluate,html};
})();
