(()=>{
  const runtime=window.BoomRuntime,$=s=>document.querySelector(s);
  const client=runtime?.getSupabaseClient?.(); if(!client)return;
  let session=null;
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  async function loadOrders(){
    const {data,error}=await client.from("hunt_orders").select("id,external_order_id,status,total_amount,currency,placed_at").order("placed_at",{ascending:false}).limit(100);
    if(error)return;
    const sel=$("#return-order");for(const row of data||[]){const o=document.createElement("option");o.value=row.id;o.textContent="#"+String(row.external_order_id||row.id).slice(0,22)+" · "+String(row.status||"");sel.appendChild(o);}
  }
  async function loadReturns(){
    const {data,error}=await client.from("hunt_return_requests").select("id,order_id,reason_code,status,customer_resolution,requested_at").order("requested_at",{ascending:false}).limit(100);
    const host=$("#return-list");if(error){host.innerHTML='<span class="status">Return history is temporarily unavailable.</span>';return;}
    host.innerHTML=(data||[]).length?(data||[]).map(x=>'<div class="service-row"><strong>'+esc(x.reason_code)+'</strong><span>'+esc(x.status)+' · '+esc(x.customer_resolution||"")+' · '+new Date(x.requested_at).toLocaleString()+'</span></div>').join(""):'<span class="status">No return requests yet.</span>';
  }
  async function submit(){
    if(!session){location.href="auth.html?next="+encodeURIComponent("returns.html");return;}
    const orderId=$("#return-order").value,detail=$("#return-detail").value.trim();
    if(!orderId||!detail){$("#return-status").textContent="Choose an order and add return details.";return;}
    $("#return-submit").disabled=true;$("#return-status").textContent="Submitting…";
    const {error}=await client.from("hunt_return_requests").insert({
      user_id:session.user.id,order_id:orderId,reason_code:$("#return-reason").value,
      reason_detail:detail,requested_items:[],status:"requested",customer_resolution:$("#return-resolution").value
    });
    $("#return-submit").disabled=false;
    if(error){$("#return-status").textContent="Could not submit this return request.";return;}
    $("#return-detail").value="";$("#return-status").textContent="Return request submitted for HUNT review.";await loadReturns();
  }
  $("#return-submit").addEventListener("click",submit);
  client.auth.getSession().then(async({data})=>{session=data.session||null;if(!session){$("#return-status").textContent="Sign in to request a return.";return;}$("#return-status").textContent="Signed in as "+(session.user.email||"HUNT customer");await Promise.all([loadOrders(),loadReturns()]);});
})();