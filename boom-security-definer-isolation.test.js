const fs=require("fs");
const assert=require("assert");

const file="supabase/migrations/20260920094955_move_security_definers_to_boom_internal.sql";
const sql=fs.readFileSync(file,"utf8");
const fns=[
  ["is_admin_user",""],
  ["admin_set_user_ban","uuid,boolean"],
  ["create_post_draft","text,text,text,text[],jsonb,text,text,text,text"],
  ["get_my_drafts",""],
  ["get_my_recent_deleted",""],
  ["publish_draft","uuid"],
  ["soft_delete_post","uuid"],
  ["undo_delete_post","uuid"]
];

assert(sql.includes("create schema if not exists boom_internal authorization postgres"));
assert(sql.includes("revoke all on schema boom_internal from public"));
assert(sql.includes("revoke all on schema boom_internal from anon"));
assert(sql.includes("grant usage on schema boom_internal to authenticated, service_role"));

for(const [name,args] of fns){
  const privNeedle=`create or replace function boom_internal.${name}(`;
  const pubNeedle=`create or replace function public.${name}(`;
  assert(sql.includes(privNeedle),`missing privileged implementation ${name}`);
  assert(sql.includes(pubNeedle),`missing public wrapper ${name}`);

  const sig=`public.${name}(${args})`;
  assert(sql.includes(`revoke all on function ${sig} from public, anon`),`missing public revoke ${sig}`);
  assert(sql.includes(`grant execute on function ${sig} to authenticated, service_role`),`missing public execute grant ${sig}`);

  const privSig=`boom_internal.${name}(${args})`;
  assert(sql.includes(`revoke all on function ${privSig} from public, anon`),`missing internal revoke ${privSig}`);
  assert(sql.includes(`grant execute on function ${privSig} to authenticated, service_role`),`missing internal execute grant ${privSig}`);
}

const publicBlocks=[...sql.matchAll(/create or replace function public\.[\s\S]*?\$function\$;/g)].map(x=>x[0]);
assert.equal(publicBlocks.length,8,"expected eight public wrappers");
for(const block of publicBlocks){
  assert(/security invoker/i.test(block),"public wrapper is not SECURITY INVOKER");
  assert(!/security definer/i.test(block),"SECURITY DEFINER remains in public wrapper");
  assert(/set search_path = ''/i.test(block),"public wrapper missing empty search_path");
  assert(/boom_internal\./.test(block),"public wrapper does not delegate to boom_internal");
  assert(!/\b(insert into|update public\.|delete from)\b/i.test(block),"public wrapper mutates privileged data directly");
}

const internalBlocks=[...sql.matchAll(/create or replace function boom_internal\.[\s\S]*?\$function\$;/g)].map(x=>x[0]);
assert.equal(internalBlocks.length,8,"expected eight internal implementations");
for(const block of internalBlocks){
  assert(/security definer/i.test(block),"internal implementation lost SECURITY DEFINER");
  assert(/set search_path = ''/i.test(block),"internal implementation missing empty search_path");
}
assert(sql.includes("where p.id = auth.uid()"),"admin lookup lost caller identity check");
assert(sql.includes("v_uid uuid := auth.uid()"),"post mutation path lost caller identity check");
assert(sql.includes("where p.id = p_post_id")&&sql.includes("p.author_id = v_uid"),"post ownership check missing");
assert(sql.includes("if not boom_internal.is_admin_user()"),"admin mutation missing admin gate");
assert(!/grant execute[^;]+\bto anon\b/i.test(sql),"anon EXECUTE grant introduced");
for(const needle of [
  "v_public_definers <> 0",
  "v_internal_definers <> 8",
  "v_anon_execute <> 0",
  "v_authenticated_wrappers <> 8"
]) assert(sql.includes(needle),"migration self-check missing "+needle);

console.log("BOOM SECURITY DEFINER isolation: PASS — 8 RPC signatures preserved as invoker wrappers over isolated privileged implementations");