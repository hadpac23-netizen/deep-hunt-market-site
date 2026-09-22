#!/usr/bin/env python3
import hashlib,json,time,urllib.parse,urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SECRET=Path.home()/".hunt-eprolo-secrets.env"
BASE="https://openapi.eprolo.com/"
MARKETS=["SE","DK","FI","AT","BE","PL","PT","IE","CZ","GR","NO","CH","NZ","KR","HK","MY","TH","SA","MX","BR"]
EU={"SE","DK","FI","AT","BE","PL","PT","IE","CZ","GR"}
PRODUCTS=[
 {"department":"women","product_id":"19374567","variant_id":"566150532","variant_title":"Black-L","retail_shadow_usd":14.99},
 {"department":"men","product_id":"24539904","variant_id":"629377665","variant_title":"blue-2XL","retail_shadow_usd":15.99},
 {"department":"kitchen","product_id":"26556212","variant_id":"654069536","variant_title":"Beech","retail_shadow_usd":5.99},
 {"department":"tech","product_id":"26921252","variant_id":"658204524","variant_title":"Midnight Blue","retail_shadow_usd":7.99},
]
def creds():
 vals={}
 for raw in SECRET.read_text(errors="ignore").splitlines():
  line=raw.strip()
  if not line or line.startswith("#"):continue
  if "=" in line:k,v=line.split("=",1)
  elif ":" in line:k,v=line.split(":",1)
  else:continue
  vals[k.strip()]=v.strip()
 return vals.get("EPROLO_API_KEY") or vals.get("openApiKey"), vals.get("EPROLO_API_SECRET") or vals.get("openApiSecret")
def signed_get(path,params):
 key,secret=creds()
 ts=str(int(time.time()*1000))
 sign=hashlib.md5((key+ts+secret).encode()).hexdigest()
 q=dict(params);q["sign"]=sign;q["timestamp"]=ts
 req=urllib.request.Request(BASE+path+"?"+urllib.parse.urlencode(q),headers={"apiKey":key,"Accept":"application/json","User-Agent":"HUNT-GLOBAL-WAVE3/1.0"})
 with urllib.request.urlopen(req,timeout=15) as resp:
  return resp.status,json.loads(resp.read().decode("utf-8","replace"))
def cheapest(data):
 opts=[]
 for v in (data or {}).get("variantlist") or []:
  for lg in v.get("logistics_cost_list") or []:
   for x in lg.get("cost_list") or []:
    try:c=float(x.get("cost"))
    except:continue
    if c>=0:opts.append({"cost_usd":round(c,2),"method":str(x.get("ship_method") or ""),"shiptime":str(x.get("shiptime") or "")})
 return min(opts,key=lambda x:x["cost_usd"]) if opts else None

results=[]
for i,p in enumerate(PRODUCTS,1):
 print(f"START {i}/{len(PRODUCTS)} {p['department']} {p['product_id']}",flush=True)
 markets={}
 for cc in MARKETS:
  try:
   st,b=signed_get("get_product_shiping_fees.html",{"productid":p["product_id"],"variantId":p["variant_id"],"countrycode":cc})
   sh=cheapest(b.get("data") if isinstance(b,dict) else {})
   ratio=round(sh["cost_usd"]/p["retail_shadow_usd"],3) if sh else None
   state="NORMAL" if ratio is not None and ratio<.8 else "HIGH_OR_MISSING"
   markets[cc]={
     "shipping":sh,
     "shipping_to_retail_ratio":ratio,
     "shipping_state":state,
     "market_policy_state":"REVIEW_REQUIRED" if cc in EU else "HOLD_UNMAPPED",
     "shadow_eligible":state=="NORMAL",
     "live_eligible":False
   }
  except Exception as e:
   markets[cc]={"error":type(e).__name__,"shipping_state":"ERROR","market_policy_state":"REVIEW_REQUIRED" if cc in EU else "HOLD_UNMAPPED","shadow_eligible":False,"live_eligible":False}
  time.sleep(.04)
 results.append({**p,"status":"GLOBAL_SHIPPING_DISCOVERY","markets":markets})
 print("DONE",json.dumps({"id":p["product_id"],"normal":[cc for cc,m in markets.items() if m.get("shipping_state")=="NORMAL"]}),flush=True)

summary={
 "products_checked":len(PRODUCTS),
 "markets_checked":len(MARKETS),
 "shipping_pass_counts":{cc:sum(1 for p in results if p["markets"][cc].get("shipping_state")=="NORMAL") for cc in MARKETS},
 "eu_policy_review_markets":sorted(EU),
 "unmapped_policy_hold_markets":[cc for cc in MARKETS if cc not in EU],
 "live_eligible_products":0,
 "production_effect":False
}
out={
 "version":"HUNT-EPROLO-GLOBAL-DISCOVERY-WAVE3-V1",
 "date":"2026-09-23",
 "mode":"READ_ONLY_GLOBAL_SHADOW",
 "provider":"EPROLO",
 "markets":MARKETS,
 "production_effect":False,
 "summary":summary,
 "results":results,
 "rules":[
   "Shipping discovery is product + exact variant + destination specific.",
   "EU destinations inherit only the existing EU policy REVIEW_REQUIRED baseline; this is not launch approval.",
   "Non-mapped destinations remain HOLD_UNMAPPED for real-money launch.",
   "No live checkout, fulfillment or Production exposure.",
   "Final profit remains blocked until EPROLO order-cost API behavior is verified."
 ]
}
(ROOT/"evidence/HUNT-EPROLO-GLOBAL-DISCOVERY-WAVE3-2026-09-23.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print("SUMMARY",json.dumps(summary),flush=True)
