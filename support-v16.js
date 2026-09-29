(()=>{
  const runtime=window.BoomRuntime,$=s=>document.querySelector(s);
  const client=runtime?.getSupabaseClient?.();
  if(!client)return;
  let session=null;
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  async function loadOrders(){
    const {data}=await client.from("hunt_orders").select("id,external_order_id,status").order("placed_at",{ascending:false}).limit(100);
    const sel=$("#support-order"); for(const row of data||[]){const o=document.createElement("option");o.value=row.id;o.textContent="#"+String(row.external_order_id||row.id).slice(0,24)+" · "+String(row.status||"");sel.appendChild(o);}
  }
  async function loadTickets(){
    const {data,error}=await client.from("hunt_support_tickets").select("id,category,subject,status,priority,created_at").order("created_at",{ascending:false}).limit(100);
    const host=$("#support-list"); if(error){host.innerHTML='<span class="status">Support history is temporarily unavailable.</span>';return;}
    host.innerHTML=(data||[]).length?(data||[]).map(x=>'<div class="service-row"><strong>'+esc(x.subject)+'</strong><span>'+esc(x.category)+' · '+esc(x.status)+' · '+new Date(x.created_at).toLocaleString()+'</span></div>').join(""):'<span class="status">No support requests yet.</span>';
  }
  async function submit(){
    if(!session){location.href="auth.html?next="+encodeURIComponent("support.html");return;}
    const subject=$("#support-subject").value.trim(),message=$("#support-message").value.trim();
    if(!subject||!message){$("#support-status").textContent="Add a subject and message.";return;}
    $("#support-submit").disabled=true;$("#support-status").textContent="Sending…";
    const {error}=await client.from("hunt_support_tickets").insert({
      user_id:session.user.id,customer_email:session.user.email||null,
      order_id:$("#support-order").value||null,category:$("#support-category").value,
      subject,message,priority:"normal",status:"open"
    });
    $("#support-submit").disabled=false;
    if(error){$("#support-status").textContent="Could not send the request.";return;}
    $("#support-subject").value="";$("#support-message").value="";$("#support-status").textContent="Request sent to HUNT support.";await loadTickets();
  }
  $("#support-submit").addEventListener("click",submit);
  client.auth.getSession().then(async({data})=>{session=data.session||null;if(!session){$("#support-status").textContent="Sign in to contact support.";return;}$("#support-status").textContent="Signed in as "+(session.user.email||"HUNT customer");await Promise.all([loadOrders(),loadTickets()]);});
})();