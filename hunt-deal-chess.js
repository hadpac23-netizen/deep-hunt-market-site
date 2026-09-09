(() => {
  const finite = value => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };
  const text = value => String(value ?? "").trim();
  const evidence = promo => promo?.evidence && typeof promo.evidence === "object" ? promo.evidence : {};
  const truth = () => window.HuntPromotionTruth;

  function readMission() {
    try {
      const value = JSON.parse(localStorage.getItem("hunt_mission_v1") || "null");
      return value && typeof value === "object" ? value : {};
    } catch { return {}; }
  }

  function landedEvidence(promo) {
    const e = evidence(promo);
    const total = finite(e.landed_total ?? e.checkout?.landed_total);
    const currency = text(e.landed_currency ?? e.checkout?.currency ?? promo?.currency).toUpperCase();
    const quantity = finite(e.priced_for_quantity ?? e.checkout?.quantity);
    const complete = e.landed_cost_complete === true || e.checkout?.landed_cost_complete === true;
    return {
      total,
      currency:/^[A-Z]{3}$/.test(currency) ? currency : "",
      quantity:quantity && quantity > 0 ? Math.trunc(quantity) : null,
      complete
    };
  }

  function candidate(promo, mission = readMission()) {
    const T = truth();
    if (!T?.verified?.(promo)) return null;
    const landed = landedEvidence(promo);
    if (!landed.complete || landed.total === null || !landed.currency || !landed.quantity) return null;
    const fit = T.missionFit?.(promo, mission) || {overbuy_required:false,required_cart_quantity:null};
    const needed = Math.max(1, Math.trunc(finite(mission?.quantity) || 1));
    const required = Math.max(needed, Math.trunc(finite(fit.required_cart_quantity) || 0));
    if (landed.quantity !== required) return null;
    return {
      kind:"single",
      ids:[text(promo?.id || promo?.source_offer_id || promo?.title)],
      promos:[promo],
      title:text(promo?.title) || "Verified offer",
      total:landed.total,
      currency:landed.currency,
      quantity:landed.quantity,
      unit_cost:landed.total / landed.quantity,
      overbuy_required:fit.overbuy_required === true,
      checkout_verified:promo?.checkout_verified === true,
      evidence_complete:true
    };
  }
  function stackProof(a,b) {
    const aId=text(a?.id || a?.source_offer_id);
    const bId=text(b?.id || b?.source_offer_id);
    const left=Array.isArray(evidence(a)?.verified_stacks)?evidence(a).verified_stacks:[];
    const right=Array.isArray(evidence(b)?.verified_stacks)?evidence(b).verified_stacks:[];
    return [...left,...right].find(row => {
      if (!row || row.checkout_verified !== true || row.landed_cost_complete !== true) return false;
      const ids=Array.isArray(row.offer_ids)?row.offer_ids.map(text):[];
      return ids.includes(aId) && ids.includes(bId);
    }) || null;
  }

  function combinedCandidate(a,b,mission=readMission()) {
    if (!candidate(a,mission) || !candidate(b,mission)) return null;
    const proof=stackProof(a,b);
    if (!proof) return null;
    const total=finite(proof.landed_total);
    const quantity=finite(proof.priced_for_quantity);
    const currency=text(proof.currency).toUpperCase();
    const needed=Math.max(1,Math.trunc(finite(mission?.quantity)||1));
    if (total===null || !(quantity>0) || quantity < needed || !/^[A-Z]{3}$/.test(currency)) return null;
    return {
      kind:"stack",
      ids:[text(a?.id || a?.source_offer_id),text(b?.id || b?.source_offer_id)],
      promos:[a,b],
      title:[text(a?.title),text(b?.title)].filter(Boolean).join(" + "),
      total,
      currency,
      quantity:Math.trunc(quantity),
      unit_cost:total/quantity,
      overbuy_required:quantity>needed,
      checkout_verified:true,
      evidence_complete:true,
      stack_reference:text(proof.evidence_reference)||null
    };
  }

  function compare(promotions,mission=readMission()) {
    const promos=Array.isArray(promotions)?promotions:[];
    const singles=promos.map(p=>candidate(p,mission)).filter(Boolean);
    const stacks=[];
    for(let i=0;i<promos.length;i++){
      for(let j=i+1;j<promos.length;j++){
        const combo=combinedCandidate(promos[i],promos[j],mission);
        if(combo)stacks.push(combo);
      }
    }
    const all=[...singles,...stacks];
    const currencies=[...new Set(all.map(x=>x.currency))];
    if(currencies.length!==1) {
      return {winner:null,ranked:[],reason:"Comparable verified offers must use one currency.",currencies};
    }
    const ranked=all.sort((a,b)=>{
      if(a.overbuy_required!==b.overbuy_required) return a.overbuy_required?1:-1;
      if(a.total!==b.total) return a.total-b.total;
      return a.unit_cost-b.unit_cost;
    });
    const winner=ranked.find(x=>!x.overbuy_required)||null;
    return {
      winner,
      ranked,
      reason:winner
        ? (winner.kind==="stack" ? "Best checkout-verified combination." : "Best verified landed-cost outcome.")
        : (ranked.length ? "Verified offers exist, but none fit the current mission without overbuy." : "No comparable verified deal has complete landed-cost evidence."),
      currencies
    };
  }

  function explain(result) {
    if (!result?.winner) return result?.reason || "No verified winner yet.";
    const w=result.winner;
    const money=new Intl.NumberFormat("en",{style:"currency",currency:w.currency}).format(w.total);
    const label=w.kind==="stack"?"Verified combination":"Verified offer";
    return label+": "+w.title+" · "+money+" landed for "+w.quantity+" unit"+(w.quantity===1?"":"s")+".";
  }

  window.HuntDealChess={readMission,landedEvidence,candidate,combinedCandidate,compare,explain};
})();
