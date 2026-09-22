#!/usr/bin/env python3
import hashlib,json,math,re,time,urllib.parse,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parent
SECRET=Path.home()/".hunt-eprolo-secrets.env"
BASE="https://openapi.eprolo.com/"
CANDS=[
 {"department":"tech","category":"wearable-accessories","product_id":"31715253","supplier_category_id":43},
 {"department":"tech","category":"wearable-accessories","product_id":"29971464","supplier_category_id":43},
 {"department":"tech","category":"audio-accessories","product_id":"29761463","supplier_category_id":45},
 {"department":"tech","category":"watch-cases","product_id":"21997241","supplier_category_id":43},
 {"department":"tech","category":"wearable-accessories","product_id":"31417803","supplier_category_id":43},
]
BLOCKED=re.compile(r"\b(weapon|knife|blade|gun|firearm|tactical|hunting|vape|cigarette|nicotine|cbd|thc|slimming|weight[- ]?loss|therapy|medical|adult)\b",re.I)
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
 key,secret=creds(); ts=str(int(time.time()*1000)); sign=hashlib.md5((key+ts+secret).encode()).hexdigest()
 q=dict(params); q["sign"]=sign; q["timestamp"]=ts
 req=urllib.request.Request(BASE+path+"?"+urllib.parse.urlencode(q),headers={"apiKey":key,"Accept":"application/json","User-Agent":"HUNT-TECH-WAVE4/1.0"})
 with urllib.request.urlopen(req,timeout=12) as resp:return resp.status,json.loads(resp.read().decode("utf-8","replace"))
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
 floor=max((cost+4)/.91,cost/(.91-.35)); r=max(.99,math.ceil(floor)-.01); p=r*.91-cost
 return {"retail_usd":round(r,2),"projected_product_profit_usd":round(p,2),"projected_product_margin":round(p/r,4)}
results=[]
for i,c in enumerate(CANDS,1):
 print(f"START {i}/{len(CANDS)} {c['product_id']}",flush=True)
 try:
  row=product(c["supplier_category_id"],c["product_id"])
  if not row:
   out={**c,"status":"CATALOG_ROW_NOT_FOUND"};results.append(out);print("DONE",json.dumps(out),flush=True);continue
  title=str(row.get("title") or "").strip()
  if not title or BLOCKED.search(title):
   out={**c,"title":title,"status":"BLOCKED_TITLE"};results.append(out);print("DONE",json.dumps(out),flush=True);continue
  imap={str(x.get("id")):x.get("src") for x in row.get("imagelist") or []}
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
  picked=None
  for cost,w,ns,vid,v in variants[:6]:
   try:
    st,b=signed_get("get_product_shiping_fees.html",{"productid":c["product_id"],"variantId":vid,"countrycode":"IL"})
    sh=cheapest(b.get("data") if isinstance(b,dict) else {})
    if st==200 and str(b.get("code"))=="0" and sh:
     pg=retail(cost); ratio=round(sh["cost_usd"]/pg["retail_usd"],3); iid=str(v.get("imagesid") or "")
     picked={**c,"title":title,"status":"SHIPPING_VERIFIED_PRICE_SHADOW",
      "variant":{"id":vid,"title":v.get("title"),"supplier_cost_usd":round(cost,2),"inventory_quantity":max(0,-ns),"weight_g":w},
      "exact_variant_image_url":imap.get(iid) or row.get("imagefirst"),
      "image_scope":"EXACT_VARIANT" if imap.get(iid) else "PRODUCT_FALLBACK",
      "shipping_il":sh,"shipping_to_retail_ratio":ratio,
      "commercial_training_flag":"HIGH_SHIPPING_BURDEN" if ratio>=.8 else "NORMAL_SHIPPING_BURDEN",
      "price_gate_shadow":pg,"final_profit_verified":False,"checkout":"DISABLED","fulfillment":"DISABLED"}
     break
   except Exception:pass
  out=picked or {**c,"title":title,"status":"NO_IL_SHIPPING_QUOTE"}
  results.append(out);print("DONE",json.dumps({"id":c["product_id"],"status":out["status"],"ratio":out.get("shipping_to_retail_ratio"),"flag":out.get("commercial_training_flag")}),flush=True)
 except Exception as e:
  out={**c,"status":"ERROR","error":type(e).__name__};results.append(out);print("DONE",json.dumps(out),flush=True)
summary={"checked":len(results),"shipping_verified":sum(1 for x in results if x.get("status")=="SHIPPING_VERIFIED_PRICE_SHADOW"),"normal_shipping":sum(1 for x in results if x.get("commercial_training_flag")=="NORMAL_SHIPPING_BURDEN"),"high_shipping_review":sum(1 for x in results if x.get("commercial_training_flag")=="HIGH_SHIPPING_BURDEN"),"final_profit_verified":0,"checkout_live":0}
out={"version":"HUNT-EPROLO-TECH-WAVE4-IL-SCAN-V1","date":"2026-09-22","mode":"READ_ONLY_SHADOW","destination":"IL","production_effect":False,"summary":summary,"results":results}
(ROOT/"evidence/HUNT-EPROLO-TECH-WAVE4-IL-SCAN-2026-09-22.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print("SUMMARY",json.dumps(summary),flush=True)
