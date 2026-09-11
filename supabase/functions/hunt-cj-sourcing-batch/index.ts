import "jsr:@supabase/functions-js/edge-runtime.d.ts";
Deno.serve(() => new Response(JSON.stringify({
  status:"disabled",
  message:"HUNT one-time CJ sourcing batch is closed. Re-enable only for an approved sourcing run."
}),{status:410,headers:{"content-type":"application/json","cache-control":"no-store"}}));
