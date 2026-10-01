import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const profilePath=path.join(root,"ops/legal/hunt-legal-readiness.json");
const profile=JSON.parse(fs.readFileSync(profilePath,"utf8"));
const required=["support_email","privacy_contact_email","returns_address"];
const missing=required.filter(key=>!String(profile?.public_contacts?.[key]||"").trim());
if(profile?.owner_approved!==true||missing.length){
  console.error("LEGAL_PUBLICATION_BLOCKED",JSON.stringify({owner_approved:profile?.owner_approved===true,missing}));
  process.exit(2);
}
console.error("LEGAL_BUILD_REQUIRES_REVIEWED_FINAL_COPY");
process.exit(3);
