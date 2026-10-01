import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const profile=JSON.parse(fs.readFileSync(path.join(root,"ops/legal/hunt-legal-readiness.json"),"utf8"));
const required=["support_email","privacy_contact_email"];
const missing=required.filter(k=>!String(profile?.public_contacts?.[k]||"").trim());
const returnsReady=Boolean(String(profile?.public_contacts?.returns_address||"").trim()||profile?.returns_workflow_owner_approved===true);
if(!returnsReady)missing.push("returns_solution");
if(profile?.policy_publication_owner_approved!==true||missing.length){
  console.error("LEGAL_PUBLICATION_BLOCKED",JSON.stringify({policy_publication_owner_approved:profile?.policy_publication_owner_approved===true,returns_ready:returnsReady,missing}));
  process.exit(2);
}
const pages=["terms.html","privacy.html","returns.html","shipping.html"];
const absent=pages.filter(name=>!fs.existsSync(path.join(root,name)));
if(absent.length){console.error("LEGAL_PUBLICATION_BLOCKED",JSON.stringify({absent}));process.exit(3);}
for(const name of pages){
  const raw=fs.readFileSync(path.join(root,name),"utf8");
  if(/DRAFT\s*[—-]\s*NOT CUSTOMER-FACING/i.test(raw))throw new Error("UNREVIEWED_LEGAL_COPY:"+name);
}
console.log("LEGAL_PRELAUNCH_PUBLICATION_READY",JSON.stringify({pages,real_money_business_address_disclosure_pending:profile.real_money_business_address_disclosure_pending===true}));
