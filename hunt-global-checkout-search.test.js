const fs=require("fs");

const migration=fs.readFileSync("supabase/migrations/20260920181000_add_hunt_saved_addresses.sql","utf8");
const checkout=fs.readFileSync("checkout.html","utf8");
const saved=fs.readFileSync("hunt-saved-addresses.js","utf8");
const search=fs.readFileSync("hunt-search-assist.js","utf8");
const searchHtml=fs.readFileSync("search.html","utf8");
const qa=fs.readFileSync("hunt-local-sandbox-qa.js","utf8");

const must=(ok,msg)=>{if(!ok)throw new Error(msg)};

must(migration.includes("enable row level security"),"saved addresses must enable RLS");
must(migration.includes("revoke all on public.hunt_saved_addresses from anon"),"anon must not access saved addresses");
must((migration.match(/auth\.uid\(\) = user_id/g)||[]).length>=4,"all address policies must be user-owned");
must(checkout.includes("hd-save-delivery")&&checkout.includes("hunt-saved-addresses.js"),"checkout save-details UI missing");
must(saved.includes('from("hunt_saved_addresses")'),"saved-address client missing");
must(!saved.includes("localStorage"),"delivery PII must not use localStorage");
must(searchHtml.includes("hunt-search-assist.js")&&searchHtml.includes("hunt-search-assist.css"),"search assist not connected");
must(search.includes("Recent searches")&&search.includes("AI search"),"search assist groups missing");
must(search.includes("ג'ינס")&&search.includes("جينز")&&search.includes("jeans"),"multilingual jeans aliases missing");
must(qa.includes('["127.0.0.1","localhost"]'),"sandbox QA must be localhost-only");
must(qa.indexOf('invoke("dry_run")')<qa.indexOf('invoke("sandbox")'),"dry-run must precede sandbox");
must(!qa.includes('invoke("live")'),"local QA must not expose live supplier execution");

console.log("HUNT global checkout/search foundation: PASS");
