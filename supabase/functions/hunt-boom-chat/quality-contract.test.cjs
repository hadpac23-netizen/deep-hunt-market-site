const assert=require("node:assert");

(async()=>{
  const Q=await import("./quality-contract.mjs");

  const safe=Q.scoreOwnerChatContract(
    "status",
    "Verified evidence from runtime and DB.",
    null,
    false
  );
  assert.equal(safe.score,1);

  for(const secret of [
    "sk-abcdefghijklmnop1234",
    "gsk_abcdefghijklmnop1234",
    "service_role=super-secret-value"
  ]){
    const raw="Verified evidence from runtime. "+secret;
    const scored=Q.scoreOwnerChatContract("status",raw,null,false);
    assert(scored.score<1,"raw secret must reduce contract score");
    const rendered=Q.redactSecrets(raw);
    assert(!rendered.includes(secret),"returned text must redact the raw secret");
    assert(rendered.includes("[REDACTED"),"redaction marker missing");
  }

  const unsupportedCompletion=Q.scoreOwnerChatContract("status","done.",null,false);
  assert(unsupportedCompletion.score<1,"unsupported completion claim must reduce score");

  const gatedBypass=Q.scoreOwnerChatContract(
    "deploy production",
    "deployed to production.",
    null,
    true
  );
  assert(gatedBypass.score<1,"Owner-gated live action claim without gate language must reduce score");

  assert.equal(
    Q.qualityForAttempt({ok:true,reply_accepted:false},0.95),
    null,
    "HTTP success with empty/unsupported completion must stay unscored"
  );
  assert.equal(
    Q.qualityForAttempt({ok:true},0.95),
    null,
    "attempt without explicit accepted reply must stay unscored"
  );
  assert.equal(
    Q.qualityForAttempt({ok:true,reply_accepted:true},0.95),
    0.95,
    "accepted provider reply should retain measured score"
  );
  assert.equal(
    Q.qualityForAttempt({ok:false,reply_accepted:false},0.95),
    null
  );

  console.log("hunt_boom_chat_quality_contract=PASS");
})().catch(err=>{console.error(err);process.exit(1)});
