import { PAYPLUS_STATUS_PROOF, proofReadiness } from "../_shared/payplus-status-proof.mjs";

const BASE=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";

const ALLOWED=new Set([
  "https://deep-hunt-market.netlify.app",
  "https://hadpac23-netizen.github.io",
  "http://127.0.0.1:18977",
  "http://localhost:18977"
]);

function cors(req){
  const origin=req.headers.get("origin")||"";
  const preview=/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  return {
    "Access-Control-Allow-Origin":(ALLOWED.has(origin)||preview)?origin:"https://deep-hunt-market.netlify.app",
    "Access-Control-Allow-Headers":"apikey, authorization, content-type",
    "Access-Control-Allow-Methods":"GET, OPTIONS",
    "Vary":"Origin"
  };
}
function json(req,data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store",...cors(req)}});
}
async function rest(path){
  const r=await fetch(BASE+"/rest/v1/"+path,{headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});
  const t=await r.text();const d=t?JSON.parse(t):null;
  if(!r.ok)throw new Error(d?.message||d?.error||("REST_"+r.status));return d;
}
async function adminUser(req){
  const auth=req.headers.get("authorization")||"";
  const token=auth.startsWith("Bearer ")?auth.slice(7).trim():"";
  if(!token)return null;
  const u=await fetch(BASE+"/auth/v1/user",{headers:{apikey:SERVICE,Authorization:"Bearer "+token}});
  if(!u.ok)return null;
  const user=await u.json();if(!user?.id)return null;
  const p=await rest("profiles?id=eq."+encodeURIComponent(user.id)+"&select=is_admin&limit=1");
  return p?.[0]?.is_admin===true?user:null;
}
function n(v,d=0){const x=Number(v);return Number.isFinite(x)?x:d}
function gate(key,title,status,soft,real,evidence,nextAction,group="runtime"){
  return {gate_key:key,title,status,blocks_soft_launch:soft,blocks_real_money:real,evidence,next_action:nextAction,gate_group:group,observed_at:new Date().toISOString()};
}
function rankStatus(s){return s==="FAIL"?3:s==="PARTIAL"?2:s==="HOLD"?1:0}
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="GET")return json(req,{error:"method not allowed"},405);
  if(!BASE||!SERVICE)return json(req,{error:"server config missing"},500);
  if(!(await adminUser(req)))return json(req,{error:"Admin access required"},403);
  try{
    const [evidence,paymentSessions,orders,orderEvents,paymentEvents,payplusObservations,analytics,econ,merchantPrograms,runtimeControls,businessIdentityRows,legalDocs]=await Promise.all([
      rest("hunt_launch_readiness_evidence?select=*&order=gate_group.asc,gate_key.asc"),
      rest("hunt_payment_sessions?select=id,status,mode,country_code,total_amount,commerce_snapshot,created_at&order=created_at.desc&limit=100"),
      rest("hunt_orders?select=id,status,total_amount,currency,placed_at,updated_at&order=updated_at.desc&limit=100"),
      rest("hunt_order_events?select=id,status,label,created_at&order=created_at.desc&limit=200"),
      rest("hunt_payment_events?select=id,event_type,created_at&order=created_at.desc&limit=200"),
      rest("hunt_payplus_status_observations?select=payment_session_id,environment,charge_method,provider_status,provider_code,mapping_state,signature_verified,ipn_full_verified,accepted_paid,created_at&order=created_at.desc&limit=200"),
      rest("analytics_events?event_type=like.hunt_%25&select=id,event_type,created_at&order=created_at.desc&limit=5000"),
      rest("hunt_unit_economics?select=id,inputs_verified,profit_gate_status,contribution_before_coupon,contribution_margin,max_safe_cac,calculated_at&order=calculated_at.desc&limit=1000"),
      rest("merchant_program_versions?select=version,status,owner_approved,updated_at&order=created_at.desc&limit=10"),
      rest("hunt_runtime_controls?select=key,enabled,owner_approved,note,updated_at&order=key.asc"),
      rest("hunt_business_identity?id=eq.primary&select=legal_entity_name,registration_number,registered_country,business_address,support_email,support_phone,returns_address,privacy_contact_email,status,owner_approved,updated_at&limit=1"),
      rest("hunt_legal_document_versions?select=doc_key,version,status,owner_approved,effective_at,published_at,updated_at&status=eq.published&owner_approved=eq.true&order=doc_key.asc")
    ]);

    const sessions=paymentSessions||[];
    const prelaunch=sessions.filter(x=>x.mode==="prelaunch"||x.status==="prelaunch").length;
    const nonPrelaunch=sessions.filter(x=>!["prelaunch"].includes(String(x.mode||""))&&!["prelaunch"].includes(String(x.status||""))).length;
    const verified=(econ||[]).filter(x=>x.inputs_verified===true&&x.profit_gate_status==="PASS");
    const sessionById=new Map(sessions.map(x=>[String(x.id),x]));
    const verifiedPayplusObservations=(payplusObservations||[]).filter(x=>x.environment==="sandbox"&&x.signature_verified===true&&x.ipn_full_verified===true);
    const scenarioFor=(obs:any)=>String(sessionById.get(String(obs.payment_session_id))?.commerce_snapshot?.scenario||"").toLowerCase();
    const successObservation=verifiedPayplusObservations.find(x=>scenarioFor(x)==="success")||null;
    const rejectObservation=verifiedPayplusObservations.find(x=>scenarioFor(x)==="reject")||null;
    const payplusProof=proofReadiness({
      success_observation:successObservation,
      reject_observation:rejectObservation
    });
    const runtimeControlMap=new Map((runtimeControls||[]).map(x=>[String(x.key),x]));
    const callbackControl=runtimeControlMap.get("hunt_payplus_callback_accept_paid")||null;

    const payplus={
      api_key_configured:Boolean(Deno.env.get("PAYPLUS_API_KEY")),
      secret_key_configured:Boolean(Deno.env.get("PAYPLUS_SECRET_KEY")),
      payment_page_uid_configured:Boolean(Deno.env.get("PAYPLUS_PAYMENT_PAGE_UID")),
      requested_mode:String(Deno.env.get("HUNT_PAYMENT_MODE")||"prelaunch").toLowerCase()
    };
    payplus["all_account_env_configured"]=Boolean(payplus.api_key_configured&&payplus.secret_key_configured&&payplus.payment_page_uid_configured);

    const businessIdentity=businessIdentityRows?.[0]||null;
    const identityRequired=["legal_entity_name","registration_number","registered_country","business_address","support_email","privacy_contact_email","returns_address"];
    const identityMissing=identityRequired.filter(k=>!String(businessIdentity?.[k]||"").trim());
    const identityPublished=Boolean(businessIdentity&&businessIdentity.status==="published"&&businessIdentity.owner_approved===true&&identityMissing.length===0);

    const legalRequired=["terms","privacy","returns","shipping"];
    const nowMs=Date.now();
    const activeLegalDocs=(legalDocs||[]).filter(x=>{
      const effective=Date.parse(String(x?.effective_at||""));
      return x?.status==="published"&&x?.owner_approved===true&&Number.isFinite(effective)&&effective<=nowMs&&Boolean(x?.published_at);
    });
    const legalByKey=new Map(activeLegalDocs.map(x=>[String(x.doc_key),x]));
    const legalMissing=legalRequired.filter(key=>!legalByKey.has(key));
    const legalReady=identityPublished&&legalMissing.length===0;

    const dynamic=[
      gate(
        "business_identity_runtime","Published business identity",
        identityPublished?"PASS":"FAIL",
        true,true,
        {
          configured:Boolean(businessIdentity),
          status:businessIdentity?.status||"draft",
          owner_approved:businessIdentity?.owner_approved===true,
          missing_fields:identityMissing
        },
        identityPublished
          ?"Keep legal identity synchronized with the operating entity."
          :"Complete Business Identity Setup and explicitly publish the owner-approved identity before public launch.",
        "legal"
      ),
      gate(
        "legal_documents_runtime","Published legal documents",
        legalReady?"PASS":"FAIL",
        true,true,
        {
          identity_published:identityPublished,
          required_documents:legalRequired,
          active_documents:activeLegalDocs.map(x=>({doc_key:x.doc_key,version:x.version,effective_at:x.effective_at,published_at:x.published_at})),
          missing_documents:legalMissing
        },
        legalReady
          ?"Keep legal versions and Business Identity synchronized under Owner Gate."
          :"Publish owner-approved Terms, Privacy, Returns and Shipping documents after Business Identity is complete; do not use placeholder legal text.",
        "legal"
      ),
      gate(
        "checkout_prelaunch_proof","Checkout dry-run evidence",
        sessions.length>0&&prelaunch===sessions.length?"PARTIAL":sessions.length>0?"PARTIAL":"FAIL",
        false,true,
        {payment_sessions:sessions.length,prelaunch_sessions:prelaunch,non_prelaunch_sessions:nonPrelaunch,latest:sessions[0]||null},
        "Prove cart → live product/variant/stock/shipping recheck → payment session → callback → order in a non-production end-to-end test.",
        "checkout"
      ),
      gate(
        "unit_economics_proof","Verified unit economics",
        verified.length>0?"PASS":"FAIL",
        false,true,
        {verified_profit_gate_pass:verified.length,total_economics_checks:(econ||[]).length},
        verified.length>0?"Keep sampling representative categories and destinations.":"Run live verified economics checks for representative sellable variants before paid acquisition or real-money launch.",
        "profit"
      ),
      gate(
        "payplus_runtime","PayPlus runtime configuration",
        payplus.all_account_env_configured&&["sandbox","live"].includes(payplus.requested_mode)?"PARTIAL":"FAIL",
        false,true,
        payplus,
        payplus.all_account_env_configured?"Callback/order flow still must be implemented and proven before live mode.":"Complete authorized PayPlus account configuration in secure project environment; never place secrets in frontend.",
        "payments"
      ),
      gate(
        "payplus_status_proof","PayPlus exact status proof",
        payplusProof.state==="READY"?"PASS":payplusProof.state==="REVIEW"?"PARTIAL":"HOLD",
        false,true,
        {
          contract_version:PAYPLUS_STATUS_PROOF.version,
          contract_state:PAYPLUS_STATUS_PROOF.state,
          owner_approved:PAYPLUS_STATUS_PROOF.owner_approved===true,
          sandbox_observations:verifiedPayplusObservations.length,
          success_observation_captured:Boolean(successObservation),
          reject_observation_captured:Boolean(rejectObservation),
          callback_accept_paid_enabled:callbackControl?.enabled===true,
          callback_accept_paid_owner_approved:callbackControl?.owner_approved===true,
          approved_success_configured:Boolean(PAYPLUS_STATUS_PROOF.approved_success),
          approved_reject_configured:Boolean(PAYPLUS_STATUS_PROOF.approved_reject)
        },
        payplusProof.state==="READY"
          ?"Keep exact fingerprints and runtime control under Owner Gate; re-prove after provider integration changes."
          :payplusProof.state==="REVIEW"
            ?"Review the captured sandbox success/reject fingerprints, write only the exact approved pair into the proof contract, then require explicit Owner approval before callback status writes."
            :"Configure authorized PayPlus sandbox credentials, capture one signed success and one signed reject callback with ipn-full verification; do not infer status values.",
        "payments"
      ),
      gate(
        "runtime_order_state","Runtime order/payment state",
        (orders||[]).length>0&&(orderEvents||[]).length>0&&(paymentEvents||[]).length>0?"PARTIAL":"FAIL",
        false,true,
        {orders:(orders||[]).length,order_events:(orderEvents||[]).length,payment_events:(paymentEvents||[]).length},
        "Prove idempotent payment event, order creation, supplier handoff and tracking state transitions.",
        "orders"
      ),
      gate(
        "analytics_runtime","HUNT analytics event flow",
        (analytics||[]).length>0?"PARTIAL":"FAIL",
        true,true,
        {hunt_events:(analytics||[]).length,latest_event:(analytics||[])[0]||null},
        "After deploying the exact candidate build, verify production funnel events from page view through checkout/order.",
        "analytics"
      ),
      gate(
        "merchant_program_runtime","Merchant Program activation",
        (merchantPrograms||[]).some(x=>x.status==="active"&&x.owner_approved===true)?"PASS":"HOLD",
        false,false,
        {versions:merchantPrograms||[]},
        "Not required for CJ-only soft launch. Keep external merchants held until owner approves program and payout/KYC flow.",
        "merchant"
      )
    ];

    const all=[...(evidence||[]),...dynamic];
    all.sort((a,b)=>rankStatus(b.status)-rankStatus(a.status)||String(a.gate_group).localeCompare(String(b.gate_group)));

    const softBlockers=all.filter(g=>g.blocks_soft_launch===true&&g.status!=="PASS");
    const realBlockers=all.filter(g=>g.blocks_real_money===true&&g.status!=="PASS");
    const counts={PASS:0,PARTIAL:0,FAIL:0,HOLD:0};
    for(const g of all)counts[g.status]=(counts[g.status]||0)+1;

    const summary={
      soft_launch_status:softBlockers.length?"BLOCKED":"READY_FOR_OWNER_REVIEW",
      real_money_status:realBlockers.length?"BLOCKED":"READY_FOR_OWNER_REVIEW",
      paid_marketing_status:realBlockers.length||verified.length===0?"BLOCKED":"READY_FOR_OWNER_REVIEW",
      gate_counts:counts,
      soft_blockers:softBlockers.map(x=>x.gate_key),
      real_money_blockers:realBlockers.map(x=>x.gate_key),
      verified_economics_pass:verified.length,
      runtime_controls:runtimeControls||[]
    };

    return json(req,{ok:true,generated_at:new Date().toISOString(),summary,gates:all});
  }catch(e){
    return json(req,{error:e instanceof Error?e.message:"launch readiness failed"},500);
  }
});