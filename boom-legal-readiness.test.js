const fs=require("fs");
const assert=require("assert");

const contract=JSON.parse(fs.readFileSync("boom-legal-readiness-contract.json","utf8"));
assert.deepEqual(contract.required_documents.map(x=>x.doc_key),["terms","privacy","returns","shipping"]);
for(const field of ["legal_entity_name","registration_number","registered_country","business_address","support_email","privacy_contact_email","returns_address"]){
  assert(contract.required_business_identity_fields.includes(field),"missing required identity field "+field);
}

const migration=fs.readFileSync("supabase/migrations/20260920095538_add_hunt_legal_registry.sql","utf8");
for(const key of ["terms","privacy","returns","shipping"])assert(migration.includes("'"+key+"'"),"migration missing doc key "+key);
assert(migration.includes("status = 'published'"));
assert(migration.includes("owner_approved = true"));
assert(migration.includes("effective_at <= now()"));
assert(migration.includes('policy "admins_manage_hunt_legal_documents"'));
assert(migration.includes("(select public.is_admin_user())"));
assert(!/insert into public\.hunt_legal_document_versions/i.test(migration),"migration must not fabricate legal content");
assert(!/grant (?:insert|update|delete)[^;]+ to anon/i.test(migration),"anon legal writes introduced");

const legalJs=fs.readFileSync("legal.js","utf8");
assert(legalJs.includes('.eq("status","published")'));
assert(legalJs.includes('.eq("owner_approved",true)'));
assert(legalJs.includes('.lte("effective_at",now)'));
assert(legalJs.includes("p.textContent=part"));
assert(!legalJs.includes(".innerHTML"),"legal surface must not render legal content as HTML");
assert(!legalJs.includes("HuntAnalytics"),"legal surface must not depend on analytics");

const legalHtml=fs.readFileSync("legal.html","utf8");
assert(legalHtml.includes('content="noindex,nofollow"'));
assert(legalHtml.includes("boom-runtime.js"));
assert(!legalHtml.includes("analytics.js"),"legal surface should not load analytics before legal/consent readiness");

const launch=fs.readFileSync("supabase/functions/hunt-launch-readiness/index.ts","utf8");
for(const needle of [
  "hunt_legal_document_versions",
  "legal_documents_runtime",
  'const legalRequired=["terms","privacy","returns","shipping"]',
  "missing_documents:legalMissing",
  "registered_country"
]) assert(launch.includes(needle),"Launch Readiness missing "+needle);

const surfaces=JSON.parse(fs.readFileSync("boom-surface-contract.json","utf8"));
const legalSurface=surfaces.surfaces.find(x=>x.id==="store.legal");
assert(legalSurface&&legalSurface.enforce_phase_1===true,"legal surface is not phase-1 enforced");
assert.deepEqual(legalSurface.required,["core","runtime","theme"]);

console.log("BOOM legal readiness: PASS — no fabricated legal text; published docs and identity are hard launch gates");