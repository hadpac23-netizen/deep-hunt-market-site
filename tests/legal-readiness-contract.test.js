const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const profile=JSON.parse(fs.readFileSync(path.join(root,"ops/legal/hunt-legal-readiness.json"),"utf8"));
const blockers=JSON.parse(fs.readFileSync(path.join(root,"ops/hunt-legal-launch-blockers.json"),"utf8"));
const build=fs.readFileSync(path.join(root,"scripts/build-legal-pages.mjs"),"utf8");

test("RT11 prelaunch legal pages are approved without claiming real-money disclosure closure",()=>{
  assert.equal(profile.policy_publication_owner_approved,true);
  assert.equal(profile.public_contacts.support_email,"hacoachle@gmail.com");
  assert.equal(profile.public_contacts.privacy_contact_email,"hacoachle@gmail.com");
  assert.equal(profile.public_contacts.returns_address,null);
  assert.equal(profile.returns_workflow_owner_approved,true);
  assert.equal(profile.customer_policy_pages_verified,true);
  assert.equal(profile.real_money_business_address_disclosure_pending,true);
  assert.equal(profile.publication_gate,"PRELAUNCH_POLICY_PUBLICATION_APPROVED");
});

test("legal readiness and launch-blocker sources cannot contradict customer-contact or returns truth",()=>{
  assert.equal(blockers.real_money_launch_allowed,false);
  assert.equal(blockers.customer_contact_fields_complete,true);
  assert.equal(blockers.returns_solution_complete,true);
  assert.equal(blockers.returns_workflow_owner_approved,profile.returns_workflow_owner_approved);
  assert.equal(blockers.customer_policy_pages_verified,profile.customer_policy_pages_verified);
  assert.equal(blockers.policy_publication_owner_approved,profile.policy_publication_owner_approved);
  assert.equal(blockers.real_money_business_address_disclosure_pending,profile.real_money_business_address_disclosure_pending);
  assert.equal(blockers.public_contacts.returns_address,profile.public_contacts.returns_address);
  assert.ok(blockers.remaining_required_fields.includes("real_money_business_address_disclosure_where_required"));
  assert.ok(!blockers.remaining_required_fields.includes("support_email"));
  assert.ok(!blockers.remaining_required_fields.includes("privacy_contact_email"));
  assert.ok(!blockers.remaining_required_fields.includes("returns_address"));
});

test("all four reviewed public policy pages exist and stay prelaunch-safe",()=>{
  for(const name of ["terms.html","privacy.html","returns.html","shipping.html"]){
    const raw=fs.readFileSync(path.join(root,name),"utf8");
    assert.match(raw,/PRE-LAUNCH/i,name);
    assert.match(raw,/hacoachle@gmail\.com/i,name);
    assert.doesNotMatch(raw,/DRAFT\s*[—-]\s*NOT CUSTOMER-FACING/i,name);
  }
  assert.match(fs.readFileSync(path.join(root,"returns.html"),"utf8"),/5%.*NIS 100|NIS 100.*5%/s);
});

test("legal builder requires approved policy publication and an approved returns solution",()=>{
  assert.match(build,/policy_publication_owner_approved/);
  assert.match(build,/returns_workflow_owner_approved===true/);
  assert.match(build,/LEGAL_PRELAUNCH_PUBLICATION_READY/);
});

test("returns workflow is Owner-approved without inventing a universal physical returns address",()=>{
  assert.equal(profile.returns_workflow_owner_approved,true);
  assert.equal(profile.public_contacts.returns_address,null);
  assert.ok(fs.existsSync(path.join(root,profile.returns_workflow_file)));
});
