const bool=v=>v===true;
function check(id,label,value,kind="runtime"){return {id,label,kind,status:value===true?"PASS":value===false?"FAIL":"UNKNOWN"}}
export function evaluateDeploymentReadiness(facts={}){
  const checks=[
    check("migration_source","Media Vault migration source exists",facts.migration_source,"source"),
    check("runway_source","Runway connector source exists",facts.runway_source,"source"),
    check("vault_source","Media Vault function source exists",facts.vault_source,"source"),
    check("vision_source","Vision adapter source exists",facts.vision_source,"source"),
    check("tests_passed","Brand Factory regression tests passed",facts.tests_passed,"source"),
    check("ledger_table","boom_media_assets exists",facts.ledger_table_exists),
    check("ledger_rls","boom_media_assets RLS enabled",facts.ledger_rls_enabled),
    check("vault_bucket","boom-media-vault bucket exists",facts.vault_bucket_exists),
    check("vault_private","boom-media-vault is private",facts.vault_bucket_private),
    check("ledger_policy","ledger admin-read policy exists",facts.ledger_policy_exists),
    check("vault_policy","vault admin-read policy exists",facts.vault_policy_exists),
    check("runway_function","hunt-boom-video-runway deployed",facts.runway_function_deployed),
    check("vault_function","hunt-boom-media-vault deployed",facts.vault_function_deployed),
    check("runway_jwt","Runway function requires JWT",facts.runway_verify_jwt),
    check("vault_jwt","Media Vault function requires JWT",facts.vault_verify_jwt),
    check("runway_secret","Runway server secret present",facts.runway_secret_present,"provider"),
    check("vision_secret","OpenAI Vision server secret present",facts.vision_secret_present,"provider"),
    check("runway_flag","Runway generation explicitly enabled",facts.runway_enabled,"activation"),
    check("vision_flag","Vision QA explicitly enabled",facts.vision_enabled,"activation"),
    check("owner_gate","Owner activation granted",facts.owner_activation_granted,"activation"),
    check("product_truth","Product Truth reverified live",facts.product_truth_live_verified,"activation")
  ];
  const source=checks.filter(x=>x.kind==="source");
  const runtime=checks.filter(x=>x.kind==="runtime");
  const provider=checks.filter(x=>x.kind==="provider");
  const activation=checks.filter(x=>x.kind==="activation");
  const allPass=x=>x.every(c=>c.status==="PASS");
  const source_ready=allPass(source);
  const runtime_ready=source_ready&&allPass(runtime)&&allPass(provider);
  const generation_ready=runtime_ready&&allPass(activation);
  const blockers=checks.filter(c=>c.status!=="PASS").map(c=>({id:c.id,label:c.label,status:c.status,kind:c.kind}));
  const status=!source_ready?"SOURCE_BLOCKED":!runtime_ready?"RUNTIME_BLOCKED":!generation_ready?"OWNER_ACTIVATION_REQUIRED":"READY_FOR_FIRST_GENERATION";
  return {status,source_ready,runtime_ready,generation_ready,checks,blockers,provider_calls_made:0,spend_authorized:false,publishing_authorized:false};
}
