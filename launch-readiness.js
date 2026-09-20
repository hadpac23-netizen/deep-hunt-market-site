(() => {
  const H=window.HuntCore,sb=window.supabase;
  if(!H||!sb?.createClient)return;
  const BASE="https://zszlnahjqmwozwubetkm.supabase.co";
  const client=sb.createClient(BASE,H.publishableKey);
  const $=q=>document.querySelector(q);
  let session=null,gates=[],filter="ALL";

  function status(text,tone=""){const el=$("#lr-status");if(!el)return;el.hidden=false;el.dataset.tone=tone;el.innerHTML="<strong>"+H.esc(text)+"</strong>"}
  function stateCard(id,state){const el=$(id);if(el)el.dataset.state=state||""}
  function pretty(v){return JSON.stringify(v,null,2)}
  function blockers(g){
    const out=[];
    if(g.blocks_soft_launch)out.push("blocks soft");
    if(g.blocks_real_money)out.push("blocks money");
    return out;
  }
  function render(){
    const rows=filter==="ALL"?gates:gates.filter(g=>g.status===filter);
    $("#lr-grid").innerHTML=rows.length?rows.map(g=>{
      const tags=blockers(g).map(x=>"<span>"+H.esc(x)+"</span>").join("");
      return '<article class="lr-card" data-status="'+H.esc(g.status)+'">'+
        '<div class="lr-card-head"><div><small>'+H.esc(String(g.gate_group||"gate").toUpperCase())+'</small><h3>'+H.esc(g.title||g.gate_key)+'</h3></div><span class="lr-badge">'+H.esc(g.status)+'</span></div>'+
        '<div class="lr-blockers">'+tags+'</div>'+
        '<div class="lr-next"><strong>Next action</strong>'+H.esc(g.next_action||"No action documented.")+'</div>'+
        '<details class="lr-evidence"><summary>Evidence</summary><pre>'+H.esc(pretty(g.evidence||{}))+'</pre></details>'+
        '<div class="lr-source">Source: '+H.esc(g.source||"runtime HUNT evidence")+' · observed '+H.esc(g.observed_at?new Date(g.observed_at).toLocaleString():"now")+'</div>'+
      '</article>';
    }).join(""):'<div class="lr-empty">No gates in this filter.</div>';
  }
  document.addEventListener("click",e=>{
    const b=e.target.closest?.("[data-filter]");if(!b)return;
    filter=b.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));
    render();
  });
  async function load(){
    const res=await fetch(BASE+"/functions/v1/hunt-launch-readiness",{headers:{apikey:H.publishableKey,Authorization:"Bearer "+session.access_token},cache:"no-store"});
    const data=await res.json().catch(()=>({}));
    if(!res.ok||data?.ok!==true)throw new Error(data.error||"Launch readiness failed");
    gates=data.gates||[];
    const s=data.summary||{},c=s.gate_counts||{};
    $("#lr-soft").textContent=s.soft_launch_status||"—";
    $("#lr-money").textContent=s.real_money_status||"—";
    $("#lr-paid").textContent=s.paid_marketing_status||"—";
    stateCard("#lr-soft-card",s.soft_launch_status);
    stateCard("#lr-money-card",s.real_money_status);
    stateCard("#lr-paid-card",s.paid_marketing_status);
    $("#lr-soft-copy").textContent=(s.soft_blockers||[]).length+" blocking gates";
    $("#lr-money-copy").textContent=(s.real_money_blockers||[]).length+" blocking gates";
    $("#lr-paid-copy").textContent=(s.verified_economics_pass||0)+" verified economics PASS";
    $("#lr-pass").textContent=c.PASS||0;$("#lr-partial").textContent=c.PARTIAL||0;$("#lr-fail").textContent=c.FAIL||0;$("#lr-hold").textContent=c.HOLD||0;
    render();
  }
  async function init(){
    const auth=await client.auth.getSession();session=auth.data.session||null;
    if(!session){location.replace("auth.html?next="+encodeURIComponent("/deep-hunt-market-site/launch-readiness.html"));return}
    const p=await client.from("profiles").select("is_admin").eq("id",session.user.id).maybeSingle();
    if(!p.data?.is_admin){status("Owner/admin access required.","error");return}
    $("#lr-app").hidden=false;$("#lr-status").hidden=true;
    try{await load()}catch(e){status(e.message||"Could not load launch readiness.","error")}
  }
  init();
})();