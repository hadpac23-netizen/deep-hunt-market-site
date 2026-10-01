const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const profile=JSON.parse(fs.readFileSync(path.join(root,"ops/legal/hunt-legal-readiness.json"),"utf8"));
const build=fs.readFileSync(path.join(root,"scripts/build-legal-pages.mjs"),"utf8");

test("RT11 legal publication stays fail-closed until verified contacts and Owner approval",()=>{
  assert.equal(profile.owner_approved,false);
  assert.equal(profile.public_contacts.support_email,"hacoachle@gmail.com");
  assert.equal(profile.public_contacts.privacy_contact_email,"hacoachle@gmail.com");
  assert.equal(profile.public_contacts.returns_address,null);
  assert.equal(profile.publication_gate,"RETURNS_VERIFIED_AND_OWNER_APPROVED");
});

test("company mailbox is explicitly designated for support/privacy while returns stays blocked",()=>{
  assert.equal(profile.company_mailbox_candidate_exists,true);
  assert.equal(profile.company_mailbox_candidate_designated_for_customer_support,true);
  assert.equal(profile.public_contacts.returns_address,null);
});

test("legal page builder refuses publication while contacts or approval are missing",()=>{
  assert.match(build,/LEGAL_PUBLICATION_BLOCKED/);
  assert.match(build,/owner_approved!==true\|\|missing\.length/);
  assert.match(build,/LEGAL_BUILD_REQUIRES_REVIEWED_FINAL_COPY/);
});

test("all four policy templates exist only under ops legal drafts",()=>{
  for(const name of ["terms.md","privacy.md","returns-refunds.md","shipping-delivery.md"]){
    assert.ok(fs.existsSync(path.join(root,"ops/legal/templates",name)),name);
  }
  for(const name of ["terms.html","privacy.html","returns.html","shipping.html"]){
    assert.equal(fs.existsSync(path.join(root,name)),false,name+" must not be published yet");
  }
});


test("returns workflow is drafted but cannot replace Owner approval yet",()=>{
  assert.equal(profile.returns_workflow_draft_ready,true);
  assert.equal(profile.returns_workflow_owner_approved,false);
  assert.equal(profile.public_contacts.returns_address,null);
  assert.ok(fs.existsSync(path.join(root,profile.returns_workflow_file)));
});
