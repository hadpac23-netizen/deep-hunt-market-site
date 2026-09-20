(() => {
  "use strict";
  const $=q=>document.querySelector(q);
  const runtime=window.BoomRuntime;
  const allowed=new Map([["terms","Terms of Service"],["privacy","Privacy Policy"],["returns","Returns & Refund Policy"],["shipping","Shipping Policy"]]);
  function currentDoc(){
    const value=String(new URLSearchParams(location.search).get("doc")||"terms").toLowerCase();
    return allowed.has(value)?value:"terms";
  }
  function setUnavailable(message){
    const state=$("#hd-legal-state");
    state.textContent="NOT PUBLISHED";
    state.classList.remove("green");
    $("#hd-legal-title").textContent=allowed.get(currentDoc())||"Legal information";
    $("#hd-legal-meta").textContent="This document is not published yet.";
    $("#hd-legal-body").textContent=message||"No owner-approved published version is available.";
  }
  function renderDocument(row){
    const state=$("#hd-legal-state");
    state.textContent="PUBLISHED";
    state.classList.add("green");
    $("#hd-legal-title").textContent=String(row.title||allowed.get(row.doc_key)||"Legal information");
    const effective=row.effective_at?new Date(row.effective_at).toLocaleDateString():"";
    $("#hd-legal-meta").textContent=[row.version?("Version "+row.version):"",effective?("Effective "+effective):""].filter(Boolean).join(" · ");
    const body=$("#hd-legal-body");
    body.replaceChildren();
    const parts=String(row.body_markdown||"").split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
    for(const part of parts){const p=document.createElement("p");p.textContent=part;body.appendChild(p);}
    if(!parts.length)body.textContent="Published document is empty.";
    document.title=$("#hd-legal-title").textContent+" — HUNT DEAL";
  }
  async function boot(){
    const doc=currentDoc();
    $("#hd-legal-title").textContent=allowed.get(doc);
    const client=runtime?.getSupabaseClient?.();
    if(!client){setUnavailable("Legal registry is unavailable.");return;}
    const now=new Date().toISOString();
    const {data,error}=await client.from("hunt_legal_document_versions")
      .select("doc_key,version,title,body_markdown,effective_at,published_at")
      .eq("doc_key",doc).eq("status","published").eq("owner_approved",true)
      .lte("effective_at",now).order("effective_at",{ascending:false}).limit(1).maybeSingle();
    if(error||!data){setUnavailable();return;}
    renderDocument(data);
  }
  boot();
})();
