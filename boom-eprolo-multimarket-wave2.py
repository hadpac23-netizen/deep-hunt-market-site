#!/usr/bin/env python3
import hashlib,json,time,urllib.parse,urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SECRET=Path.home()/".hunt-eprolo-secrets.env"
BASE="https://openapi.eprolo.com/"
MARKETS=["IL","DE","FR","IT","ES","NL","GB","US","CA","AU","AE","JP","SG"]
EU={"DE","FR","IT","ES","NL"}
POLICY={
 "IL":"REVIEW_REQUIRED","GB":"REVIEW_REQUIRED","US":"REVIEW_REQUIRED","AU":"REVIEW_REQUIRED",
 **{x:"REVIEW_REQUIRED" for x in EU}
}
CANDS=[
 {"department":"men","category":"men-bottoms","product_id":"25354414","supplier_category_id":1230},
 {"department":"men","category":"men-tops","product_id":"24539904","supplier_category_id":1256},
 {"department":"men","category":"men-shoes","product_id":"29971473","supplier_category_id":63},
 {"department":"home","category":"lighting","product_id":"31441975","supplier_category_id":109},
 {"department":"home","category":"lighting","product_id":"29095247","supplier_category_id":109},
 {"department":"kitchen","category":"kitchen-tools","product_id":"26556212","supplier_category_id":115},
 {"department":"kitchen","category":"drinkware","product_id":"31640357","supplier_category_id":112},
]
def creds():
 vals={}
 for raw in SECRET.read_text(errors="ignore").splitlines():
  line=raw.strip()
  if not line or line.startswith("#"): continue
  if "=" in line:k,v=line.split("=",1)
  elif ":" in line:k,v=line.split(":",1)
  else:continue
  vals[k.strip()]=v.strip()
 return vals.get("EPROLO_API_KEY") or vals.get("openApiKey"), vals.get("EPROLO_API_SECRET") or vals.get("openApiSecret")
def signed_get(path,params):
 key,secret=creds(); ts=str(int(time.time()*1000)); sign=hashlib.md5((key+ts+secret).encode()).hexdigest()
 q=dict(params); q["sign"]=sign;q["timestamp"]=ts
 req=urllib.request.Request(BASE+path+"?"+urllib.parse.urlencode(q),headers={"apiKey":key,"Accept":"application/json","User-Agent":"HUNT-EPROLO-MULTIMARKET-WAVE2/1.0"})
 with urllib.request.urlopen(req,timeout=15) as resp:return resp.status,json.loads(resp.read().decode("utf-8","replace"))
def product(cat,pid):
 for page in (1,2,3):
  st,b=signed_get("eprolo_product_list.html",{"page":page,"page_size":200,"wareTypeTwoId":cat})
  if st!=200 or str(b.get("code"))!="0":return None
  data=b.get("data") or []
  row=next((x for x in data if str(x.get("product_id") or x.get("id"))==pid),None)
  if row:return row
  if len(data)<200:return None
 return None
def cheapest(data):
 opts=[]
 for v in (data or {}).get("variantlist") or []:
  for lg in v.get("logistics_cost_list") or []:
   for x in lg.get("cost_list") or []:
    try:c=float(x.get("cost"))
    except:continue
    if c>=0:opts.append({"cost_usd":round(c,2),"method":str(x.get("ship_method") or ""),"shiptime":str(x.get("shiptime") or "")})
 return min(opts,key=lambda x:x["cost_usd"]) if opts else None
def retail(cost):
 import math
 floor=max((cost+4)/.91,cost/(.91-.35))
 return round(max(.99,math.ceil(floor)-.01),2)

results=[]
for i,c in enumerate(CANDS,1):
 print(f"START {i}/{len(CANDS)} {c['product_id']}",flush=True)
 row=product(c["supplier_category_id"],c["product_id"])
 if not row:
  results.append({**c,"status":"CATALOG_ROW_NOT_FOUND"});continue
 title=str(row.get("title") or "")
 variants=[]
 for v in row.get("variantlist") or []:
  try:stock=max(0,int(float(v.get("inventory_quantity") or 0)))
  except:stock=0
  try:cost=float(v.get("cost"))
  except:cost=-1
  try:w=float(v.get("weight") or 99999)
  except:w=99999
  vid=str(v.get("id") or v.get("variantsid") or "")
  if vid and stock>0 and cost>0:variants.append((cost,w,-stock,vid,v))
 variants.sort(key=lambda z:(z[0],z[1],z[2]))
 if not variants:
  results.append({**c,"title":title,"status":"NO_IN_STOCK_VARIANT"});continue
 cost,w,negstock,vid,v=variants[0]
 rt=retail(cost)
 markets={}
 for idx,cc in enumerate(MARKETS,1):
  try:
   st,b=signed_get("get_product_shiping_fees.html",{"productid":c["product_id"],"variantId":vid,"countrycode":cc})
   sh=cheapest(b.get("data") if isinstance(b,dict) else {})
   ratio=round(sh["cost_usd"]/rt,3) if sh else None
   shipping_state="NORMAL" if ratio is not None and ratio<.8 else "HIGH_OR_MISSING"
   legal_state=POLICY.get(cc,"HOLD_UNMAPPED")
   shadow_eligible=shipping_state=="NORMAL"
   live_eligible=False
   markets[cc]={
     "shipping":sh,
     "shipping_to_retail_ratio":ratio,
     "shipping_state":shipping_state,
     "market_policy_state":legal_state,
     "shadow_eligible":shadow_eligible,
     "live_eligible":live_eligible
   }
  except Exception as e:
   markets[cc]={"error":type(e).__name__,"shipping_state":"ERROR","market_policy_state":POLICY.get(cc,"HOLD_UNMAPPED"),"shadow_eligible":False,"live_eligible":False}
  time.sleep(.05)
 results.append({**c,"title":title,"status":"MULTIMARKET_QUOTED","variant":{"id":vid,"title":v.get("title"),"supplier_cost_usd":round(cost,2),"inventory_quantity":max(0,-negstock),"weight_g":w},"retail_shadow_usd":rt,"markets":markets})
 print("DONE",json.dumps({"id":c["product_id"],"normal":[cc for cc,m in markets.items() if m.get("shipping_state")=="NORMAL"],"legal_mapped":[cc for cc,m in markets.items() if m.get("market_policy_state")=="REVIEW_REQUIRED"]}),flush=True)

summary={
 "checked":len(results),
 "markets":MARKETS,
 "shipping_pass_counts":{cc:sum(1 for x in results if (x.get("markets") or {}).get(cc,{}).get("shipping_state")=="NORMAL") for cc in MARKETS},
 "policy_states":{cc:POLICY.get(cc,"HOLD_UNMAPPED") for cc in MARKETS},
 "live_eligible_products":0,
 "production_effect":False
}
out={"version":"HUNT-EPROLO-MULTIMARKET-WAVE2-V1","date":"2026-09-23","mode":"READ_ONLY_GLOBAL_SHADOW","markets":MARKETS,"production_effect":False,"summary":summary,"results":results,"rules":[
 "Shipping eligibility is destination-specific.",
 "Market policy eligibility is independent of supplier shipping.",
 "Unmapped legal markets remain HOLD for real-money launch even if supplier shipping is good.",
 "No live checkout, fulfillment or Production exposure.",
 "Final profit remains blocked until EPROLO order-cost API is verified."
]}
(ROOT/"evidence/HUNT-EPROLO-MULTIMARKET-WAVE2-2026-09-23.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print("SUMMARY",json.dumps(summary),flush=True)
